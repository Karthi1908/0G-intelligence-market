const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Testing Merge with account:", signer.address);

  const balance = await signer.getBalance();
  console.log("Account balance:", ethers.utils.formatEther(balance), "0G");

  const inftAddress = process.env.VITE_INFT_CONTRACT_ADDRESS;
  if (!inftAddress) {
    console.error("VITE_INFT_CONTRACT_ADDRESS not found in .env");
    return;
  }

  const inft = await ethers.getContractAt("StrategyINFT", inftAddress);

  console.log("Checking token ownership...");
  const totalSupply = await inft.totalSupply();
  console.log("Total Supply:", totalSupply.toString());

  const ownedTokens = [];
  for (let i = 1; i <= totalSupply; i++) {
    try {
      const owner = await inft.ownerOf(i);
      if (owner.toLowerCase() === signer.address.toLowerCase()) {
        ownedTokens.push(i);
      }
    } catch (e) {
      // Token might not exist
    }
  }

  console.log("Owned Tokens:", ownedTokens);

  if (ownedTokens.length < 2) {
    console.log("Not enough tokens to merge. Need at least 2. Attempting to purchase some...");
    const mintPrice = await inft.mintPrice();
    
    // Purchase token A
    console.log("Purchasing Token A (StrategyType 0)...");
    const txA = await inft.purchaseStrategy(0, { value: mintPrice });
    console.log("Tx sent, waiting for confirmation...");
    await txA.wait();
    console.log("Token A purchased.");

    // Purchase token B
    console.log("Purchasing Token B (StrategyType 1)...");
    const txB = await inft.purchaseStrategy(1, { value: mintPrice });
    console.log("Tx sent, waiting for confirmation...");
    await txB.wait();
    console.log("Token B purchased.");

    // Refresh owned tokens
    const newTotalSupply = await inft.totalSupply();
    ownedTokens.length = 0;
    for (let i = 1; i <= newTotalSupply; i++) {
      try {
        const owner = await inft.ownerOf(i);
        if (owner.toLowerCase() === signer.address.toLowerCase()) {
          ownedTokens.push(i);
        }
      } catch (e) {}
    }
    console.log("Refreshed Owned Tokens:", ownedTokens);
  }

  if (ownedTokens.length >= 2) {
    const idA = ownedTokens[0];
    const idB = ownedTokens[1];
    console.log(`Merging token ${idA} and ${idB}...`);

    const compositeURI = `test-merge-${idA}-${idB}`;
    const compositeHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-merge-metadata"));

    const startTime = Date.now();
    try {
      console.log("Sending merge transaction...");
      // We might need to specify gas price if "auto" is failing or slow
      const feeData = await ethers.provider.getFeeData();
      console.log("Current Fee Data:", {
        gasPrice: feeData.gasPrice?.toString(),
        maxFeePerGas: feeData.maxFeePerGas?.toString(),
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString()
      });

      const tx = await inft.merge(idA, idB, compositeURI, compositeHash, {
        gasLimit: 1000000
      });
      console.log("Merge Tx Hash:", tx.hash);
      console.log("Waiting for confirmation...");
      
      const receipt = await tx.wait();
      const endTime = Date.now();
      const newTokenId = receipt.events.find(e => e.event === 'Transfer')?.args.tokenId;
      
      console.log("✅ Merge Confirmed!");
      console.log("Time taken:", (endTime - startTime) / 1000, "seconds");
      console.log("New Token ID:", newTokenId.toString());

      // Try merging the composite
      console.log(`Merging composite token ${newTokenId} with token ${ownedTokens[2] || 3}...`);
      const nextId = ownedTokens[2] || 3;
      const compURI2 = `test-merge-comp-${newTokenId}-${nextId}`;
      const compHash2 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-merge-metadata-2"));
      
      const startTime2 = Date.now();
      const tx2 = await inft.merge(newTokenId, nextId, compURI2, compHash2, { gasLimit: 1000000 });
      console.log("Composite Merge Tx Hash:", tx2.hash);
      await tx2.wait();
      const endTime2 = Date.now();
      console.log("✅ Composite Merge Confirmed!");
      console.log("Time taken:", (endTime2 - startTime2) / 1000, "seconds");

      // Multiple merges to test bloat
      let currentId = newTokenId;
      for (let i = 0; i < 5; i++) {
        const nextId = ownedTokens[i % 5] || i + 1;
        console.log(`Deep Merge Iteration ${i}: Merging ${currentId} and ${nextId}...`);
        const startTimeLoop = Date.now();
        const txLoop = await inft.merge(currentId, nextId, `deep-${i}`, compositeHash, { gasLimit: 2000000 });
        const receiptLoop = await txLoop.wait();
        const endTimeLoop = Date.now();
        currentId = receiptLoop.events.find(e => e.event === 'Transfer')?.args.tokenId;
        console.log(`✅ Iteration ${i} confirmed in ${(endTimeLoop - startTimeLoop) / 1000}s. Gas Used: ${receiptLoop.gasUsed.toString()}`);
      }
    } catch (error) {
      console.error("❌ Merge failed:", error.message);
      if (error.transactionHash) {
        console.log("Tx Hash of failure:", error.transactionHash);
      }
    }
  } else {
    console.log("Still not enough tokens to merge.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
