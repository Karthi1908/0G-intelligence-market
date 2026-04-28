import React, { useState, useEffect } from "react";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { zgGalileoTestnet } from "../wagmi.config";

export default function WalletConnect() {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors }           = useConnect();
  const { disconnect }                    = useDisconnect();
  const { switchChain }                   = useSwitchChain();
  const [showMenu, setShowMenu]           = useState(false);

  const isWrongNetwork = isConnected && chainId !== zgGalileoTestnet.id;

  if (!isConnected) {
    return (
      <button
        className="wallet-btn connect"
        onClick={() => connect({ connector: connectors[0] })}
      >
        <span>🔗</span>
        Connect Wallet
      </button>
    );
  }

  if (isWrongNetwork) {
    return (
      <button
        className="wallet-btn connect"
        style={{ background: "linear-gradient(135deg, #dc2626, #991b1b)" }}
        onClick={() => switchChain({ chainId: zgGalileoTestnet.id })}
      >
        <span>⚠️</span>
        Switch to 0G Network
      </button>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        className="wallet-btn connected"
        onClick={() => setShowMenu((v) => !v)}
      >
        <span style={{ fontSize: "16px" }}>⬡</span>
        <span className="wallet-address">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </span>
        <span style={{ fontSize: "10px", opacity: 0.6 }}>▼</span>
      </button>

      {showMenu && (
        <div
          style={{
            position: "absolute", right: 0, top: "calc(100% + 8px)",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-glow)",
            borderRadius: "var(--radius-md)",
            padding: "8px", minWidth: "220px",
            boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
            zIndex: 200, animation: "slideUp 0.15s ease",
          }}
          onMouseLeave={() => setShowMenu(false)}
        >
          <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--border-subtle)", marginBottom: "8px" }}>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "2px" }}>Connected to</div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--accent-green)", display: "block" }} />
              <span style={{ fontSize: "13px", fontWeight: 600 }}>0G Galileo Testnet</span>
            </div>
          </div>
          <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--border-subtle)", marginBottom: "8px" }}>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>Address</div>
            <div style={{ fontFamily: "var(--text-mono)", fontSize: "12px", color: "var(--accent-cyan)", wordBreak: "break-all" }}>
              {address}
            </div>
          </div>
          <a
            href={`https://chainscan-galileo.0g.ai/address/${address}`}
            target="_blank" rel="noopener noreferrer"
            style={{ display: "block", padding: "8px 12px", color: "var(--text-secondary)", fontSize: "13px", textDecoration: "none", borderRadius: "6px" }}
            onMouseEnter={(e) => e.target.style.color = "var(--accent-cyan)"}
            onMouseLeave={(e) => e.target.style.color = "var(--text-secondary)"}
          >
            🔍 View on Explorer
          </a>
          <button
            onClick={() => { disconnect(); setShowMenu(false); }}
            style={{
              width: "100%", padding: "8px 12px", background: "transparent",
              border: "none", color: "var(--accent-red)", fontSize: "13px",
              cursor: "pointer", textAlign: "left", borderRadius: "6px",
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            🚪 Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
