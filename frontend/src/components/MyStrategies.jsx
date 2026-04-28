import React, { useState } from "react";
import { useAccount, useReadContract, useReadContracts } from "wagmi";
import StrategyCard from "./StrategyCard";
import CloneModal from "./CloneModal";
import MergeModal from "./MergeModal";
import { CONTRACT_ADDRESSES, STRATEGY_INFT_ABI } from "../contracts/abis";

export default function MyStrategies({ onViewToken }) {
  const { isConnected, address } = useAccount();
  const [cloneTarget, setCloneTarget] = useState(null);
  const [mergeTarget, setMergeTarget] = useState(null);

  // Hook 1: Get totalSupply
  const { data: totalSupply } = useReadContract({
    address: CONTRACT_ADDRESSES.strategyINFT,
    abi: STRATEGY_INFT_ABI,
    functionName: "totalSupply",
  });

  // Hook 2: Fetch ownerOf for each token
  const tokenIds = [];
  if (totalSupply) {
    for (let i = 1; i <= Number(totalSupply); i++) {
      tokenIds.push(i);
    }
  }

  const ownerOfCalls = tokenIds.map((id) => ({
    address: CONTRACT_ADDRESSES.strategyINFT,
    abi: STRATEGY_INFT_ABI,
    functionName: "ownerOf",
    args: [id],
  }));

  const { data: ownersData } = useReadContracts({
    contracts: ownerOfCalls,
  });

  // Filter token IDs owned by the current user
  const ownedTokenIds = [];
  if (ownersData && address) {
    ownersData.forEach((result, index) => {
      if (result.status === "success" && result.result === address) {
        ownedTokenIds.push(tokenIds[index]);
      }
    });
  }

  // Hook 3: Get strategy info for owned tokens
  const strategyInfoCalls = ownedTokenIds.map((id) => ({
    address: CONTRACT_ADDRESSES.strategyINFT,
    abi: STRATEGY_INFT_ABI,
    functionName: "getStrategyInfo",
    args: [id],
  }));

  const { data: strategyInfos } = useReadContracts({
    contracts: strategyInfoCalls,
  });

  // Map to token objects
  const ownedTokens = ownedTokenIds.map((id, index) => {
    const info = strategyInfos?.[index]?.result;
    if (!info) {
      return {
        tokenId: id,
        strategyType: 0,
        isComposite: false,
        parentIds: [],
        owner: address,
        encryptedURI: "",
      };
    }
    return {
      tokenId: id,
      strategyType: Number(info[0]),
      isComposite: info[1],
      parentIds: info[2].map(Number),
      owner: address,
      encryptedURI: info[3],
    };
  });

  if (!isConnected) {
    return (
      <div className="section">
        <div className="empty-state">
          <div className="empty-icon">🔗</div>
          <div className="empty-title">Connect Your Wallet</div>
          <div className="empty-desc">Connect to see your iNFT strategy portfolio</div>
        </div>
      </div>
    );
  }

  if (ownedTokens.length === 0) {
    return (
      <div className="section">
        <div className="empty-state">
          <div className="empty-icon">🧠</div>
          <div className="empty-title">No Strategies Owned</div>
          <div className="empty-desc">Head to the Marketplace to acquire your first iNFT trading strategy</div>
        </div>
      </div>
    );
  }

  const handleCloneSuccess = () => {
    setCloneTarget(null);
  };

  const handleMergeSuccess = () => {
    setMergeTarget(null);
  };

  return (
    <div className="section">
      <div className="section-header">
        <h2 className="section-title">
          <span className="icon">🧬</span>
          My Strategy iNFTs
        </h2>
        <div className="owned-count-badge">{ownedTokens.length} owned</div>
      </div>

      <div className="strategy-grid">
        {ownedTokens.map((token) => (
          <StrategyCard
            key={token.tokenId}
            token={token}
            isOwned={true}
            onView={onViewToken}
            onClone={setCloneTarget}
            onMerge={setMergeTarget}
          />
        ))}
      </div>

      {cloneTarget && (
        <CloneModal
          token={cloneTarget}
          onClose={() => setCloneTarget(null)}
          onSuccess={handleCloneSuccess}
          userAddress={address}
        />
      )}

      {mergeTarget && (
        <MergeModal
          token={mergeTarget}
          ownedTokens={ownedTokens}
          onClose={() => setMergeTarget(null)}
          onSuccess={handleMergeSuccess}
          userAddress={address}
        />
      )}
    </div>
  );
}
