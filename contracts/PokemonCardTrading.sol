// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./PokemonCardToken.sol";

/**
 * @title PokemonCardTrading
 * @dev Trading contract for Pokemon Card NFTs that supports fixed-price sales and auctions
 * Uses escrow to prevent sellers from transferring listed NFTs
 */
contract PokemonCardTrading is ReentrancyGuard {
    // Reference to the PokemonCardToken contract
    PokemonCardToken public pokemonCardContract;
    
    // Enum for listing type
    enum ListingType { FIXED_PRICE, AUCTION }
    
    // Struct for a listing
    struct Listing {
        address seller;
        uint256 tokenId;
        uint256 price;
        uint256 endTime; // 0 for fixed price listings, timestamp for auctions
        address highestBidder;
        uint256 highestBid;
        ListingType listingType;
        bool active;
    }
    
    // Mapping from token ID to its listing
    mapping(uint256 => Listing) public listings;
    
    // Mapping of pending withdrawals
    mapping(address => uint256) public pendingWithdrawals;
    
    // Events
    event CardListed(uint256 indexed tokenId, uint256 price, ListingType listingType, uint256 endTime, address indexed seller);
    event CardSold(uint256 indexed tokenId, uint256 price, address indexed seller, address indexed buyer);
    event AuctionBid(uint256 indexed tokenId, uint256 bid, address indexed bidder);
    event AuctionEnded(uint256 indexed tokenId, uint256 price, address indexed seller, address indexed winner);
    event CardListingCancelled(uint256 indexed tokenId, address indexed seller);
    event WithdrawalMade(address indexed recipient, uint256 amount);
    
    /**
     * @dev Constructor sets the Pokemon Card NFT contract address
     * @param _pokemonCardContract The address of the Pokemon Card NFT contract
     */
    constructor(address _pokemonCardContract) {
        pokemonCardContract = PokemonCardToken(_pokemonCardContract);
    }
    
    /**
     * @dev Lists a card for a fixed price sale
     * @param tokenId The ID of the token to list
     * @param price The price in wei
     * @notice User must approve this contract using pokemonCardContract.approve(tradingContractAddress, tokenId)
     *         before calling this function
     * @notice This function will transfer the NFT to this contract until it's sold or the listing is cancelled
     */
    function listCardForSale(uint256 tokenId, uint256 price) external {
        require(price != 0, "Price must be greater than zero");
        require(pokemonCardContract.ownerOf(tokenId) == msg.sender, "You must own the card to list it");
        
        // Check if the card already has an active listing
        require(!listings[tokenId].active, "Card already has an active listing");
        
        // Check if this contract is approved to transfer the token
        require(
            pokemonCardContract.getApproved(tokenId) == address(this) || 
            pokemonCardContract.isApprovedForAll(msg.sender, address(this)),
            "Trading contract is not approved to transfer this token"
        );
        
        // Create the listing
        listings[tokenId] = Listing({
            seller: msg.sender,
            tokenId: tokenId,
            price: price,
            endTime: 0, // Fixed price has no end time
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
     * @dev Lists a card for auction
     * @param tokenId The ID of the token to auction
     * @param startingPrice The starting price in wei
     * @param duration The duration of the auction in seconds
     * @notice User must approve this contract using pokemonCardContract.approve(tradingContractAddress, tokenId)
     *         before calling this function
     * @notice This function will transfer the NFT to this contract until it's sold or the listing is cancelled
     */
    function listCardForAuction(
        uint256 tokenId,
        uint256 startingPrice,
        uint256 duration
    ) external {
        require(startingPrice != 0, "Starting price must be greater than zero");
        require(duration != 0, "Duration must be greater than zero");
        require(pokemonCardContract.ownerOf(tokenId) == msg.sender, "You must own the card to list it");
        
        // Check if the card already has an active listing
        require(!listings[tokenId].active, "Card already has an active listing");
        
        // Check if this contract is approved to transfer the token
        require(
            pokemonCardContract.getApproved(tokenId) == address(this) || 
            pokemonCardContract.isApprovedForAll(msg.sender, address(this)),
            "Trading contract is not approved to transfer this token"
        );
        
        uint256 endTime = block.timestamp + duration;
        
        // Create the listing
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
     * @dev Buys a card that is listed for a fixed price
     * @param tokenId The ID of the token to buy
     */
    function buyCard(uint256 tokenId) external payable nonReentrant {
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
    function placeBid(uint256 tokenId) external payable nonReentrant {
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
     * @dev Ends an auction and transfers the token to the highest bidder
     * @param tokenId The ID of the token whose auction to end
     */
    function endAuction(uint256 tokenId) external nonReentrant {
        Listing storage listing = listings[tokenId];
        
        require(listing.active, "Listing is not active");
        require(listing.listingType == ListingType.AUCTION, "Card is not listed for auction");
        require(block.timestamp >= listing.endTime, "Auction has not ended yet");
        
        address seller = listing.seller;
        address winner = listing.highestBidder;
        uint256 winningBid = listing.highestBid;
        
        // Mark listing as inactive
        listing.active = false;
        
        // If there was a bid, transfer funds and the token
        if (winner != address(0)) {
            // Add funds to the seller's pending withdrawals
            pendingWithdrawals[seller] += winningBid;
            
            // Transfer the token from this contract to the winner
            pokemonCardContract.transferFrom(address(this), winner, tokenId);
            
            emit AuctionEnded(tokenId, winningBid, seller, winner);
        } else {
            // No bids, auction cancelled, return NFT to seller
            pokemonCardContract.transferFrom(address(this), seller, tokenId);
            emit CardListingCancelled(tokenId, seller);
        }
    }
    
    /**
     * @dev Cancels a listing
     * @param tokenId The ID of the token whose listing to cancel
     */
    function cancelListing(uint256 tokenId) external {
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
    
    /**
     * @dev Withdraws funds from pending withdrawals
     */
    function withdraw() external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount != 0, "No funds to withdraw");
        
        // Reset the pending withdrawal to prevent reentrancy attacks
        pendingWithdrawals[msg.sender] = 0;
        
        // Transfer the funds
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");
        
        emit WithdrawalMade(msg.sender, amount);
    }
} 