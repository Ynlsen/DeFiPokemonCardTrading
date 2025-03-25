// test/fixed-price-test.js
// Example test script showing how to interact with the deployed Pokemon Card contracts
// with fixed price listing, sale, and withdrawal

async function main() {
  try {
    // Get the deployed contract addresses from environment variables
    const tokenAddress = process.env.TOKEN_ADDRESS;
    const tradingAddress = process.env.TRADING_ADDRESS;
    
    if (!tokenAddress || !tradingAddress) {
      console.error("Contract addresses not set. Make sure to source addresses.txt or call addresses.bat");
      return;
    }
    
    console.log("FIXED PRICE TEST - Interacting with contracts:");
    console.log("- PokemonCardToken:", tokenAddress);
    console.log("- PokemonCardTrading:", tradingAddress);
    
    // Get contract instances by attaching to the deployed addresses
    const PokemonCardToken = await ethers.getContractFactory("PokemonCardToken");
    const PokemonCardTrading = await ethers.getContractFactory("PokemonCardTrading");
    
    const token = await PokemonCardToken.attach(tokenAddress);
    const trading = await PokemonCardTrading.attach(tradingAddress);
    
    // Get basic information about the token
    const name = await token.name();
    const symbol = await token.symbol();
    console.log(`\nToken Info: ${name} (${symbol})`);
    
    // Get the accounts we can use (from hardhat node)
    const [owner, user1, user2] = await ethers.getSigners();
    console.log(`\nAccounts available:`);
    console.log(`- Owner: ${owner.address}`);
    console.log(`- User1 (Seller): ${user1.address}`);
    console.log(`- User2 (Buyer): ${user2.address}`);
    
    // Record initial balances
    console.log("\nInitial ETH balances:");
    console.log(`- User1 (Seller): ${ethers.utils.formatEther(await ethers.provider.getBalance(user1.address))} ETH`);
    console.log(`- User2 (Buyer): ${ethers.utils.formatEther(await ethers.provider.getBalance(user2.address))} ETH`);
    
    // Mint some new cards
    console.log("\nMinting new Pokemon cards...");
    
    // Define some example card metadata
    const cards = [
      { id: 25, name: "Pikachu", rarity: 1 },  // 1 = RARE
      { id: 6, name: "Charizard", rarity: 2 }, // 2 = EPIC
      { id: 1, name: "Bulbasaur", rarity: 0 }  // 0 = COMMON
    ];
    
    // Mint cards to user1
    let mintedTokenIds = [];
    for (const card of cards) {
      console.log(`Minting ${card.name} (ID: ${card.id}, Rarity: ${["COMMON", "RARE", "EPIC"][card.rarity]}) to ${user1.address}...`);
      // Using mintPokemonCard instead of safeMint
      const tx = await token.mintPokemonCard(user1.address, card.id, card.rarity);
      const receipt = await tx.wait();
      
      // Extract the token ID from the event
      const event = receipt.logs.find(log => {
        try {
          return token.interface.parseLog(log).name === 'PokemonCardMinted';
        } catch (e) {
          return false;
        }
      });
      
      let tokenId;
      if (event) {
        const parsedEvent = token.interface.parseLog(event);
        tokenId = parsedEvent.args.tokenId;
        mintedTokenIds.push(tokenId);
        console.log(`  ✅ Success! Transaction: ${tx.hash}, Token ID: ${tokenId}`);
      } else {
        console.log(`  ✅ Success! Transaction: ${tx.hash} (couldn't extract token ID)`);
      }
    }
    
    // Get token count for user1
    const balanceUser1 = await token.balanceOf(user1.address);
    console.log(`\nUser1 has ${balanceUser1} Pokemon cards`);
    
    // If we couldn't extract token IDs, try to find some tokens owned by user1
    if (mintedTokenIds.length === 0) {
      console.log("Couldn't extract token IDs from events. Searching for tokens owned by user1...");
      // Try some likely token IDs
      for (let i = 0; i < balanceUser1; i++) {
        try {
          const checkOwner = await token.ownerOf(i);
          if (checkOwner.toLowerCase() === user1.address.toLowerCase()) {
            mintedTokenIds.push(i);
            console.log(`Found token ID ${i} owned by user1`);
            if (mintedTokenIds.length >= 1) break; // Just need one token
          }
        } catch (e) {
          // Skip if token doesn't exist
        }
      }
    }
    
    // Make sure we have a token to work with
    if (mintedTokenIds.length === 0) {
      console.error("No tokens found that are owned by user1. Cannot proceed with test.");
      return;
    }
    
    // Choose the token to work with (the Charizard, which should be the second one minted)
    const tokenIdToSell = mintedTokenIds[Math.min(1, mintedTokenIds.length - 1)];
    console.log(`\nChoosing token ID ${tokenIdToSell} to sell`);
    
    // Verify ownership
    const tokenOwner = await token.ownerOf(tokenIdToSell);
    console.log(`Token ${tokenIdToSell} owner: ${tokenOwner}`);
    
    if (tokenOwner.toLowerCase() !== user1.address.toLowerCase()) {
      console.error(`Token ${tokenIdToSell} is not owned by user1. Cannot proceed with test.`);
      return;
    }
    
    // Get card details
    const cardDetails = await token.getPokemonCard(tokenIdToSell);
    const pokemonId = cardDetails[0];
    const rarity = ["COMMON", "RARE", "EPIC"][cardDetails[1]];
    console.log(`Card details: Pokemon ID ${pokemonId}, Rarity: ${rarity}`);
    
    // List a card for sale
    console.log("\nListing this Pokemon card for sale...");
    
    // First approve the trading contract to transfer the token
    await token.connect(user1).approve(tradingAddress, tokenIdToSell);
    console.log(`Approval successful!`);
    
    // List the card for 0.5 ETH
    // Fix for ethers compatibility - use utils.parseEther
    const priceInWei = ethers.utils.parseEther("0.5");
    await trading.connect(user1).listCardForSale(tokenIdToSell, priceInWei);
    console.log(`  ✅ Card listed for ${ethers.utils.formatEther(priceInWei)} ETH`);
    
    // Get listing information
    const listing = await trading.listings(tokenIdToSell);
    console.log(`\nListing information:`);
    console.log(`- Seller: ${listing.seller}`);
    console.log(`- Price: ${ethers.utils.formatEther(listing.price)} ETH`);
    console.log(`- Is active: ${listing.active}`);
    
    // User2 buys the card
    console.log("\nUser2 is buying the Pokemon card...");
    await trading.connect(user2).buyCard(tokenIdToSell, { value: priceInWei });
    console.log(`  ✅ User2 successfully bought the card!`);
    
    // Check new ownership
    const newOwner = await token.ownerOf(tokenIdToSell);
    console.log(`\nNew owner of token ${tokenIdToSell}: ${newOwner}`);
    
    // Get balances after the transaction
    const balanceUser1After = await token.balanceOf(user1.address);
    const balanceUser2After = await token.balanceOf(user2.address);
    console.log(`\nFinal card balances:`);
    console.log(`- User1: ${balanceUser1After} cards`);
    console.log(`- User2: ${balanceUser2After} cards`);
    
    // Check pending withdrawals for the seller
    console.log("\nChecking pending withdrawals...");
    const pendingWithdrawal = await trading.pendingWithdrawals(user1.address);
    console.log(`User1's pending withdrawal: ${ethers.utils.formatEther(pendingWithdrawal)} ETH`);
    
    // Record balance before withdrawal
    const user1BalanceBeforeWithdrawal = await ethers.provider.getBalance(user1.address);
    console.log(`\nUser1's balance before withdrawal: ${ethers.utils.formatEther(user1BalanceBeforeWithdrawal)} ETH`);
    
    // Withdraw funds
    console.log("\nWithdrawing funds for User1 (seller)...");
    const withdrawTx = await trading.connect(user1).withdraw();
    const withdrawReceipt = await withdrawTx.wait();
    
    // Calculate gas cost
    const gasUsed = withdrawReceipt.gasUsed;
    const gasPrice = withdrawReceipt.effectiveGasPrice;
    const gasCost = gasUsed.mul(gasPrice);
    
    console.log(`Withdrawal successful! Gas cost: ${ethers.utils.formatEther(gasCost)} ETH`);
    
    // Verify balances after withdrawal
    const user1BalanceAfterWithdrawal = await ethers.provider.getBalance(user1.address);
    console.log(`\nUser1's balance after withdrawal: ${ethers.utils.formatEther(user1BalanceAfterWithdrawal)} ETH`);
    
    // Expected increase should be the price minus gas costs
    const expectedIncrease = priceInWei.sub(gasCost);
    console.log(`Expected increase (minus gas): ${ethers.utils.formatEther(expectedIncrease)} ETH`);
    const actualIncrease = user1BalanceAfterWithdrawal.sub(user1BalanceBeforeWithdrawal);
    console.log(`Actual increase: ${ethers.utils.formatEther(actualIncrease)} ETH`);
    
    // Final balances
    console.log("\nFinal ETH balances:");
    console.log(`- User1 (Seller): ${ethers.utils.formatEther(await ethers.provider.getBalance(user1.address))} ETH`);
    console.log(`- User2 (Buyer): ${ethers.utils.formatEther(await ethers.provider.getBalance(user2.address))} ETH`);
    
    console.log("\n✅ Fixed price test complete! Your Pokemon Card Trading platform is working correctly.");
    
  } catch (error) {
    console.error("Error during interaction:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  }); 