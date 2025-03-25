// test/auction-test.js
// Test script for Pokemon Card auction functionality and fund withdrawals

const { ethers } = require("hardhat");

async function main() {
  try {
    // Get the deployed contract addresses from environment variables
    const tokenAddress = process.env.TOKEN_ADDRESS;
    const tradingAddress = process.env.TRADING_ADDRESS;
    
    if (!tokenAddress || !tradingAddress) {
      console.error("Contract addresses not set. Make sure to source addresses.txt or call addresses.bat");
      return;
    }
    
    console.log("AUCTION TEST - Interacting with contracts:");
    console.log("- PokemonCardToken:", tokenAddress);
    console.log("- PokemonCardTrading:", tradingAddress);
    
    // Get contract instances by attaching to the deployed addresses
    const PokemonCardToken = await ethers.getContractFactory("PokemonCardToken");
    const PokemonCardTrading = await ethers.getContractFactory("PokemonCardTrading");
    
    const token = await PokemonCardToken.attach(tokenAddress);
    const trading = await PokemonCardTrading.attach(tradingAddress);
    
    // Get the accounts we can use (from hardhat node)
    const [owner, seller, bidder1, bidder2, bidder3] = await ethers.getSigners();
    console.log(`\nAccounts available for auction test:`);
    console.log(`- Owner: ${owner.address}`);
    console.log(`- Seller: ${seller.address}`);
    console.log(`- Bidder1: ${bidder1.address}`);
    console.log(`- Bidder2: ${bidder2.address}`);
    console.log(`- Bidder3: ${bidder3.address}`);
    
    // Initial balances
    console.log("\nInitial ETH balances:");
    console.log(`- Seller: ${ethers.utils.formatEther(await ethers.provider.getBalance(seller.address))} ETH`);
    console.log(`- Bidder1: ${ethers.utils.formatEther(await ethers.provider.getBalance(bidder1.address))} ETH`);
    console.log(`- Bidder2: ${ethers.utils.formatEther(await ethers.provider.getBalance(bidder2.address))} ETH`);
    
    // Step 1: Mint a rare Pokemon card for the seller
    console.log("\n1. Minting a rare Pokemon card (Mewtwo)...");
    const tx = await token.mintPokemonCard(
      seller.address,
      150,  // Pokemon ID for Mewtwo
      2     // EPIC rarity
    );
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
      console.log(`Minted Mewtwo card with Token ID: ${tokenId}`);
    } else {
      console.log("Couldn't extract token ID from event. Using tokenId 0 for testing.");
      tokenId = 0;
    }
    
    // Get card details
    const cardDetails = await token.getPokemonCard(tokenId);
    console.log(`Card details: Pokemon ID ${cardDetails[0]}, Rarity: ${["COMMON", "RARE", "EPIC"][cardDetails[1]]}`);
    
    // Step 2: Approve and list the card for auction
    console.log("\n2. Listing Mewtwo card for auction...");
    await token.connect(seller).approve(tradingAddress, tokenId);
    
    // Auction settings
    const startingPrice = ethers.utils.parseEther("0.1");  // Starting price: 0.1 ETH
    const auctionDuration = 60 * 5;                        // 5 minutes in seconds
    
    await trading.connect(seller).listCardForAuction(
      tokenId,
      startingPrice,
      auctionDuration
    );
    
    console.log(`Card listed for auction with starting price: ${ethers.utils.formatEther(startingPrice)} ETH`);
    console.log(`Auction duration: ${auctionDuration} seconds`);
    
    // Step 3: Place bids with multiple users
    console.log("\n3. Multiple users placing bids...");
    
    // Bidder 1 places first bid
    const bid1 = ethers.utils.parseEther("0.15");
    await trading.connect(bidder1).placeBid(tokenId, { value: bid1 });
    console.log(`Bidder1 placed bid: ${ethers.utils.formatEther(bid1)} ETH`);
    
    // Bidder 2 outbids bidder 1
    const bid2 = ethers.utils.parseEther("0.2");
    await trading.connect(bidder2).placeBid(tokenId, { value: bid2 });
    console.log(`Bidder2 placed bid: ${ethers.utils.formatEther(bid2)} ETH`);
    
    // Bidder 1 outbids bidder 2
    const bid3 = ethers.utils.parseEther("0.25");
    await trading.connect(bidder1).placeBid(tokenId, { value: bid3 });
    console.log(`Bidder1 placed higher bid: ${ethers.utils.formatEther(bid3)} ETH`);
    
    // Step 4: Check auction status
    console.log("\n4. Checking auction status...");
    const auctionInfo = await trading.listings(tokenId);
    console.log(`- Seller: ${auctionInfo.seller}`);
    console.log(`- Highest bidder: ${auctionInfo.highestBidder}`);
    console.log(`- Highest bid: ${ethers.utils.formatEther(auctionInfo.highestBid)} ETH`);
    console.log(`- End time: ${new Date(auctionInfo.endTime * 1000).toLocaleString()}`);
    console.log(`- Is auction: ${auctionInfo.listingType === 1 ? "Yes" : "No"}`);
    console.log(`- Is active: ${auctionInfo.active ? "Yes" : "No"}`);
    
    // Step 5: Fast-forward time to end the auction
    console.log("\n5. Fast-forwarding time to end the auction...");
    
    // Using hardhat's time manipulation capabilities to move forward
    await ethers.provider.send("evm_increaseTime", [auctionDuration + 1]);
    await ethers.provider.send("evm_mine", []);
    
    console.log("Time fast-forwarded past auction end time");
    
    // Step 6: End the auction
    console.log("\n6. Ending the auction...");
    await trading.connect(seller).endAuction(tokenId);
    console.log("Auction ended successfully");
    
    // Step 7: Check that the winner (bidder1) received the NFT
    const newOwner = await token.ownerOf(tokenId);
    console.log(`\n7. New owner of Mewtwo card: ${newOwner}`);
    console.log(`Expected winner: ${bidder1.address}`);
    console.log(`Winner is correct: ${newOwner.toLowerCase() === bidder1.address.toLowerCase() ? "Yes" : "No"}`);
    
    // Step 8: Check pending withdrawals
    console.log("\n8. Checking pending withdrawals...");
    const pendingWithdrawal = await trading.pendingWithdrawals(seller.address);
    console.log(`Seller's pending withdrawal: ${ethers.utils.formatEther(pendingWithdrawal)} ETH`);
    
    // Step 9: Record balances before withdrawal
    const sellerBalanceBefore = await ethers.provider.getBalance(seller.address);
    console.log(`\n9. Seller's balance before withdrawal: ${ethers.utils.formatEther(sellerBalanceBefore)} ETH`);
    
    // Step 10: Withdraw funds
    console.log("\n10. Withdrawing funds for seller...");
    const withdrawTx = await trading.connect(seller).withdraw();
    const withdrawReceipt = await withdrawTx.wait();
    
    // Calculate gas cost
    const gasUsed = withdrawReceipt.gasUsed;
    const gasPrice = withdrawReceipt.effectiveGasPrice;
    const gasCost = gasUsed.mul(gasPrice);
    
    console.log(`Withdrawal successful! Gas cost: ${ethers.utils.formatEther(gasCost)} ETH`);
    
    // Step 11: Verify balances after withdrawal
    const sellerBalanceAfter = await ethers.provider.getBalance(seller.address);
    console.log(`\n11. Seller's balance after withdrawal: ${ethers.utils.formatEther(sellerBalanceAfter)} ETH`);
    
    // Expected increase should be bid amount minus gas costs
    const expectedIncrease = bid3.sub(gasCost);
    console.log(`Expected increase (minus gas): ${ethers.utils.formatEther(expectedIncrease)} ETH`);
    
    // Check bidder balances - refunds should have been processed
    console.log("\nBidder balances after auction:");
    console.log(`- Bidder1 (winner): ${ethers.utils.formatEther(await ethers.provider.getBalance(bidder1.address))} ETH`);
    console.log(`- Bidder2 (outbid): ${ethers.utils.formatEther(await ethers.provider.getBalance(bidder2.address))} ETH`);
    
    // Check if Bidder2 was refunded
    const bidder2PendingWithdrawal = await trading.pendingWithdrawals(bidder2.address);
    console.log(`Bidder2's pending withdrawal: ${ethers.utils.formatEther(bidder2PendingWithdrawal)} ETH`);
    
    // If Bidder2 has pending withdrawals, withdraw them
    if (!bidder2PendingWithdrawal.isZero()) {
      console.log("\nWithdrawing funds for Bidder2...");
      await trading.connect(bidder2).withdraw();
      console.log(`Bidder2 withdrawal complete. New balance: ${ethers.utils.formatEther(await ethers.provider.getBalance(bidder2.address))} ETH`);
    }
    
    console.log("\n✅ Auction and withdrawal test complete!");
    
  } catch (error) {
    console.error("Error during auction test:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  }); 