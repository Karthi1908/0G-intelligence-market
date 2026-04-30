const { ethers } = require("hardhat");

const INFT_ADDRESS = "0xF6AF7ef02fc32F648249e016d3000a3dfe87bc7f";

async function main() {
  const inft = await ethers.getContractAt("StrategyINFT", INFT_ADDRESS);
  
  const totalSupply = await inft.totalSupply();
  console.log("Total Supply:", totalSupply.toString());
  
  console.log("\n📋 Token Ownership:");
  for (let i = 1; i <= Math.min(totalSupply.toNumber(), 20); i++) {
    try {
      const owner = await inft.ownerOf(i);
      const info = await inft.getStrategyInfo(i);
      console.log(`  Token #${i}: ${owner.slice(0,6)}...${owner.slice(-4)} | Type: ${info[0]} | Composite: ${info[1]}`);
    } catch (e) {
      console.log(`  Token #${i}: does not exist`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });