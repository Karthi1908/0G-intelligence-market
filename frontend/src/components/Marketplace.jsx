import React, { useState } from "react";
import { useAccount, useReadContract, useReadContracts } from "wagmi";
import StrategyCard from "./StrategyCard";
import { CONTRACT_ADDRESSES, STRATEGY_INFT_ABI, MARKETPLACE_ABI } from "../contracts/abis";
import { ethers } from "ethers";

const MOCK_SEALED_KEY = "0x" + "ab".repeat(32);
const MOCK_PROOF      = "0x" + "cd".repeat(32);

export default function Marketplace({ onViewToken }) {
  const { isConnected } = useAccount();
  const [categoryFilter, setCategoryFilter] = useState("all");
  
  // 1) Fetch active listings
  const { data: activeListings } = useReadContract({
    address: CONTRACT_ADDRESSES.marketplace,
    abi: MARKETPLACE_ABI,
    functionName: "getActiveListings",
  });

  const listingsArray = activeListings || [];

  // 2) Prepare batched calls to getStrategyInfo for each listing
  const strategyInfoCalls = listingsArray.map((listing) => ({
    address: CONTRACT_ADDRESSES.strategyINFT,
    abi: STRATEGY_INFT_ABI,
    functionName: "getStrategyInfo",
    args: [listing.tokenId],
  }));

  // 3) Fetch strategy info
  const { data: strategyInfos } = useReadContracts({
    contracts: strategyInfoCalls,
  });

  // 4) Map data to our token object format
  const realTokens = listingsArray.map((listing, index) => {
    const info = strategyInfos?.[index]?.result;
    
    // Fallback if lookup failed momentarily
    if (!info) {
      return {
        tokenId: Number(listing.tokenId),
        strategyType: 0,
        isComposite: false,
        parentIds: [],
        owner: listing.seller,
        encryptedURI: "",
        listing: listing,
      };
    }

    return {
      tokenId: Number(listing.tokenId),
      strategyType: Number(info[0]), // StrategyType enum
      isComposite: info[1],
      parentIds: info[2].map(Number),
      owner: listing.seller,
      encryptedURI: info[3],
      listing: listing,
    };
  });

  const baseTokens = Array.from({ length: 10 }, (_, i) => ({
    tokenId: i + 1,
    strategyType: i,
    isComposite: false,
    parentIds: [],
    owner: CONTRACT_ADDRESSES.marketplace,
    encryptedURI: "",
    listing: {
      price: ethers.utils.parseEther("0.001"), // Still stored as BigNumber for compatibility with any components that use it
      seller: CONTRACT_ADDRESSES.marketplace,
      active: true
    }
  }));

  const realTokenIds = new Set(realTokens.map(t => t.tokenId));
  const tokens = [...realTokens];
  
  baseTokens.forEach(bt => {
    if (!realTokenIds.has(bt.tokenId)) {
      tokens.push(bt);
    }
  });

  // Filter logic
  const filteredTokens = tokens.filter((t) => {
    if (categoryFilter === "ml" && t.strategyType > 4) return false;
    if (categoryFilter === "ta" && t.strategyType < 5) return false;
    return true;
  });

  // Buy handler
  const [buyingId, setBuyingId] = useState(null);

  const tryCopyToClipboard = async (text) => {
    if (!navigator.clipboard || !document.hasFocus()) return false;
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn("Clipboard write unavailable", err);
      return false;
    }
  };

  const handleBuy = async (token, listing) => {
    if (!isConnected) return;
    setBuyingId(token.tokenId);
    try {
      if (!window.ethereum) throw new Error("Wallet provider not found.");
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const valueBigInt = BigInt(listing.price.toString());
      let tx;

      if (token.owner === CONTRACT_ADDRESSES.marketplace) {
        const contract = new ethers.Contract(CONTRACT_ADDRESSES.strategyINFT, STRATEGY_INFT_ABI, signer);
        tx = await contract.purchaseStrategy(token.strategyType, {
          value: valueBigInt,
          gasLimit: 500000,
        });
      } else {
        const contract = new ethers.Contract(CONTRACT_ADDRESSES.marketplace, MARKETPLACE_ABI, signer);
        tx = await contract.buyStrategy(BigInt(token.tokenId), MOCK_SEALED_KEY, MOCK_PROOF, {
          value: valueBigInt,
          gasLimit: 500000,
        });
      }

      const normalizedHash = (tx.hash || String(tx)).trim().toLowerCase();
      if (!normalizedHash.startsWith('0x') || normalizedHash.length !== 66) {
        throw new Error(`Invalid tx hash: ${normalizedHash}`);
      }
      await tryCopyToClipboard(normalizedHash);
      alert(`Transaction Submitted!\n\nHash: ${normalizedHash}\n\nExplorer: https://chainscan-galileo.0g.ai/tx/${normalizedHash}`);
    } catch (err) {
      console.error(err);
      alert(`Buy failed: ${err.shortMessage || err.message || err}`);
    } finally {
      setBuyingId(null);
    }
  };

  return (
    <div className="section">
      <div className="section-header">
        <h2 className="section-title">
          <span className="icon">🏪</span>
          Strategy Marketplace
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div className="live-indicator">
            <span className="live-dot" />
            Deribit Live
          </div>
          <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            {filteredTokens.length} active listings
          </span>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
        <div className="filter-bar">
          {[
            { id: "all", label: "All Strategies" },
            { id: "ml",  label: "🤖 ML Models" },
            { id: "ta",  label: "📊 Technical" },
          ].map((f) => (
            <button
              key={f.id}
              className={`filter-chip ${categoryFilter === f.id ? "active " + f.id : ""}`}
              onClick={() => setCategoryFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filteredTokens.length === 0 && (
         <div className="empty-state">
           <div className="empty-icon">🏪</div>
           <div className="empty-title">Marketplace Empty</div>
           <div className="empty-desc">No active listings available right now.</div>
         </div>
      )}

      {filteredTokens.length > 0 && (
        <div className="strategy-grid">
          {filteredTokens.map((token) => (
            <StrategyCard
              key={token.tokenId}
              token={token}
              listing={token.listing}
              isOwned={false}
              onView={onViewToken}
              onBuy={handleBuy}
            />
          ))}
        </div>
      )}
    </div>
  );
}
