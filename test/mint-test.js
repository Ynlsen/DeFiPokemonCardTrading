const { ethers } = require("hardhat");

// This script demonstrates how to mint and list a Pokemon Card for testing
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Testing contract functions using account:", deployer.address);
  
  // Get the deployed contract instances 
  // Replace with your actual contract addresses after deployment
  const pokemonCardTokenAddress = process.env.TOKEN_ADDRESS;
  const pokemonCardTradingAddress = process.env.TRADING_ADDRESS;
  
  if (!pokemonCardTokenAddress || !pokemonCardTradingAddress) {
    console.log("Please set the TOKEN_ADDRESS and TRADING_ADDRESS environment variables");
    console.log("Example: TOKEN_ADDRESS=0x... TRADING_ADDRESS=0x... npx hardhat run test/mint-test.js --network localhost");
    process.exit(1);
  }
  
  const PokemonCardToken = await ethers.getContractFactory("PokemonCardToken");
  const pokemonCardToken = PokemonCardToken.attach(pokemonCardTokenAddress);
  
  const PokemonCardTrading = await ethers.getContractFactory("PokemonCardTrading");
  const pokemonCardTrading = PokemonCardTrading.attach(pokemonCardTradingAddress);
  
  console.log("Connected to PokemonCardToken at:", pokemonCardToken.address);
  console.log("Connected to PokemonCardTrading at:", pokemonCardTrading.address);
  
  // Mint a new Pokemon card (Pikachu - ID 25, RARE)
  console.log("\nTEST: Minting a new Pokemon card...");
  const mintTx = await pokemonCardToken.mintPokemonCard(
    deployer.address, // Mint to the deployer's address
    25,               // Pokemon ID (25 for Pikachu)
    1                 // Rarity (1 for RARE)
  );
  
  const receipt = await mintTx.wait();
  console.log("Minted Pokemon card in transaction:", receipt.hash);
  
  // Extract the token ID from the event
  const event = receipt.logs.find(log => {
    try {
      return pokemonCardToken.interface.parseLog(log).name === 'PokemonCardMinted';
    } catch (e) {
      return false;
    }
  });
  
  if (!event) {
    console.log("Could not find PokemonCardMinted event. Using tokenId 0 for testing.");
    var tokenId = 0;
  } else {
    const parsedEvent = pokemonCardToken.interface.parseLog(event);
    var tokenId = parsedEvent.args.tokenId;
    console.log("Minted token ID:", tokenId.toString());
  }
  
  // Get the Pokemon card details
  const card = await pokemonCardToken.getPokemonCard(tokenId);
  console.log("Pokemon card details:");
  console.log("  Pokemon ID:", card[0].toString());
  console.log("  Rarity:", ["COMMON", "RARE", "EPIC"][card[1]]);
  
  // List the card for sale
  const priceInWei = ethers.utils.parseEther("0.1"); // 0.1 ETH
  
  console.log("\nTEST: Approving trading contract to transfer the token...");
  const approveTx = await pokemonCardToken.approve(pokemonCardTrading.address, tokenId);
  await approveTx.wait();
  
  console.log("TEST: Listing Pokemon card for sale at", ethers.utils.formatEther(priceInWei), "ETH...");
  const listTx = await pokemonCardTrading.listCardForSale(tokenId, priceInWei);
  await listTx.wait();
  
  console.log("Successfully listed Pokemon card for sale!");
  
  // Get listing information to verify
  const listing = await pokemonCardTrading.listings(tokenId);
  console.log("\nListing information:");
  console.log("  Seller:", listing.seller);
  console.log("  Price:", ethers.utils.formatEther(listing.price), "ETH");
  console.log("  Active:", listing.active);
  
  console.log("\nTest script completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 