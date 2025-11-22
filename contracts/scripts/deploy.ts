import { ethers } from "hardhat";

/**
 * Chainlink VRF Configuration for BSC Testnet
 * Source: https://docs.chain.link/vrf/v2/subscription/supported-networks
 */
const BSC_TESTNET_VRF_CONFIG = {
  vrfCoordinator: "0x6A2AAd07396B36Fe02a22b33cf443582f682c82f",
  keyHash: "0xd4bb89654db74673a187bd804519e65e3f71a52bc55f11da7601a13dcf505314",
  // Subscription ID must be created manually at https://vrf.chain.link
  subscriptionId: process.env.VRF_SUBSCRIPTION_ID || "0",
};

const BSC_MAINNET_VRF_CONFIG = {
  vrfCoordinator: "0xc587d9053cd1118f25F645F9E08BB98c9712A4EE",
  keyHash: "0x17cd473250a9a479dc7f234c64332ed4bc8af9e8ded7556aa6e66d83da49f470",
  subscriptionId: process.env.VRF_SUBSCRIPTION_ID || "0",
};

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log("====================================");
  console.log("BNBPOT Contract Deployment");
  console.log("====================================");
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "BNB");
  console.log("Network:", network.name, "Chain ID:", network.chainId);
  console.log("");

  // Select VRF config based on network
  let vrfConfig;
  if (network.chainId === 97n) {
    vrfConfig = BSC_TESTNET_VRF_CONFIG;
    console.log("Using BSC Testnet VRF configuration");
  } else if (network.chainId === 56n) {
    vrfConfig = BSC_MAINNET_VRF_CONFIG;
    console.log("Using BSC Mainnet VRF configuration");
  } else {
    throw new Error(`Unsupported network. Chain ID: ${network.chainId}`);
  }

  if (vrfConfig.subscriptionId === "0") {
    console.error("❌ ERROR: VRF_SUBSCRIPTION_ID not set!");
    console.log("");
    console.log("To deploy, you must:");
    console.log("1. Visit https://vrf.chain.link");
    console.log("2. Create a VRF subscription");
    console.log("3. Fund it with LINK tokens");
    console.log("4. Set VRF_SUBSCRIPTION_ID in .env file");
    console.log("");
    process.exit(1);
  }

  console.log("VRF Coordinator:", vrfConfig.vrfCoordinator);
  console.log("Key Hash:", vrfConfig.keyHash);
  console.log("Subscription ID:", vrfConfig.subscriptionId);
  console.log("");

  // Deploy contract
  console.log("Deploying JackpotCarousel...");
  const JackpotCarousel = await ethers.getContractFactory("JackpotCarousel");
  const contract = await JackpotCarousel.deploy(
    vrfConfig.vrfCoordinator,
    vrfConfig.subscriptionId,
    vrfConfig.keyHash
  );

  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log("✅ JackpotCarousel deployed to:", address);
  console.log("");

  // Get initial round info
  const currentRound = await contract.getCurrentRound();
  console.log("Initial Round:");
  console.log("  - Round ID:", currentRound[0].toString());
  console.log("  - Status:", currentRound[5]); // 0 = Inactive
  console.log("  - Total Pot:", ethers.formatEther(currentRound[3]), "BNB");
  console.log("");

  console.log("====================================");
  console.log("⚠️ IMPORTANT: Post-Deployment Steps");
  console.log("====================================");
  console.log("1. Add this contract as a consumer to your VRF subscription:");
  console.log("   https://vrf.chain.link");
  console.log("");
  console.log("2. Set environment variables:");
  console.log(`   VITE_CONTRACT_ADDRESS=${address}`);
  console.log(`   VITE_BSC_RPC_URL=<your-rpc-url>`);
  console.log("");
  console.log("3. Verify contract on BSCScan:");
  console.log(`   npx hardhat verify --network ${network.name === 'bsc-testnet' ? 'bscTestnet' : 'bscMainnet'} ${address} "${vrfConfig.vrfCoordinator}" "${vrfConfig.subscriptionId}" "${vrfConfig.keyHash}"`);
  console.log("");
  console.log("4. Test the deployment:");
  console.log("   - Place a test bet");
  console.log("   - Wait for round to complete");
  console.log("   - Verify VRF callback and winner selection");
  console.log("====================================");
  console.log("");

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    contractAddress: address,
    deployer: deployer.address,
    vrfCoordinator: vrfConfig.vrfCoordinator,
    vrfKeyHash: vrfConfig.keyHash,
    vrfSubscriptionId: vrfConfig.subscriptionId,
    deployedAt: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
  };

  console.log("Deployment info:", JSON.stringify(deploymentInfo, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
