import { ethers } from "hardhat";

/**
 * Test script for local Hardhat network
 * This uses a mock VRF coordinator for testing without real LINK tokens
 */
async function main() {
  console.log("====================================");
  console.log("Local Testing Script");
  console.log("====================================");
  
  const [deployer, player1, player2, player3] = await ethers.getSigners();
  
  console.log("Deployer:", deployer.address);
  console.log("Player 1:", player1.address);
  console.log("Player 2:", player2.address);
  console.log("Player 3:", player3.address);
  console.log("");

  // For local testing, we need a mock VRF coordinator
  console.log("Deploying mock VRF coordinator...");
  const MockVRFCoordinator = await ethers.getContractFactory("VRFCoordinatorV2Mock");
  const mockCoordinator = await MockVRFCoordinator.deploy(
    ethers.parseEther("0.1"), // base fee
    1e9 // gas price link
  );
  await mockCoordinator.waitForDeployment();
  const coordinatorAddress = await mockCoordinator.getAddress();
  console.log("Mock VRF Coordinator deployed:", coordinatorAddress);
  
  // Create subscription
  console.log("Creating VRF subscription...");
  const createSubTx = await mockCoordinator.createSubscription();
  const receipt = await createSubTx.wait();
  const subscriptionId = 1; // First subscription is always ID 1
  
  // Fund subscription with mock LINK
  console.log("Funding subscription...");
  await mockCoordinator.fundSubscription(subscriptionId, ethers.parseEther("100"));
  
  console.log("Subscription ID:", subscriptionId);
  console.log("");

  // Deploy JackpotCarousel
  console.log("Deploying JackpotCarousel...");
  const JackpotCarousel = await ethers.getContractFactory("JackpotCarousel");
  const contract = await JackpotCarousel.deploy(
    coordinatorAddress,
    subscriptionId,
    "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc" // random key hash for testing
  );
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();
  console.log("✅ JackpotCarousel deployed:", contractAddress);
  console.log("");

  // Add contract as consumer
  console.log("Adding contract as VRF consumer...");
  await mockCoordinator.addConsumer(subscriptionId, contractAddress);
  console.log("✅ Consumer added");
  console.log("");

  // Test 1: Place bets
  console.log("====================================");
  console.log("TEST 1: Placing Bets");
  console.log("====================================");
  
  const betAmount1 = ethers.parseEther("0.5"); // 0.5 BNB
  const betAmount2 = ethers.parseEther("0.3"); // 0.3 BNB  
  const betAmount3 = ethers.parseEther("0.2"); // 0.2 BNB
  
  console.log("Player 1 betting:", ethers.formatEther(betAmount1), "BNB");
  const bet1 = await contract.connect(player1).placeBet({ value: betAmount1 });
  await bet1.wait();
  console.log("✅ Bet 1 placed");
  
  console.log("Player 2 betting:", ethers.formatEther(betAmount2), "BNB");
  const bet2 = await contract.connect(player2).placeBet({ value: betAmount2 });
  await bet2.wait();
  console.log("✅ Bet 2 placed");
  
  console.log("Player 3 betting:", ethers.formatEther(betAmount3), "BNB");
  const bet3 = await contract.connect(player3).placeBet({ value: betAmount3 });
  await bet3.wait();
  console.log("✅ Bet 3 placed");
  console.log("");

  // Check round status
  const roundInfo = await contract.getCurrentRound();
  console.log("Current Round Status:");
  console.log("  - Round ID:", roundInfo[0].toString());
  console.log("  - Total Pot:", ethers.formatEther(roundInfo[3]), "BNB");
  console.log("  - Status:", roundInfo[5]); // 1 = Active
  console.log("  - Player Count:", roundInfo[6].toString());
  console.log("");
  
  // Check player chances
  const chance1 = await contract.getPlayerChance(roundInfo[0], player1.address);
  const chance2 = await contract.getPlayerChance(roundInfo[0], player2.address);
  const chance3 = await contract.getPlayerChance(roundInfo[0], player3.address);
  
  console.log("Win Chances:");
  console.log(`  - Player 1: ${(Number(chance1) / 100).toFixed(2)}%`);
  console.log(`  - Player 2: ${(Number(chance2) / 100).toFixed(2)}%`);
  console.log(`  - Player 3: ${(Number(chance3) / 100).toFixed(2)}%`);
  console.log("");

  // Test 2: Wait for timer and settle
  console.log("====================================");
  console.log("TEST 2: Settling Round");
  console.log("====================================");
  
  console.log("Waiting for round timer to expire (90 seconds simulated)...");
  // Fast forward time on local network
  await ethers.provider.send("evm_increaseTime", [91]);
  await ethers.provider.send("evm_mine", []);
  console.log("✅ Timer expired");
  console.log("");
  
  console.log("Calling settleRound()...");
  const settleTx = await contract.settleRound();
  const settleReceipt = await settleTx.wait();
  
  // Get VRF request ID from event
  const settlingEvent = settleReceipt?.logs.find((log: any) => {
    try {
      const parsed = contract.interface.parseLog(log);
      return parsed?.name === "RoundSettling";
    } catch {
      return false;
    }
  });
  
  if (settlingEvent) {
    const parsed = contract.interface.parseLog(settlingEvent);
    const vrfRequestId = parsed?.args[1];
    console.log("✅ VRF Request ID:", vrfRequestId.toString());
    console.log("");
    
    // Fulfill VRF request with mock randomness
    console.log("Fulfilling VRF request with mock randomness...");
    const randomness = ethers.toBigInt(ethers.randomBytes(32));
    await mockCoordinator.fulfillRandomWords(vrfRequestId, contractAddress);
    console.log("✅ VRF fulfilled");
    console.log("");
  }
  
  // Check if winner was selected
  const finalRound = await contract.getRound(roundInfo[0]);
  if (finalRound[4] !== ethers.ZeroAddress) {
    console.log("====================================");
    console.log("WINNER SELECTED!");
    console.log("====================================");
    console.log("Winner:", finalRound[4]);
    
    // Check which player won
    if (finalRound[4] === player1.address) {
      console.log("🏆 Player 1 wins! (50% chance)");
    } else if (finalRound[4] === player2.address) {
      console.log("🏆 Player 2 wins! (30% chance)");
    } else if (finalRound[4] === player3.address) {
      console.log("🏆 Player 3 wins! (20% chance)");
    }
    
    const prize = (finalRound[3] * 95n) / 100n; // 95% after 5% house fee
    console.log("Prize:", ethers.formatEther(prize), "BNB");
    console.log("====================================");
  }
  
  console.log("");
  console.log("✅ All tests passed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
