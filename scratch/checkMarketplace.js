const { ethers } = require("ethers");
async function main() {
    const provider = new ethers.providers.JsonRpcProvider("https://evmrpc-testnet.0g.ai");
    const inftAddr = "0x61947abeDd3140d95A2447b75D213902B58eb13d";
    const marketplaceAddr = "0x7Ddd031a815376A8477F5e42c7B0D5275D7bb194";
    const abi = ["function marketplace() view returns (address)"];
    const contract = new ethers.Contract(inftAddr, abi, provider);
    const marketplace = await contract.marketplace();
    console.log("Marketplace address in contract:", marketplace);
    console.log("Matches expected:", marketplace.toLowerCase() === marketplaceAddr.toLowerCase());
}
main().catch(console.error);
