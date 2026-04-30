const { ethers } = require("ethers");
async function main() {
    const provider = new ethers.providers.JsonRpcProvider("https://evmrpc-testnet.0g.ai");
    const inftAddr = "0x61947abeDd3140d95A2447b75D213902B58eb13d";
    const abi = ["function oracle() view returns (address)"];
    const contract = new ethers.Contract(inftAddr, abi, provider);
    const oracle = await contract.oracle();
    console.log("Oracle address in contract:", oracle);
}
main().catch(console.error);
