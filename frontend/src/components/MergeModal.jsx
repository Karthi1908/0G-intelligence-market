import React, { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { STRATEGY_METADATA, computeSignal } from "../utils/strategies";
import { CONTRACT_ADDRESSES, STRATEGY_INFT_ABI } from "../contracts/abis";
import { useStrategySignal } from "../hooks/useDeribit";
import { ethers } from "ethers";

export default function MergeModal({ token, ownedTokens, onClose, onSuccess, userAddress }) {
  const metaA = STRATEGY_METADATA[token.strategyType] || {};
  const otherTokens = ownedTokens.filter((t) => t.tokenId !== token.tokenId);
  const [selectedB, setSelectedB]   = useState(otherTokens[0] || null);
  const [step, setStep]             = useState("confirm");
  const [txHash, setTxHash]         = useState(null);
  const [error, setError]           = useState(null);

  const { data: hash, writeContractAsync } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const { signal: signalA }    = useStrategySignal(token.strategyType);
  const { signal: signalB }    = useStrategySignal(selectedB?.strategyType ?? 0);

  const metaB = selectedB ? (STRATEGY_METADATA[selectedB.strategyType] || {}) : null;

  React.useEffect(() => {
    if (isConfirmed) {
      setStep("done");
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    }
  }, [isConfirmed, onSuccess]);

  const handleMerge = async () => {
    if (!selectedB) return;
    setStep("pending");
    setError(null);
    try {
      // Create composite metadata hash
      const compositeMetadata = {
        type: "composite",
        parents: [token.tokenId, selectedB.tokenId],
        strategies: [token.strategyType, selectedB.strategyType],
        version: "1.0",
      };
      const compositeHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(JSON.stringify(compositeMetadata)));
      const compositeURI  = `composite-${token.tokenId}-${selectedB.tokenId}`;

      const hashData = await writeContractAsync({
        address: CONTRACT_ADDRESSES.strategyINFT,
        abi: STRATEGY_INFT_ABI,
        functionName: "merge",
        args: [BigInt(token.tokenId), BigInt(selectedB.tokenId), compositeURI, compositeHash],
        gas: 500000n, // Explicit gas limit to bypass estimation issues
        type: 'legacy', // Ensure legacy transaction for compatibility
      });
      setTxHash(hashData);
    } catch (err) {
      console.error(err);
      setError(err.shortMessage || err.message);
      setStep("confirm");
    }
  };

  const compositeReturn = metaA.backtestMetrics && metaB?.backtestMetrics
    ? ((metaA.backtestMetrics.annualReturn + metaB.backtestMetrics.annualReturn) / 2).toFixed(1)
    : null;
  const compositeSharpe = metaA.backtestMetrics && metaB?.backtestMetrics
    ? ((metaA.backtestMetrics.sharpe + metaB.backtestMetrics.sharpe) / 2).toFixed(2)
    : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: "580px" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">⚡ Merge Strategies</div>
        <div className="modal-subtitle">
          Creates a new composite iNFT. Both strategies run in parallel — signals are combined for stronger conviction.
        </div>

        {step === "confirm" && (
          <>
            <div className="merge-selector">
              <div className="strategy-info-panel" style={{ flexDirection: "column", textAlign: "center", padding: "12px" }}>
                <span style={{ fontSize: "32px" }}>{metaA.emoji}</span>
                <div style={{ fontSize: "13px", fontWeight: 600, marginTop: "6px" }}>{metaA.name}</div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>#{token.tokenId}</div>
                {signalA && <span className={`signal-badge ${signalA.signal}`} style={{ marginTop: "6px", alignSelf: "center" }}>{signalA.signal}</span>}
              </div>
              <div className="merge-plus">⚡</div>
              <div>
                <select
                  className="merge-token-select"
                  value={selectedB?.tokenId || ""}
                  onChange={(e) => {
                    const t = otherTokens.find((t) => t.tokenId === Number(e.target.value));
                    setSelectedB(t || null);
                  }}
                  style={{ marginBottom: "8px" }}
                >
                  {otherTokens.map((t) => {
                    const m = STRATEGY_METADATA[t.strategyType] || {};
                    return <option key={t.tokenId} value={t.tokenId}>{m.emoji} #{t.tokenId} {m.name}</option>;
                  })}
                </select>
                {metaB && (
                  <div className="strategy-info-panel" style={{ flexDirection: "column", textAlign: "center", padding: "12px" }}>
                    <span style={{ fontSize: "32px" }}>{metaB.emoji}</span>
                    <div style={{ fontSize: "13px", fontWeight: 600, marginTop: "6px" }}>{metaB.name}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>#{selectedB?.tokenId}</div>
                    {signalB && <span className={`signal-badge ${signalB.signal}`} style={{ marginTop: "6px", alignSelf: "center" }}>{signalB.signal}</span>}
                  </div>
                )}
              </div>
            </div>

            {/* Composite preview */}
            {compositeReturn && (
              <div style={{
                background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)",
                borderRadius: "var(--radius-md)", padding: "14px 16px", marginBottom: "16px",
              }}>
                <div style={{ fontSize: "12px", color: "var(--accent-gold)", fontWeight: 600, marginBottom: "10px" }}>
                  ✨ COMPOSITE STRATEGY PREVIEW
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                  {[
                    { label: "Est. Annual Return", value: `+${compositeReturn}%`, color: "var(--accent-green)" },
                    { label: "Est. Sharpe Ratio", value: compositeSharpe },
                    { label: "Signal Mode", value: "PARALLEL", color: "var(--accent-gold)" },
                  ].map((m) => (
                    <div key={m.label} className="metric">
                      <div className="metric-value" style={{ color: m.color }}>{m.value}</div>
                      <div className="metric-label">{m.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.7", marginBottom: "16px" }}>
              <strong style={{ color: "var(--text-primary)" }}>How parallel execution works:</strong><br />
              Both strategies independently analyze real Deribit data. Signals are aggregated — when both agree (BUY+BUY), confidence is maximized. Mixed signals (BUY+SELL) yield NEUTRAL with low confidence.
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost btn-full" onClick={onClose}>Cancel</button>
              <button className="btn btn-gold btn-full" onClick={handleMerge} disabled={!selectedB}>
                ⚡ Merge & Mint
              </button>
            </div>
          </>
        )}

        {step === "pending" && (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div className="spinner" style={{ width: "40px", height: "40px", margin: "0 auto 16px", borderWidth: "3px", color: "var(--accent-gold)" }} />
            <div style={{ fontWeight: 600 }}>Compositing Strategies...</div>
            <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "8px" }}>
              {isConfirming ? "Waiting for transaction confirmation..." : "Please confirm in your wallet..."}
            </div>
          </div>
        )}

        {step === "done" && (
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>🎉</div>
            <div style={{ fontWeight: 700, fontSize: "18px", color: "var(--accent-gold)", marginBottom: "8px" }}>
              Composite Strategy Created!
            </div>
            <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              New composite iNFT is in your wallet. It will run {metaA.name} + {metaB?.name} in parallel.
            </div>
            <button className="btn btn-gold btn-full" style={{ marginTop: "20px" }} onClick={onClose}>
              View My Strategies
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
