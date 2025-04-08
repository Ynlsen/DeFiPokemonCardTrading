// Test script to mint 10 specific Pokemon cards and list them for fixed price sale or auction.

const { ethers } = require("hardhat");

async function main() {
  try {
    // Get owner (deployer) and a separate account for listing
    const [owner, listerAccount] = await ethers.getSigners();
    if (!listerAccount) {
      console.error("Could not get a second account for testing. Make sure your Hardhat network config provides multiple accounts.");
      process.exit(1);
    }
    console.log("LISTING TEST (Mixed Fixed/Auction)");
    console.log("- Owner/Minter Account:", owner.address);
    console.log("- Lister/Seller Account:", listerAccount.address);

    // Get the deployed contract addresses from environment variables
    const tokenAddress = process.env.TOKEN_ADDRESS;
    const tradingAddress = process.env.TRADING_ADDRESS;

    if (!tokenAddress || !tradingAddress) {
      console.error("Contract addresses not set. Make sure to set environment variables.");
      process.exit(1);
    }

    console.log("Connecting to contracts:");
    console.log("- PokemonCardToken:", tokenAddress);
    console.log("- PokemonCardTrading:", tradingAddress);

    // Get contract instances
    const PokemonCardToken = await ethers.getContractFactory("PokemonCardToken");
    const PokemonCardTrading = await ethers.getContractFactory("PokemonCardTrading");

    const token = await PokemonCardToken.attach(tokenAddress);
    const trading = await PokemonCardTrading.attach(tradingAddress);

    console.log("Connected successfully.");

    // --- Define Listings --- 
    const listingsToCreate = [
      // { id: PokemonID, name: Name, rarity: RarityEnum (0=C, 1=R, 2=E), listingType: 'fixed'/'auction', priceValue: PriceString, priceUnit: 'ether'/'gwei'/'wei', durationSeconds: Duration (Only for Auction) }
      { id: 131, name: "Lapras",     rarity: 1, listingType: 'fixed',   priceValue: "1.5",     priceUnit: 'ether', durationSeconds: null },
      { id: 143, name: "Snorlax",    rarity: 1, listingType: 'fixed',   priceValue: "0.8",     priceUnit: 'ether', durationSeconds: null },
      { id: 142, name: "Aerodactyl", rarity: 1, listingType: 'auction', priceValue: "0.2",     priceUnit: 'ether', durationSeconds: 86400 }, // 1 day
      { id: 123, name: "Scyther",    rarity: 1, listingType: 'fixed',   priceValue: "50000",   priceUnit: 'gwei',  durationSeconds: null },
      { id: 127, name: "Pinsir",     rarity: 0, listingType: 'auction', priceValue: "1000000", priceUnit: 'wei',   durationSeconds: 3600 },  // 1 hour
      { id: 115, name: "Kangaskhan", rarity: 0, listingType: 'fixed',   priceValue: "500",     priceUnit: 'wei',   durationSeconds: null },
      { id: 149, name: "Dragonite",  rarity: 2, listingType: 'fixed',   priceValue: "3",       priceUnit: 'ether', durationSeconds: null }, // EPIC
      { id: 65,  name: "Alakazam",   rarity: 1, listingType: 'auction', priceValue: "0.1",     priceUnit: 'ether', durationSeconds: 259200}, // 3 days
      { id: 94,  name: "Gengar",     rarity: 1, listingType: 'auction', priceValue: "5000",    priceUnit: 'gwei',  durationSeconds: 86400 }, // 1 day
      { id: 133, name: "Eevee",      rarity: 0, listingType: 'fixed',   priceValue: "10000",   priceUnit: 'gwei',  durationSeconds: null }
    ];

    const mintedTokens = []; // Store { tokenId: number, details: object }

    // --- Minting Phase --- 
    console.log(`\n--- Minting ${listingsToCreate.length} Pokemon Cards ---`);
    for (const details of listingsToCreate) {
      // Mint TO the listerAccount using the owner account
      console.log(`Minting ${details.name} (ID: ${details.id}, Rarity: ${["COMMON", "RARE", "EPIC"][details.rarity]}) to ${listerAccount.address}...`);
      try {
        const mintTx = await token.connect(owner).mintPokemonCard(listerAccount.address, details.id, details.rarity);
        const receipt = await mintTx.wait();
        
        let tokenId = -1;
        const event = receipt.events?.find(log => {
            try { return token.interface.parseLog(log).name === 'PokemonCardMinted'; } catch { return false; }
        });

        if (event) {
            tokenId = event.args.tokenId.toNumber();
            mintedTokens.push({ tokenId: tokenId, details: details }); // Store details with ID
            console.log(`  ✅ Success! Minted ${details.name} with Token ID: ${tokenId}`);
        } else {
            console.error(`  ❌ FAILED to find PokemonCardMinted event for ${details.name}. Skipping listing.`);
        }
      } catch (error) {
          console.error(`  ❌ FAILED to mint ${details.name}: ${error.message}`);
      }
    }

    if (mintedTokens.length === 0) {
        console.error("\nNo tokens were successfully minted. Cannot proceed with listing.");
        process.exit(1);
    }

    // --- Listing Phase --- 
    console.log(`\n--- Listing ${mintedTokens.length} Minted Cards ---`);
    for (const { tokenId, details } of mintedTokens) {
      
      const price = ethers.utils.parseUnits(details.priceValue, details.priceUnit);
      const priceDisplay = `${details.priceValue} ${details.priceUnit}`;

      console.log(`Processing Token ID: ${tokenId} (${details.name}) for ${details.listingType} by ${listerAccount.address}...`);
      try {
        // 1. Approve FROM the listerAccount
        console.log(`  Approving trading contract for Token ID ${tokenId}...`);
        const approveTx = await token.connect(listerAccount).approve(trading.address, tokenId);
        await approveTx.wait();
        console.log(`  ✅ Approved.`);

        // 2. List FROM the listerAccount
        if (details.listingType === 'fixed') {
          console.log(`  Listing Token ID ${tokenId} for ${priceDisplay}...`);
          const listTx = await trading.connect(listerAccount).listCardForSale(tokenId, price);
          await listTx.wait();
          console.log(`  ✅ Listed (Fixed Price) successfully!`);
        } else if (details.listingType === 'auction') {
          if (!details.durationSeconds || details.durationSeconds <= 0) {
             console.error(`  ❌ Invalid duration (${details.durationSeconds}) for auction of Token ID ${tokenId}. Skipping.`);
             continue;
          }
          console.log(`  Creating Auction for Token ID ${tokenId}. Start Price: ${priceDisplay}, Duration: ${details.durationSeconds}s...`);
          const listTx = await trading.connect(listerAccount).listCardForAuction(tokenId, price, details.durationSeconds);
          await listTx.wait();
          console.log(`  ✅ Auction Created successfully!`);
        } else {
           console.warn(`  ⚠️ Unknown listing type '${details.listingType}' for Token ID ${tokenId}. Skipping.`);
        }

      } catch (error) {
        console.error(`  ❌ FAILED to process Token ID ${tokenId}: ${error.message}`);
      }
    }

    console.log("\n✅ Listing test script completed!");

  } catch (error) {
    console.error("\n❌ Test script failed with error:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });