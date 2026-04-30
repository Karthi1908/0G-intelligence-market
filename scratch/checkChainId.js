const { ethers } = require("ethers");
async function main() {
    const provider = new ethers.providers.JsonRpcProvider("https://evmrpc-testnet.0g.ai");
    const network = await provider.getNetwork();
    console.log("Network Name:", network.name);
    console.log("Chain ID:", network.chainId);
}
main().catch(console.error);
