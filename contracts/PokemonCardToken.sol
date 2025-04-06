// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PokemonCardToken
 * @dev ERC721 token for Pokemon cards with metadata for Pokemon ID and rarity
 */
contract PokemonCardToken is ERC721, ERC721Enumerable, Ownable {
    uint256 private _tokenIdCounter;
    
    enum Rarity { COMMON, RARE, EPIC }
    
    // Pokemon Card struct to store data
    struct PokemonCard {
        uint8 pokemonId;  // Pokemon ID (1-151 from Gen 1)
        Rarity rarity;    // Card rarity level
    }
    
    // Mapping from token ID to Pokemon Card data
    mapping(uint256 => PokemonCard) private _pokemonCards;
    
    // Events
    event PokemonCardMinted(uint256 tokenId, uint8 pokemonId, Rarity rarity, address owner);
    
    constructor() ERC721("PokemonCardNFT", "PKMN") Ownable(msg.sender) {}
    
    /**
     * @dev Mints a new Pokemon card
     * @param to Address to mint the token to
     * @param pokemonId ID of the Pokemon (1-151)
     * @param rarity Rarity level of the card
     * @return The ID of the newly minted token
     */
    function mintPokemonCard(
        address to,
        uint8 pokemonId,
        Rarity rarity
    ) public onlyOwner returns (uint256) {
        uint256 newTokenId = _tokenIdCounter;
        _tokenIdCounter ++;

        // Create the Pokemon Card data
        _pokemonCards[newTokenId] = PokemonCard(pokemonId, rarity);
        
        // Mint the NFT
        _mint(to, newTokenId);
        
        emit PokemonCardMinted(newTokenId, pokemonId, rarity, to);
        
        return newTokenId;
    }

    /**
     * @dev Gets the data for a Pokemon card
     * @param tokenId The ID of the token
     * @return pokemonId The Pokemon ID
     * @return rarity The rarity level
     */
    function getPokemonCard(uint256 tokenId) public view returns (uint8 pokemonId, Rarity rarity) {
        require(tokenId < _tokenIdCounter, "Query for nonexistent token");
        PokemonCard storage card = _pokemonCards[tokenId];
        return (card.pokemonId, card.rarity);
    }

    // The following functions are overrides required by Solidity.
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

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
} 