import { createConfig, http } from "wagmi";
import { injected, metaMask } from "wagmi/connectors";

// 0G Galileo Testnet chain definition
export const zgGalileoTestnet = {
  id: 16602,
  name: "0G Galileo Testnet",
  nativeCurrency: {
    name: "0G Token",
    symbol: "0G",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ["https://evmrpc-testnet.0g.ai"] },
    public:  { http: ["https://evmrpc-testnet.0g.ai"] },
  },
  blockExplorers: {
    default: {
      name: "0G ChainScan",
      url: "https://chainscan-galileo.0g.ai",
    },
  },
  testnet: true,
};

export const wagmiConfig = createConfig({
  chains: [zgGalileoTestnet],
  connectors: [
    injected(),
    metaMask(),
  ],
  transports: {
    [zgGalileoTestnet.id]: http("https://evmrpc-testnet.0g.ai"),
  },
});
