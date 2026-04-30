const { ethers } = require("ethers");
async function main() {
    const provider = new ethers.providers.JsonRpcProvider("https://evmrpc-testnet.0g.ai");
    const addresses = [
        "0x61947abeDd3140d95A2447b75D213902B58eb13d", // strategyINFT from .env
        "0x7Ddd031a815376A8477F5e42c7B0D5275D7bb194", // marketplace from .env
        "0xF6AF7ef02fc32F648249e016d3000a3dfe87bc7f"  // from mintStrategies.js
    ];
    for (const addr of addresses) {
        const code = await provider.getCode(addr);
        console.log(`Address: ${addr}, Code length: ${code.length}`);
    }
}
main().catch(console.error);
