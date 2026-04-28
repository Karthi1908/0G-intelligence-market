const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Listing tokens with account:", deployer.address);

  // Contract Addresses from .env
  const inftAddress = process.env.VITE_INFT_CONTRACT_ADDRESS;
  const marketplaceAddress = process.env.VITE_MARKETPLACE_CONTRACT_ADDRESS;

  if (!inftAddress || !marketplaceAddress) {
    console.error("Missing contract addresses in .env");
    process.exit(1);
  }

  // Get contract instances
  const StrategyINFT = await ethers.getContractFactory("StrategyINFT");
  const inft = StrategyINFT.attach(inftAddress);

  const Marketplace = await ethers.getContractFactory("StrategyMarketplace");
  const marketplace = Marketplace.attach(marketplaceAddress);

  // Price = 0.001 0G token (1/1000th of an 0G)
  const price = ethers.utils.parseEther("0.001");

  console.log("Approving Marketplace for all deployed tokens...");
  // Deployer approves marketplace to handle all their tokens
  const approveTx = await inft.setApprovalForAll(marketplace.address, true);
  await approveTx.wait();
  console.log("✅ Marketplace approved");

  console.log("Listing tokens 1 to 10 at 0.001 0G...");
  for (let i = 1; i <= 10; i++) {
    try {
      console.log(`Listing token ${i}...`);
      const listTx = await marketplace.listStrategy(i, price);
      await listTx.wait();
      console.log(`✅ Token ${i} listed successfully`);
    } catch (e) {
      console.error(`❌ Failed to list token ${i}:`, e.message);
    }
  }

  console.log("All tokens processed!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
