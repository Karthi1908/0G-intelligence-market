const { ethers } = require("hardhat");
const { keccak256, toUtf8Bytes } = ethers.utils;

// Strategy metadata (simplified from deploy.js)
const STRATEGIES = [
  { type: 0, name: "Linear Regression" },
  { type: 1, name: "ARIMA" },
  { type: 2, name: "LSTM Neural Net" },
  { type: 3, name: "Random Forest" },
  { type: 4, name: "XGBoost" },
  { type: 5, name: "MA Crossover" },
  { type: 6, name: "RSI Strategy" },
  { type: 7, name: "Bollinger Bands" },
  { type: 8, name: "MACD Strategy" },
  { type: 9, name: "Mean Reversion" },
];

// Contract address from frontend .env
const INFT_ADDRESS = "0x91315edfB1a8dA67169bc704d33EBe364dCe0144";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("\n🎨 Minting base strategy iNFTs...");
  console.log("Deployer:", deployer.address);
  console.log("Contract:", INFT_ADDRESS, "\n");

  const inft = await ethers.getContractAt("StrategyINFT", INFT_ADDRESS);

  // Check current supply
  const totalSupply = await inft.totalSupply();
  console.log("Current totalSupply:", totalSupply.toString(), "\n");

  // Mint each strategy type
  for (const strategy of STRATEGIES) {
    try {
      const metadataJson = JSON.stringify({
        name: strategy.name,
        type: strategy.type,
        version: "1.0",
      });
      const metadataHash = keccak256(toUtf8Bytes(metadataJson));
      const encryptedURI = `ipfs://strategy-${strategy.type}`;

      console.log(`Minting ${strategy.name} (type ${strategy.type})...`);
      const tx = await inft.mint(deployer.address, strategy.type, encryptedURI, metadataHash, { value: ethers.utils.parseEther("0.001") });
      const receipt = await tx.wait();
      
      // Find the StrategyMinted event
      const mintEvent = receipt.events?.find((e) => e.event === "StrategyMinted");
      const tokenId = mintEvent?.args?.tokenId?.toString() || "unknown";
      
      console.log(`  ✅ Token #${tokenId} minted for ${strategy.name}`);
    } catch (err) {
      console.error(`  ❌ Failed to mint ${strategy.name}:`, err.message);
    }
  }

  // Final supply check
  const newSupply = await inft.totalSupply();
  console.log("\n📊 Final totalSupply:", newSupply.toString());
  console.log("✅ Minting complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });