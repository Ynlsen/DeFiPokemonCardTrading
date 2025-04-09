// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {PokemonCardToken} from "./PokemonCardToken.sol";

/**
 * @title PokemonCardTrading
 * @notice Manages fixed-price sales and auctions for PokemonCardToken NFTs.
 * @dev Trading contract using escrow. Relies on OpenZeppelin for security patterns.
 */
contract PokemonCardTrading is ReentrancyGuard, Pausable, Ownable {

    // Type Declarations
    enum ListingType { FIXED_PRICE, AUCTION }

    struct Listing {
        address seller;
        uint256 tokenId;
        uint256 price; // Starting price for auctions, fixed price otherwise
        uint256 endTime; // 0 for fixed price, auction end timestamp otherwise
        address highestBidder;
        uint256 highestBid;
        ListingType listingType;
        bool active;
    }

    // State Variables

    PokemonCardToken public pokemonCardContract;

    mapping(uint256 => Listing) public listings;

    mapping(address => uint256) public pendingWithdrawals;

    // Events
    event CardListed(uint256 indexed tokenId, uint256 price, ListingType listingType, uint256 endTime, address indexed seller);
    event AuctionBid(uint256 indexed tokenId, uint256 bid, address indexed bidder);
    event CardSold(uint256 indexed tokenId, uint256 price, address indexed seller, address indexed buyer);
    event AuctionEnded(uint256 indexed tokenId, uint256 price, address indexed seller, address indexed winner);
    event CardListingCancelled(uint256 indexed tokenId, address indexed seller);
    event WithdrawalMade(address indexed recipient, uint256 amount);

    // Constructor

    /**
     * @notice Initializes the contract, setting the address of the Pokemon Card NFT contract.
     * @dev Stores the provided address. Reverts if the address is zero.
     * @param _pokemonCardContract Address of the deployed PokemonCardToken contract.
     */
    constructor(address _pokemonCardContract) Ownable(msg.sender) {
        pokemonCardContract = PokemonCardToken(_pokemonCardContract);
    }

    /// External functions

    /**
     * @notice Lists an owned Pokemon card for a fixed price.
     * @dev Requires prior approval for this contract to transfer the NFT. Transfers NFT to escrow.
     * @param tokenId The ID of the token to list.
     * @param price The sale price in wei.
     */
    function listCardForSale(uint256 tokenId, uint256 price) external whenNotPaused nonReentrant {
        require(price != 0, "Price must be greater than zero");
        require(pokemonCardContract.ownerOf(tokenId) == msg.sender, "You must own the card to list it");
        require(!listings[tokenId].active, "Card already has an active listing");
        require(
            pokemonCardContract.getApproved(tokenId) == address(this) ||
            pokemonCardContract.isApprovedForAll(msg.sender, address(this)),
            "Trading contract is not approved to transfer this token"
        );

        listings[tokenId] = Listing({
            seller: msg.sender,
            tokenId: tokenId,
            price: price,
            endTime: 0,
            highestBidder: address(0),
            highestBid: 0,
            listingType: ListingType.FIXED_PRICE,
            active: true
        });

        // Transfer the NFT to this contract to hold in escrow
        pokemonCardContract.transferFrom(msg.sender, address(this), tokenId);

        emit CardListed(tokenId, price, ListingType.FIXED_PRICE, 0, msg.sender);
    }

    /**
     * @notice Lists an owned Pokemon card for auction.
     * @dev Requires prior approval for this contract to transfer the NFT. Transfers NFT to escrow.
     * @param tokenId The ID of the token to auction.
     * @param startingPrice The starting price in wei.
     * @param duration The auction duration in seconds.
     */
    function listCardForAuction(
        uint256 tokenId,
        uint256 startingPrice,
        uint256 duration
    ) external whenNotPaused nonReentrant {
        require(startingPrice != 0, "Starting price must be greater than zero");
        require(duration != 0, "Duration must be greater than zero");
        require(pokemonCardContract.ownerOf(tokenId) == msg.sender, "You must own the card to list it");
        require(!listings[tokenId].active, "Card already has an active listing");
        require(
            pokemonCardContract.getApproved(tokenId) == address(this) ||
            pokemonCardContract.isApprovedForAll(msg.sender, address(this)),
            "Trading contract is not approved to transfer this token"
        );

        uint256 endTime = block.timestamp + duration;

        listings[tokenId] = Listing({
            seller: msg.sender,
            tokenId: tokenId,
            price: startingPrice,
            endTime: endTime,
            highestBidder: address(0),
            highestBid: 0,
            listingType: ListingType.AUCTION,
            active: true
        });

        // Transfer the NFT to this contract to hold in escrow
        pokemonCardContract.transferFrom(msg.sender, address(this), tokenId);

        emit CardListed(tokenId, startingPrice, ListingType.AUCTION, endTime, msg.sender);
    }

    /**
     * @notice Ends an auction after its duration has passed.
     * @dev Transfers NFT to the winner and makes funds available for seller withdrawal. If no bids, returns NFT to seller.
     * @param tokenId The ID of the token whose auction to end.
     */
    function endAuction(uint256 tokenId) external nonReentrant whenNotPaused {
        Listing storage listing = listings[tokenId];

        require(listing.active, "Listing is not active");
        require(listing.listingType == ListingType.AUCTION, "Card is not listed for auction");
        require(block.timestamp >= listing.endTime, "Auction has not ended yet");

        address seller = listing.seller;
        address winner = listing.highestBidder;
        uint256 winningBid = listing.highestBid;

        // Mark listing as inactive
        listing.active = false;

        if (winner != address(0)) {
            // Credit seller
            pendingWithdrawals[seller] += winningBid;
            // Transfer NFT to winner
            pokemonCardContract.transferFrom(address(this), winner, tokenId);
            emit AuctionEnded(tokenId, winningBid, seller, winner);
        } else {
            // No bids - return NFT to seller
            pokemonCardContract.transferFrom(address(this), seller, tokenId);
            emit CardListingCancelled(tokenId, seller);
        }
    }

    /**
     * @notice Cancels an active listing.
     * @dev Only the seller can cancel. Auctions can only be cancelled if there are no bids. Returns NFT to seller.
     * @param tokenId The ID of the token listing to cancel.
     */
    function cancelListing(uint256 tokenId) external whenNotPaused nonReentrant {
        Listing storage listing = listings[tokenId];

        require(listing.active, "Listing is not active");
        require(listing.seller == msg.sender, "Only the seller can cancel a listing");

        // Fixed price listings can be cancelled anytime
        // Auctions can only be cancelled if there are no bids
        if (listing.listingType == ListingType.AUCTION) {
            require(listing.highestBidder == address(0), "Cannot cancel auction with bids");
        }

        // Mark listing as inactive
        listing.active = false;

        // Return the NFT to the seller
        pokemonCardContract.transferFrom(address(this), msg.sender, tokenId);

        emit CardListingCancelled(tokenId, msg.sender);
    }

    // External functions

    /**
     * @dev Buys a card that is listed for a fixed price
     * @param tokenId The ID of the token to buy
     */
    function buyCard(uint256 tokenId) external payable nonReentrant whenNotPaused {
        Listing storage listing = listings[tokenId];

        require(listing.active, "Listing is not active");
        require(listing.listingType == ListingType.FIXED_PRICE, "Card is not listed for fixed price");

        uint256 price = listing.price;
        require(msg.value >= price, "Insufficient payment");

        address seller = listing.seller;

        // Mark listing as inactive
        listing.active = false;

        // Add funds to the seller's pending withdrawals
        pendingWithdrawals[seller] += price;

        // Refund excess payment if any
        if (msg.value > price) {
            pendingWithdrawals[msg.sender] += (msg.value - price);
        }

        // Transfer the token from this contract to the buyer (no need to check ownership since we hold it)
        pokemonCardContract.transferFrom(address(this), msg.sender, tokenId);

        emit CardSold(tokenId, price, seller, msg.sender);
    }

    /**
     * @dev Places a bid on an auction
     * @param tokenId The ID of the token to bid on
     */
    function placeBid(uint256 tokenId) external payable nonReentrant whenNotPaused {
        Listing storage listing = listings[tokenId];

        require(listing.active, "Listing is not active");
        require(listing.listingType == ListingType.AUCTION, "Card is not listed for auction");
        require(block.timestamp < listing.endTime, "Auction has ended");
        require(msg.value > listing.highestBid && msg.value >= listing.price, "Bid too low");

        // Refund the previous highest bidder
        if (listing.highestBidder != address(0)) {
            pendingWithdrawals[listing.highestBidder] += listing.highestBid;
        }

        // Update highest bid info
        listing.highestBidder = msg.sender;
        listing.highestBid = msg.value;

        emit AuctionBid(tokenId, msg.value, msg.sender);
    }

    /**
     * @dev Withdraws funds from pending withdrawals
     */
    function withdraw() external nonReentrant whenNotPaused {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount != 0, "No funds to withdraw");

        // Reset the pending withdrawal to prevent reentrancy attacks
        pendingWithdrawals[msg.sender] = 0;

        // Transfer the funds
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");

        emit WithdrawalMade(msg.sender, amount);
    }

    // The following functions are overrides required by Solidity.
    
    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

} 