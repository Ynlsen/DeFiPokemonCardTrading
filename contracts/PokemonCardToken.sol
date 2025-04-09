// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PokemonCardToken
 * @dev ERC721 token for Pokemon cards with metadata for Pokemon ID and rarity.
 */
contract PokemonCardToken is ERC721, ERC721Enumerable, Ownable {
    // Type Declarations
    enum Rarity { COMMON, RARE, EPIC }

    struct PokemonCard {
        uint8 pokemonId;  // Pokemon ID (1-151 from Gen 1)
        Rarity rarity;    // Card rarity level
    }

    // State Variables
    uint256 private _tokenIdCounter;
    mapping(uint256 => PokemonCard) private _pokemonCards;

    // Events
    event PokemonCardMinted(uint256 tokenId, uint8 pokemonId, Rarity rarity, address owner);
    
    constructor() ERC721("PokemonCardNFT", "PKMN") Ownable(msg.sender) {}

    // External functions

    /**
     * @notice Mints a new Pokemon card NFT to a specified address.
     * @dev Creates a new token with associated Pokemon data. Only callable by the owner.
     * @param to Address to mint the token to.
     * @param pokemonId ID of the Pokemon (1-151).
     * @param rarity Rarity level of the card (COMMON, RARE, EPIC).
     * @return The ID of the newly minted token.
     */
    function mintPokemonCard(
        address to,
        uint8 pokemonId,
        Rarity rarity
    ) external onlyOwner returns (uint256) {
        uint256 newTokenId = _tokenIdCounter;
        _tokenIdCounter++;

        // Create the Pokemon Card data
        _pokemonCards[newTokenId] = PokemonCard(pokemonId, rarity);

        // Mint the NFT
        _mint(to, newTokenId);

        emit PokemonCardMinted(newTokenId, pokemonId, rarity, to);

        return newTokenId;
    }

    // External view functions

    /**
     * @notice Gets the Pokemon ID and rarity for a specific token ID.
     * @dev Retrieves card data from storage. Reverts if the token ID does not exist.
     * @param tokenId The ID of the token to query.
     * @return pokemonId The Pokemon ID (1-151).
     * @return rarity The rarity level (COMMON, RARE, EPIC).
     */
    function getPokemonCard(uint256 tokenId) external view returns (uint8 pokemonId, Rarity rarity) {
        require(tokenId < _tokenIdCounter, "Query for nonexistent token");
        PokemonCard storage card = _pokemonCards[tokenId];
        return (card.pokemonId, card.rarity);
    }

    // The following functions are overrides required by Solidity.

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
    
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }
} 