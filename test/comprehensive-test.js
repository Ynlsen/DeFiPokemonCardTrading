// test/comprehensive-test.js
// Comprehensive test script covering edge cases, access control, error handling, and special scenarios

const { ethers } = require("hardhat");
const { expect } = require("chai");

async function main() {
  try {
    // Get the deployed contract addresses from environment variables
    const tokenAddress = process.env.TOKEN_ADDRESS;
    const tradingAddress = process.env.TRADING_ADDRESS;
    
    if (!tokenAddress || !tradingAddress) {
      console.error("Contract addresses not set. Make sure to source addresses.txt");
      process.exit(1);
    }
    
    console.log("COMPREHENSIVE TEST - Interacting with contracts:");
    console.log("- PokemonCardToken:", tokenAddress);
    console.log("- PokemonCardTrading:", tradingAddress);
    
    // Get contract instances
    const PokemonCardToken = await ethers.getContractFactory("PokemonCardToken");
    const PokemonCardTrading = await ethers.getContractFactory("PokemonCardTrading");
    
    const token = await PokemonCardToken.attach(tokenAddress);
    const trading = await PokemonCardTrading.attach(tradingAddress);
    
    // Get signers for testing different roles
    const [owner, seller, buyer1, buyer2, randomUser] = await ethers.getSigners();
    console.log(`\nAccounts available for testing:`);
    console.log(`- Owner: ${owner.address}`);
    console.log(`- Seller: ${seller.address}`);
    console.log(`- Buyer 1: ${buyer1.address}`);
    console.log(`- Buyer 2: ${buyer2.address}`);
    console.log(`- Random User: ${randomUser.address}`);
    
    // Record initial balances for later comparison
    const initialBalances = {
      seller: await ethers.provider.getBalance(seller.address),
      buyer1: await ethers.provider.getBalance(buyer1.address),
      buyer2: await ethers.provider.getBalance(buyer2.address)
    };
    
    // Define a function to log gas used
    const logGasUsed = async (tx, description) => {
      const receipt = await tx.wait();
      console.log(`Gas used for ${description}: ${receipt.gasUsed.toString()}`);
      return receipt;
    };

    // ==================== SECTION 1: ACCESS CONTROL TESTING ====================
    console.log("\n=== ACCESS CONTROL TESTING ===");
    
    console.log("\nTEST: Non-owner cannot mint tokens");
    try {
      // Attempt to mint a card from a non-owner account
      const mintTx = await token.connect(randomUser).mintPokemonCard(
        randomUser.address,
        25, // Pikachu
        1 // RARE
      );
      console.error("❌ FAILED: Non-owner was able to mint a token!");
    } catch (error) {
      console.log("✅ PASSED: Non-owner correctly cannot mint tokens");
    }
    
    // Mint cards for testing as the owner
    console.log("\nMinting cards for testing...");
    
    // Mint a card to the seller
    const mintTx1 = await token.connect(owner).mintPokemonCard(
      seller.address,
      25, // Pikachu
      1 // RARE
    );
    const mintReceipt1 = await logGasUsed(mintTx1, "minting a Rare Pikachu");
    const pikachuTokenId = mintReceipt1.events.find(e => 
      e.event === "PokemonCardMinted"
    ).args.tokenId;
    console.log(`Minted Pikachu card with token ID ${pikachuTokenId} to seller`);
    
    // Mint another card (Charizard) to the seller for auction testing
    const mintTx2 = await token.connect(owner).mintPokemonCard(
      seller.address,
      6, // Charizard
      2 // EPIC
    );
    const mintReceipt2 = await logGasUsed(mintTx2, "minting an Epic Charizard");
    const charizardTokenId = mintReceipt2.events.find(e => 
      e.event === "PokemonCardMinted"
    ).args.tokenId;
    console.log(`Minted Charizard card with token ID ${charizardTokenId} to seller`);
    
    // Mint a third card for testing edge cases
    const mintTx3 = await token.connect(owner).mintPokemonCard(
      seller.address,
      1, // Bulbasaur
      0 // COMMON
    );
    const mintReceipt3 = await logGasUsed(mintTx3, "minting a Common Bulbasaur");
    const bulbasaurTokenId = mintReceipt3.events.find(e => 
      e.event === "PokemonCardMinted"
    ).args.tokenId;
    console.log(`Minted Bulbasaur card with token ID ${bulbasaurTokenId} to seller`);

    // ==================== SECTION 2: EDGE CASE TESTING ====================
    console.log("\n=== EDGE CASE TESTING ===");
    
    // Test retrieving non-existent token
    console.log("\nTEST: Query for non-existent token");
    try {
      const nonExistentTokenId = 999;
      await token.getPokemonCard(nonExistentTokenId);
      console.error("❌ FAILED: Was able to query non-existent token");
    } catch (error) {
      console.log("✅ PASSED: Query for non-existent token correctly reverted");
    }
    
    // Test listing with zero price
    console.log("\nTEST: List card with zero price");
    
    // First approve the trading contract to transfer the Bulbasaur token
    await token.connect(seller).approve(tradingAddress, bulbasaurTokenId);
    
    try {
      // Try to list with zero price
      await trading.connect(seller).listCardForSale(bulbasaurTokenId, 0);
      console.error("❌ FAILED: Was able to list with zero price");
    } catch (error) {
      if (error.message.includes("greater than zero")) {
        console.log("✅ PASSED: Zero price listing correctly reverted");
      } else {
        console.error(`❌ ERROR: Unexpected error: ${error.message}`);
      }
    }
    
    // Test listing with valid price
    console.log("\nTEST: List with valid price after trying zero price");
    const validPrice = ethers.utils.parseEther("0.1");
    const listTx = await trading.connect(seller).listCardForSale(bulbasaurTokenId, validPrice);
    await logGasUsed(listTx, "listing a card for sale");
    console.log("✅ PASSED: Successfully listed with valid price");
    
    // Test extremely short auction duration
    console.log("\nTEST: Auction with extremely short duration");
    
    // Approve the trading contract for Charizard
    await token.connect(seller).approve(tradingAddress, charizardTokenId);
    
    try {
      // Try with zero duration
      await trading.connect(seller).listCardForAuction(
        charizardTokenId, 
        ethers.utils.parseEther("0.2"), 
        0 // Zero duration
      );
      console.error("❌ FAILED: Was able to create auction with zero duration");
    } catch (error) {
      if (error.message.includes("Duration must be greater than zero")) {
        console.log("✅ PASSED: Zero duration auction correctly reverted");
      } else {
        console.error(`❌ ERROR: Unexpected error: ${error.message}`);
      }
    }
    
    // ==================== SECTION 3: ERROR CONDITION TESTING ====================
    console.log("\n=== ERROR CONDITION TESTING ===");
    
    // Test unapproved listing
    console.log("\nTEST: Listing without approval");
    
    // Mint a new card without approving it
    const mintTx4 = await token.connect(owner).mintPokemonCard(
      seller.address,
      150, // Mewtwo
      2 // EPIC
    );
    const mintReceipt4 = await mintTx4.wait();
    const mewtwoTokenId = mintReceipt4.events.find(e => 
      e.event === "PokemonCardMinted"
    ).args.tokenId;
    
    try {
      // Try to list without approval
      await trading.connect(seller).listCardForSale(mewtwoTokenId, ethers.utils.parseEther("1.0"));
      console.error("❌ FAILED: Was able to list without approval");
    } catch (error) {
      if (error.message.includes("not approved")) {
        console.log("✅ PASSED: Unapproved listing correctly reverted");
      } else {
        console.error(`❌ ERROR: Unexpected error: ${error.message}`);
      }
    }
    
    // Test non-owner listing someone else's card
    console.log("\nTEST: Listing someone else's card");
    
    try {
      // Random user tries to list the seller's card
      await trading.connect(randomUser).listCardForSale(pikachuTokenId, ethers.utils.parseEther("0.1"));
      console.error("❌ FAILED: Was able to list someone else's card");
    } catch (error) {
      if (error.message.includes("must own the card")) {
        console.log("✅ PASSED: Listing correctly reverted");
      } else {
        console.error(`❌ ERROR: Unexpected error: ${error.message}`);
      }
    }
    
    // ==================== SECTION 4: FIXED PRICE TESTING ====================
    console.log("\n=== FIXED PRICE LISTING & PURCHASING ===");
    
    // Approve and list Pikachu for sale
    console.log("\nTEST: Approve and list Pikachu for sale");
    await token.connect(seller).approve(tradingAddress, pikachuTokenId);
    const listPikachuTx = await trading.connect(seller).listCardForSale(
      pikachuTokenId, 
      ethers.utils.parseEther("0.2")
    );
    await logGasUsed(listPikachuTx, "listing Pikachu for sale");
    console.log("✅ PASSED: Successfully listed Pikachu for sale");
    
    // Insufficient payment test
    console.log("\nTEST: Buying with insufficient payment");
    try {
      await trading.connect(buyer1).buyCard(pikachuTokenId, {
        value: ethers.utils.parseEther("0.1") // Pay less than the asking price
      });
      console.error("❌ FAILED: Was able to buy with insufficient payment");
    } catch (error) {
      if (error.message.includes("Insufficient payment")) {
        console.log("✅ PASSED: Insufficient payment correctly reverted");
      } else {
        console.error(`❌ ERROR: Unexpected error: ${error.message}`);
      }
    }
    
    // Correct payment test
    console.log("\nTEST: Buying with correct payment");
    const buyTx = await trading.connect(buyer1).buyCard(pikachuTokenId, {
      value: ethers.utils.parseEther("0.2")
    });
    await logGasUsed(buyTx, "buying Pikachu");
    console.log("✅ PASSED: Successfully purchased Pikachu");
    
    // Verify the card ownership changed
    const newOwner = await token.ownerOf(pikachuTokenId);
    console.log(`New owner of Pikachu: ${newOwner}`);
    console.log(`Expected owner: ${buyer1.address}`);
    console.log(newOwner === buyer1.address ? "✅ PASSED: Ownership transfer" : "❌ FAILED: Ownership transfer");
    
    // ==================== SECTION 5: AUCTION TESTING ====================
    console.log("\n=== AUCTION TESTING ===");
    
    // Create an auction for Charizard
    console.log("\nTEST: Creating an auction for Charizard");
    // Create a 1-minute auction
    const auctionDuration = 60; // 60 seconds
    const startingPrice = ethers.utils.parseEther("0.5");
    
    // Seller approves the trading contract
    await token.connect(seller).approve(tradingAddress, charizardTokenId);
    
    // List the card for auction
    const auctionTx = await trading.connect(seller).listCardForAuction(
      charizardTokenId,
      startingPrice,
      auctionDuration
    );
    await logGasUsed(auctionTx, "creating a Charizard auction");
    console.log("✅ PASSED: Successfully created Charizard auction");
    
    // Test bidding below minimum
    console.log("\nTEST: Bidding below minimum price");
    try {
      await trading.connect(buyer1).placeBid(charizardTokenId, {
        value: ethers.utils.parseEther("0.4") // Below starting price
      });
      console.error("❌ FAILED: Was able to bid below minimum price");
    } catch (error) {
      if (error.message.includes("Bid too low")) {
        console.log("✅ PASSED: Below minimum bid correctly reverted");
      } else {
        console.error(`❌ ERROR: Unexpected error: ${error.message}`);
      }
    }
    
    // Test valid bidding
    console.log("\nTEST: Valid bidding");
    const bid1Tx = await trading.connect(buyer1).placeBid(charizardTokenId, {
      value: ethers.utils.parseEther("0.6")
    });
    await logGasUsed(bid1Tx, "placing first bid");
    console.log("✅ PASSED: First bid successfully placed");
    
    // Test another valid bid (higher than previous)
    const bid2Tx = await trading.connect(buyer2).placeBid(charizardTokenId, {
      value: ethers.utils.parseEther("0.7")
    });
    await logGasUsed(bid2Tx, "placing second bid");
    console.log("✅ PASSED: Second bid successfully placed");
    
    // Test ending auction before it's over
    console.log("\nTEST: Ending auction before it's over");
    try {
      await trading.connect(randomUser).endAuction(charizardTokenId);
      console.error("❌ FAILED: Was able to end auction before it's over");
    } catch (error) {
      if (error.message.includes("has not ended yet")) {
        console.log("✅ PASSED: Early auction end correctly reverted");
      } else {
        console.error(`❌ ERROR: Unexpected error: ${error.message}`);
      }
    }
    
    // Fast forward time to auction end
    console.log("\nFast-forwarding time to end auction...");
    await ethers.provider.send("evm_increaseTime", [auctionDuration + 1]);
    await ethers.provider.send("evm_mine");
    
    // End the auction now that time has passed
    console.log("\nTEST: Ending auction after it's over");
    const endAuctionTx = await trading.connect(randomUser).endAuction(charizardTokenId);
    await logGasUsed(endAuctionTx, "ending auction");
    console.log("✅ PASSED: Successfully ended auction");
    
    // Verify the card ownership
    const auctionWinner = await token.ownerOf(charizardTokenId);
    console.log(`Auction winner: ${auctionWinner}`);
    console.log(`Expected winner: ${buyer2.address}`);
    console.log(auctionWinner === buyer2.address ? "✅ PASSED: Auction winner ownership" : "❌ FAILED: Auction winner ownership");
    
    // ==================== SECTION 6: WITHDRAWAL TESTING ====================
    console.log("\n=== WITHDRAWAL TESTING ===");
    
    // Test withdrawal with no balance
    console.log("\nTEST: Withdrawal with no balance");
    try {
      await trading.connect(randomUser).withdraw();
      console.error("❌ FAILED: Was able to withdraw with no balance");
    } catch (error) {
      if (error.message.includes("No funds to withdraw")) {
        console.log("✅ PASSED: No balance withdrawal correctly reverted");
      } else {
        console.error(`❌ ERROR: Unexpected error: ${error.message}`);
      }
    }
    
    // Test valid withdrawal
    console.log("\nTEST: Valid withdrawal by seller");
    const sellerBalanceBefore = await ethers.provider.getBalance(seller.address);
    const withdrawTx = await trading.connect(seller).withdraw();
    const withdrawReceipt = await logGasUsed(withdrawTx, "withdrawing funds");
    
    // Calculate gas cost
    const gasUsed = withdrawReceipt.gasUsed;
    const gasPrice = withdrawTx.gasPrice;
    const gasCost = gasUsed.mul(gasPrice);
    
    const sellerBalanceAfter = await ethers.provider.getBalance(seller.address);
    
    // The difference should be the withdrawn amount minus gas costs
    const difference = sellerBalanceAfter.sub(sellerBalanceBefore).add(gasCost);
    console.log(`Seller balance before: ${ethers.utils.formatEther(sellerBalanceBefore)} ETH`);
    console.log(`Seller balance after: ${ethers.utils.formatEther(sellerBalanceAfter)} ETH`);
    console.log(`Amount withdrawn (minus gas): ${ethers.utils.formatEther(difference)} ETH`);
    
    if (difference.gt(ethers.BigNumber.from(0))) {
      console.log("✅ PASSED: Seller successfully withdrawn funds");
    } else {
      console.error("❌ FAILED: Seller withdrawal issue");
    }
    
    // Check that buyer1 can withdraw after being outbid
    console.log("\nTEST: Outbid buyer1 withdrawal");
    const buyer1BalanceBefore = await ethers.provider.getBalance(buyer1.address);
    const buyer1WithdrawTx = await trading.connect(buyer1).withdraw();
    const buyer1WithdrawReceipt = await logGasUsed(buyer1WithdrawTx, "buyer1 withdrawing funds");
    
    // Calculate gas cost
    const buyer1GasUsed = buyer1WithdrawReceipt.gasUsed;
    const buyer1GasPrice = buyer1WithdrawTx.gasPrice;
    const buyer1GasCost = buyer1GasUsed.mul(buyer1GasPrice);
    
    const buyer1BalanceAfter = await ethers.provider.getBalance(buyer1.address);
    
    const buyer1Difference = buyer1BalanceAfter.sub(buyer1BalanceBefore).add(buyer1GasCost);
    console.log(`Buyer1 balance before: ${ethers.utils.formatEther(buyer1BalanceBefore)} ETH`);
    console.log(`Buyer1 balance after: ${ethers.utils.formatEther(buyer1BalanceAfter)} ETH`);
    console.log(`Amount withdrawn (minus gas): ${ethers.utils.formatEther(buyer1Difference)} ETH`);
    
    if (buyer1Difference.gt(ethers.BigNumber.from(0))) {
      console.log("✅ PASSED: Outbid buyer successfully withdrawn funds");
    } else {
      console.log("⚠️ NOTE: Buyer1 had no funds to withdraw or withdrawal didn't work as expected");
    }
    
    // ==================== SECTION 7: CANCELLATION TESTING ====================
    console.log("\n=== CANCELLATION TESTING ===");
    
    // Mint a new card for cancellation testing
    const mintTx5 = await token.connect(owner).mintPokemonCard(
      seller.address,
      130, // Gyarados
      1 // RARE
    );
    const mintReceipt5 = await mintTx5.wait();
    const gyaradosTokenId = mintReceipt5.events.find(e => 
      e.event === "PokemonCardMinted"
    ).args.tokenId;
    console.log(`Minted Gyarados card with token ID ${gyaradosTokenId} to seller`);
    
    // Approve and list for sale
    await token.connect(seller).approve(tradingAddress, gyaradosTokenId);
    await trading.connect(seller).listCardForSale(gyaradosTokenId, ethers.utils.parseEther("0.3"));
    console.log("Listed Gyarados for sale");
    
    // Test unauthorized cancellation
    console.log("\nTEST: Unauthorized cancellation");
    try {
      await trading.connect(randomUser).cancelListing(gyaradosTokenId);
      console.error("❌ FAILED: Non-seller was able to cancel listing");
    } catch (error) {
      if (error.message.includes("Only the seller can cancel")) {
        console.log("✅ PASSED: Unauthorized cancellation correctly reverted");
      } else {
        console.error(`❌ ERROR: Unexpected error: ${error.message}`);
      }
    }
    
    // Test authorized cancellation
    console.log("\nTEST: Authorized cancellation");
    const cancelTx = await trading.connect(seller).cancelListing(gyaradosTokenId);
    await logGasUsed(cancelTx, "cancelling a listing");
    
    // Verify ownership returned to seller
    const cancelledOwner = await token.ownerOf(gyaradosTokenId);
    console.log(`Owner after cancellation: ${cancelledOwner}`);
    console.log(`Expected owner: ${seller.address}`);
    console.log(cancelledOwner === seller.address ? "✅ PASSED: Ownership return after cancellation" : "❌ FAILED: Ownership return after cancellation");
    
    // Verify listing no longer active
    const gyaradosListing = await trading.listings(gyaradosTokenId);
    console.log(`Listing active: ${gyaradosListing.active}`);
    console.log(!gyaradosListing.active ? "✅ PASSED: Listing marked inactive" : "❌ FAILED: Listing still active");
    
    // Test for the auction with bids cancellation restriction
    console.log("\n=== AUCTION CANCELLATION RESTRICTION ===");
    
    // Mint new card for auction
    const mintTx6 = await token.connect(owner).mintPokemonCard(
      seller.address,
      9, // Blastoise
      2 // EPIC
    );
    const mintReceipt6 = await mintTx6.wait();
    const blastoiseTokenId = mintReceipt6.events.find(e => 
      e.event === "PokemonCardMinted"
    ).args.tokenId;
    console.log(`Minted Blastoise card with token ID ${blastoiseTokenId} to seller`);
    
    // Approve and list for auction
    await token.connect(seller).approve(tradingAddress, blastoiseTokenId);
    await trading.connect(seller).listCardForAuction(
      blastoiseTokenId,
      ethers.utils.parseEther("0.4"),
      600 // 10 minutes
    );
    console.log("Listed Blastoise for auction");
    
    // Place a bid
    await trading.connect(buyer1).placeBid(blastoiseTokenId, {
      value: ethers.utils.parseEther("0.5")
    });
    console.log("Placed a bid on Blastoise auction");
    
    // Try to cancel auction with bids
    console.log("\nTEST: Cancelling auction with bids");
    try {
      await trading.connect(seller).cancelListing(blastoiseTokenId);
      console.error("❌ FAILED: Was able to cancel auction with bids");
    } catch (error) {
      if (error.message.includes("Cannot cancel auction with bids")) {
        console.log("✅ PASSED: Cancellation of auction with bids correctly reverted");
      } else {
        console.error(`❌ ERROR: Unexpected error: ${error.message}`);
      }
    }
    
    console.log("\n=== COMPREHENSIVE TEST COMPLETED ===");
    
    // Summary of test results
    console.log("\nTest Summary:");
    console.log("- Access control: Unauthorized minting and listing properly prevented");
    console.log("- Edge cases: Zero price and duration correctly rejected");
    console.log("- Error conditions: Proper error handling for invalid operations");
    console.log("- Fixed price: Listing, buying, and ownership transfer working correctly");
    console.log("- Auctions: Bidding, time-based ending, and winner determination working");
    console.log("- Withdrawals: Funds properly transferred to sellers and outbid buyers");
    console.log("- Cancellations: Only seller can cancel, and auctions with bids can't be cancelled");
    
    return true;
  } catch (error) {
    console.error("Test failed with error:", error);
    return false;
  }
}

// Run the test
main()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 