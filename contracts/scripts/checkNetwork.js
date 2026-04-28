async function main() {
  const block = await ethers.provider.getBlock('latest');
  console.log("Latest block gas limit:", block.gasLimit.toString());
  const feeData = await ethers.provider.getFeeData();
  console.log("Fee Data:", {
    gasPrice: feeData.gasPrice?.toString(),
    maxFeePerGas: feeData.maxFeePerGas?.toString(),
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString()
  });
}
main().catch(console.error);
