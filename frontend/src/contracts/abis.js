// Strategy INFT ABI — key functions only (ethers.js format)
// ─────────────────────────────────────────────────────────────────────────────

export const STRATEGY_INFT_ABI = [
  // Read
  { inputs: [{ name: "tokenId", type: "uint256" }], name: "ownerOf", outputs: [{ name: "", type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "owner", type: "address" }], name: "balanceOf", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "owner", type: "address" }, { name: "index", type: "uint256" }], name: "tokenOfOwnerByIndex", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "totalSupply", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "tokenId", type: "uint256" }], name: "strategyTypes", outputs: [{ name: "", type: "uint8" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "tokenId", type: "uint256" }], name: "isComposite", outputs: [{ name: "", type: "bool" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "tokenId", type: "uint256" }], name: "encryptedURIs", outputs: [{ name: "", type: "string" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "tokenId", type: "uint256" }], name: "metadataHashes", outputs: [{ name: "", type: "bytes32" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "tokenId", type: "uint256" }], name: "getParentTokenIds", outputs: [{ name: "", type: "uint256[]" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "tokenId", type: "uint256" }], name: "getStrategyInfo", outputs: [
    { name: "", type: "uint8" },
    { name: "", type: "bool" },
    { name: "", type: "uint256[]" },
    { name: "", type: "string" },
    { name: "", type: "bytes32" }
  ], stateMutability: "view", type: "function" },
  { inputs: [{ name: "tokenId", type: "uint256" }], name: "getApproved", outputs: [{ name: "", type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "owner", type: "address" }, { name: "operator", type: "address" }], name: "isApprovedForAll", outputs: [{ name: "", type: "bool" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "name", outputs: [{ name: "", type: "string" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "symbol", outputs: [{ name: "", type: "string" }], stateMutability: "view", type: "function" },

  // Write
  { inputs: [
    { name: "to", type: "address" },
    { name: "strategyType", type: "uint8" },
    { name: "encryptedURI", type: "string" },
    { name: "metadataHash", type: "bytes32" }
  ], name: "mint", outputs: [{ name: "", type: "uint256" }], stateMutability: "payable", type: "function" },
  { inputs: [{ name: "strategyType", type: "uint8" }], name: "purchaseStrategy", outputs: [{ name: "", type: "uint256" }], stateMutability: "payable", type: "function" },
  { inputs: [
    { name: "to", type: "address" },
    { name: "tokenId", type: "uint256" },
    { name: "sealedKey", type: "bytes" },
    { name: "proof", type: "bytes" }
  ], name: "clone", outputs: [{ name: "", type: "uint256" }], stateMutability: "nonpayable", type: "function" },
  { inputs: [
    { name: "tokenIdA", type: "uint256" },
    { name: "tokenIdB", type: "uint256" },
    { name: "compositeEncryptedURI", type: "string" },
    { name: "compositeMetadataHash", type: "bytes32" }
  ], name: "merge", outputs: [{ name: "", type: "uint256" }], stateMutability: "nonpayable", type: "function" },
  { inputs: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "tokenId", type: "uint256" },
    { name: "sealedKey", type: "bytes" },
    { name: "proof", type: "bytes" }
  ], name: "secureTransfer", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [
    { name: "tokenId", type: "uint256" },
    { name: "executor", type: "address" },
    { name: "permissions", type: "bytes" }
  ], name: "authorizeUsage", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "to", type: "address" }, { name: "tokenId", type: "uint256" }], name: "approve", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [], name: "withdraw", outputs: [], stateMutability: "nonpayable", type: "function" },
];

export const MARKETPLACE_ABI = [
  // Read
  { inputs: [{ name: "tokenId", type: "uint256" }], name: "listings", outputs: [
    { name: "tokenId", type: "uint256" },
    { name: "seller", type: "address" },
    { name: "price", type: "uint256" },
    { name: "active", type: "bool" },
    { name: "listedAt", type: "uint256" }
  ], stateMutability: "view", type: "function" },
  { inputs: [], name: "getActiveListings", outputs: [{ name: "", type: "tuple[]", components: [
    { name: "tokenId", type: "uint256" },
    { name: "seller", type: "address" },
    { name: "price", type: "uint256" },
    { name: "active", type: "bool" },
    { name: "listedAt", type: "uint256" }
  ]}], stateMutability: "view", type: "function" },
  { inputs: [], name: "activeListingCount", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "platformFeePercent", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "inftContract", outputs: [{ name: "", type: "address" }], stateMutability: "view", type: "function" },

  // Write
  { inputs: [{ name: "tokenId", type: "uint256" }, { name: "price", type: "uint256" }], name: "listStrategy", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "tokenId", type: "uint256" }], name: "delistStrategy", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [
    { name: "tokenId", type: "uint256" },
    { name: "sealedKey", type: "bytes" },
    { name: "proof", type: "bytes" }
  ], name: "buyStrategy", outputs: [], stateMutability: "payable", type: "function" },
];

// Contract addresses — loaded from environment variables
export const CONTRACT_ADDRESSES = {
  strategyINFT: import.meta.env.VITE_INFT_CONTRACT_ADDRESS || "0xF6AF7ef02fc32F648249e016d3000a3dfe87bc7f",
  marketplace: import.meta.env.VITE_MARKETPLACE_CONTRACT_ADDRESS || "0x604732faf5A924047B1f6225757a77774dA6D4aa",
  oracle: import.meta.env.VITE_ORACLE_CONTRACT_ADDRESS || "0x01D754290D5456C3f9ee689F38cb7C5D1e8f6c29",
};
