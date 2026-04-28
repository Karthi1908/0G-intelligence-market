import React, { useState } from "react";
import { STRATEGY_METADATA } from "../utils/strategies";
import { useStrategySignal, useDeribitOHLCV } from "../hooks/useDeribit";
import LiveChart from "./LiveChart";

export default function StrategyDetail({ token, onBack }) {
  const meta = STRATEGY_METADATA[token.strategyType] || {};
  const [resolution, setResolution] = useState(meta.deribitConfig?.resolution || "60");
  const instrument = meta.deribitConfig?.instrument || "BTC-PERPETUAL";

  const { candles, loading: chartLoading } = useDeribitOHLCV(instrument, resolution, 200);
  const { signal, loading: signalLoading, updatedAt } = useStrategySignal(
    token.strategyType,
    token.isComposite ? (token.parentTypes || []) : []
  );

  const parentMetas = token.isComposite && token.parentTypes
    ? token.parentTypes.map((t) => STRATEGY_METADATA[t])
    : [];

  return (
    <div className="detail-view">
      <button className="detail-back" onClick={onBack}>
        ← Back
      </button>

      {/* Header */}
      <div className="detail-header">
        <div className="detail-nft-art">{meta.emoji || "🤖"}</div>
        <div style={{ flex: 1 }}>
          <div className="detail-meta">
            <span className={`category-badge ${token.isComposite ? "composite" : meta.category}`}>
              {token.isComposite ? "COMPOSITE" : meta.category?.toUpperCase()}
            </span>
            <span style={{ fontFamily: "var(--text-mono)", fontSize: "12px", color: "var(--text-muted)" }}>
              Token #{token.tokenId} · ERC-7857
            </span>
          </div>
          <div className="detail-heading">{meta.name}</div>
          <p style={{ color: "var(--text-secondary)", maxWidth: "600px", marginBottom: "16px", lineHeight: "1.7" }}>
            {meta.description}
          </p>

          {/* Live signal + instrument */}
          <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>LIVE SIGNAL:</span>
              {signalLoading ? (
                <span className="signal-badge NEUTRAL loading">COMPUTING...</span>
              ) : signal ? (
                <>
                  <span className={`signal-badge ${signal.signal}`} style={{ fontSize: "14px", padding: "4px 16px" }}>
                    {signal.signal}
                  </span>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--text-mono)" }}>
                    {(signal.confidence * 100).toFixed(0)}% confidence
                  </span>
                </>
              ) : null}
            </div>
            <div className="live-indicator">
              <span className="live-dot" />
              {instrument} · Deribit Testnet
            </div>
            {updatedAt && (
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                Updated {updatedAt.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Signal details */}
      {signal?.details && Object.keys(signal.details).length > 0 && (
        <div style={{
          background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)", padding: "16px 20px", marginBottom: "24px",
          display: "flex", gap: "24px", flexWrap: "wrap",
        }}>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600, alignSelf: "center", minWidth: "80px" }}>
            📊 INDICATORS
          </div>
          {Object.entries(signal.details).map(([k, v]) => (
            typeof v === "string" || typeof v === "number" ? (
              <div key={k} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "var(--text-mono)", fontSize: "14px", fontWeight: 600, color: "var(--accent-cyan)" }}>
                  {v}
                </div>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase" }}>{k}</div>
              </div>
            ) : null
          ))}
        </div>
      )}

      {/* Live Chart */}
      <LiveChart
        candles={candles}
        strategyType={token.strategyType}
        signal={signal}
        strategyMeta={meta}
        resolution={resolution}
        onResolutionChange={setResolution}
        instrument={instrument}
      />

      {/* Composite lineage */}
      {token.isComposite && token.parentIds?.length > 0 && (
        <div className="lineage-tree">
          <div className="lineage-title">🌲 STRATEGY LINEAGE</div>
          <div className="lineage-nodes">
            {token.parentIds.map((pid, i) => {
              const pm = parentMetas[i] || {};
              return (
                <React.Fragment key={pid}>
                  <div className="lineage-node">
                    <span style={{ fontSize: "20px" }}>{pm.emoji}</span>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 600 }}>{pm.name}</div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--text-mono)" }}>#{pid}</div>
                    </div>
                  </div>
                  {i < token.parentIds.length - 1 && <span className="lineage-arrow">→</span>}
                </React.Fragment>
              );
            })}
            <span className="lineage-arrow">⟹</span>
            <div className="lineage-node lineage-result">
              <span style={{ fontSize: "20px" }}>⚡</span>
              <div>
                <div className="lineage-label" style={{ fontSize: "13px", fontWeight: 600 }}>Composite iNFT</div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--text-mono)" }}>#{token.tokenId}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Strategy Parameters */}
      {meta.parameters && (
        <div style={{ marginBottom: "24px" }}>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "12px" }}>
            ⚙️ STRATEGY PARAMETERS
          </div>
          <div className="params-grid">
            {Object.entries(meta.parameters).map(([k, v]) => (
              <div key={k} className="param-chip">
                <div className="param-key">{k}</div>
                <div className="param-val">{String(v)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Backtest Metrics */}
      {meta.backtestMetrics && (
        <div style={{
          background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)", padding: "24px",
        }}>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "16px" }}>
            📈 BACKTEST METRICS
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "16px" }}>
            {[
              { label: "Annual Return", value: `${meta.backtestMetrics.annualReturn >= 0 ? "+" : ""}${meta.backtestMetrics.annualReturn}%`, color: "var(--accent-green)" },
              { label: "Sharpe Ratio",  value: meta.backtestMetrics.sharpe, color: "var(--accent-cyan)" },
              { label: "Max Drawdown",  value: `${meta.backtestMetrics.maxDrawdown}%`, color: "var(--accent-red)" },
              { label: "Win Rate",      value: `${meta.backtestMetrics.winRate}%`, color: "var(--accent-cyan)" },
            ].map((m) => (
              <div key={m.label} className="metric">
                <div className="metric-value" style={{ color: m.color, fontSize: "20px" }}>{m.value}</div>
                <div className="metric-label">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
