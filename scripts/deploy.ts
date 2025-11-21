import hre from "hardhat";

async function main() {
  console.log("🚀 Deploying JackpotGame contract to BNB Chain Testnet...\n");

  // Get the contract factory
  const JackpotGame = await hre.ethers.getContractFactory("JackpotGame");
  
  // Deploy the contract
  console.log("📝 Deploying contract...");
  const jackpotGame = await JackpotGame.deploy();
  
  await jackpotGame.waitForDeployment();
  
  const address = await jackpotGame.getAddress();
  
  console.log("\n✅ JackpotGame deployed successfully!");
  console.log("📍 Contract Address:", address);
  console.log("🔗 View on BSCScan:", `https://testnet.bscscan.com/address/${address}`);
  
  // Get initial round info
  const currentRound = await jackpotGame.getCurrentRound();
  console.log("\n📊 Initial Round Info:");
  console.log("   Round ID:", currentRound.id.toString());
  console.log("   Start Time:", new Date(Number(currentRound.startTime) * 1000).toISOString());
  console.log("   Is Active:", currentRound.isActive);
  
  console.log("\n💡 Next Steps:");
  console.log("1. Copy the contract address above");
  console.log("2. Add it to your .env file as CONTRACT_ADDRESS");
  console.log("3. Update the frontend to use this contract");
  console.log("4. Test placing bets with testnet BNB!");
  
  // Save deployment info
  const fs = require('fs');
  const deploymentInfo = {
    network: "BNB Chain Testnet",
    chainId: 97,
    contractAddress: address,
    deployedAt: new Date().toISOString(),
    blockExplorer: `https://testnet.bscscan.com/address/${address}`,
    contractABI: "artifacts/contracts/JackpotGame.sol/JackpotGame.json"
  };
  
  fs.writeFileSync(
    'deployment.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("\n📄 Deployment info saved to deployment.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
