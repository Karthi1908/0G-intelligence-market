import React, { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { STRATEGY_METADATA } from "../utils/strategies";
import { useStrategySignal } from "../hooks/useDeribit";
import { CONTRACT_ADDRESSES, STRATEGY_INFT_ABI } from "../contracts/abis";
import { ethers } from "ethers";

function SignalBadge({ strategyType, isComposite, parentTypes }) {
  const { signal, loading } = useStrategySignal(
    strategyType,
    isComposite ? (parentTypes || []) : []
  );

  if (loading) return <span className="signal-badge NEUTRAL loading">LOADING</span>;
  if (!signal) return <span className="signal-badge NEUTRAL">NEUTRAL</span>;

  return (
    <span className={`signal-badge ${signal.signal}`}>
      {signal.signal}
      {signal.confidence && ` ${(signal.confidence * 100).toFixed(0)}%`}
    </span>
  );
}

export default function StrategyCard({
  token,
  onView,
  onClone,
  onMerge,
  onList,
  onBuy,
  isOwned = false,
  listing = null,
}) {
  const { isConnected } = useAccount();
  const meta = STRATEGY_METADATA[token.strategyType] || {};
  const { signal, loading: signalLoading } = useStrategySignal(
    token.strategyType,
    token.isComposite ? (token.parentTypes || []) : []
  );

  const [cardStyle, setCardStyle] = useState({});

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 8;
    const y = ((e.clientY - rect.top)  / rect.height - 0.5) * -8;
    setCardStyle({ transform: `translateY(-4px) perspective(1000px) rotateX(${y}deg) rotateY(${x}deg)` });
  };
  const handleMouseLeave = () => setCardStyle({});

  const fmt = (n) => Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div
      className="strategy-card"
      style={{ "--card-color": meta.color || "var(--accent-purple)", ...cardStyle }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={() => onView?.(token)}
    >
      {/* Top row */}
      <div className="card-header">
        <span className="card-emoji">{meta.emoji || "🤖"}</span>
        <div className="card-badges">
          {token.isComposite ? (
            <span className="category-badge composite">COMPOSITE</span>
          ) : (
            <span className={`category-badge ${meta.category || "ta"}`}>
              {meta.category?.toUpperCase() || "TA"}
            </span>
          )}
          <SignalBadge
            strategyType={token.strategyType}
            isComposite={token.isComposite}
            parentTypes={token.parentTypes}
          />
        </div>
      </div>

      {/* Name + description */}
      <div className="card-token-id">#{token.tokenId} · {token.isComposite ? "Composite Strategy" : meta.name}</div>
      <div className="card-name">{token.isComposite ? `${meta.name} × Merged` : meta.name}</div>
      <div className="card-desc">
        {token.isComposite
          ? `Composite strategy running ${token.parentIds?.length || 2} strategies in parallel for combined signal generation.`
          : meta.description}
      </div>

      {/* Backtest metrics */}
      {meta.backtestMetrics && (
        <div className="card-metrics">
          <div className="metric">
            <div className={`metric-value ${meta.backtestMetrics.annualReturn >= 0 ? "green" : "red"}`}>
              {meta.backtestMetrics.annualReturn >= 0 ? "+" : ""}{meta.backtestMetrics.annualReturn}%
            </div>
            <div className="metric-label">Annual Ret.</div>
          </div>
          <div className="metric">
            <div className="metric-value">{meta.backtestMetrics.sharpe}</div>
            <div className="metric-label">Sharpe</div>
          </div>
          <div className="metric">
            <div className="metric-value red">{meta.backtestMetrics.maxDrawdown}%</div>
            <div className="metric-label">Max DD</div>
          </div>
        </div>
      )}

      {/* Confidence bar */}
      {signal && (
        <div className="confidence-bar">
          <div
            className={`confidence-fill ${signal.signal}`}
            style={{ width: `${(signal.confidence || 0.5) * 100}%` }}
          />
        </div>
      )}

      {/* Deribit instrument */}
      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
        <span>📡</span>
        <span style={{ fontFamily: "var(--text-mono)" }}>
          {meta.deribitConfig?.instrument || "BTC-PERPETUAL"} · {meta.deribitConfig?.resolution || "60"}m
        </span>
        {listing && (
          <>
            <span style={{ marginLeft: "auto", color: "var(--accent-gold)", fontWeight: 700 }}>
              {ethers.utils.formatEther(listing.price || "0")} 0G
            </span>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="card-actions" onClick={(e) => e.stopPropagation()}>
        {isOwned ? (
          <>
            <button className="btn btn-secondary btn-sm" onClick={() => onClone?.(token)}>
              🧬 Clone
            </button>
            <button className="btn btn-gold btn-sm" onClick={() => onMerge?.(token)}>
              ⚡ Merge
            </button>
            {!listing?.active && (
              <button className="btn btn-ghost btn-sm" onClick={() => onList?.(token)}>
                🏷️ List
              </button>
            )}
          </>
        ) : listing?.active ? (
          <button className="btn btn-primary btn-sm btn-full" onClick={() => onBuy?.(token, listing)}>
            Buy · {ethers.utils.formatEther(listing.price || "0")} 0G
          </button>
        ) : (
          <button className="btn btn-ghost btn-sm" disabled={!isConnected}>
            {isConnected ? "View Details" : "Connect Wallet"}
          </button>
        )}
      </div>
    </div>
  );
}
