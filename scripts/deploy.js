const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying Pokemon Card NFT contracts...");

  // Get the contract factory
  const PokemonCardToken = await ethers.getContractFactory("PokemonCardToken");
  
  // Deploy PokemonCardToken
  console.log("Deploying PokemonCardToken...");
  const pokemonCardToken = await PokemonCardToken.deploy();
  await pokemonCardToken.deployTransaction.wait();
  
  console.log("PokemonCardToken deployed to:", pokemonCardToken.address);

  // Deploy PokemonCardTrading with the address of PokemonCardToken
  const PokemonCardTrading = await ethers.getContractFactory("PokemonCardTrading");
  
  console.log("Deploying PokemonCardTrading...");
  const pokemonCardTrading = await PokemonCardTrading.deploy(pokemonCardToken.address);
  await pokemonCardTrading.deployTransaction.wait();
  
  console.log("PokemonCardTrading deployed to:", pokemonCardTrading.address);
  
  console.log("Deployment complete!");
  
  // Return the contract addresses for testing purposes
  return { pokemonCardToken, pokemonCardTrading };
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 