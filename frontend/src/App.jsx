import React, { useState } from "react";
import { useAccount } from "wagmi";
import WalletConnect from "./components/WalletConnect";
import PriceTicker from "./components/PriceTicker";
import Marketplace from "./components/Marketplace";
import MyStrategies from "./components/MyStrategies";
import StrategyDetail from "./components/StrategyDetail";

export default function App() {
  const { isConnected } = useAccount();
  const [activeTab, setActiveTab]         = useState("marketplace");
  const [selectedToken, setSelectedToken] = useState(null);

  const handleViewToken = (token) => {
    setSelectedToken(token);
  };

  const handleBack = () => {
    setSelectedToken(null);
  };

  const tabs = [
    { id: "marketplace", label: "🏪 Marketplace" },
    { id: "my-strategies", label: "🧬 My Strategies" },
  ];

  return (
    <div className="app-layout">
      {/* Animated background */}
      <div className="bg-stars" />

      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-inner">
          <a href="/" className="navbar-brand">
            <div className="brand-icon">⬡</div>
            <div>
              <div className="brand-name">StrategyNFT</div>
            </div>
            <span className="brand-badge">0G Chain</span>
          </a>

          <div className="navbar-nav">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`nav-btn ${activeTab === tab.id && !selectedToken ? "active" : ""}`}
                onClick={() => { setActiveTab(tab.id); setSelectedToken(null); }}
              >
                {tab.label}
              </button>
            ))}
            <a
              href="https://chainscan-galileo.0g.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-btn"
            >
              🔍 Explorer
            </a>
            <a
              href="https://faucet.0g.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-btn"
            >
              🪙 Faucet
            </a>
          </div>

          <WalletConnect />
        </div>
      </nav>

      {/* Live Deribit Price Ticker */}
      <PriceTicker />

      {/* Main content */}
      <main style={{ flex: 1 }}>
        <div className="page-container">
          {selectedToken ? (
            <StrategyDetail token={selectedToken} onBack={handleBack} />
          ) : activeTab === "marketplace" ? (
            <>
              {/* Hero */}
              <div className="hero">
                <div className="hero-tag">
                  <span>⬡</span> 0G Chain · ERC-7857 Standard
                </div>
                <h1>
                  Trade <span className="gradient">AI Strategy</span> iNFTs
                </h1>
                <p>
                  Each iNFT is a tokenized Deribit trading strategy — powered by real market data.
                  Clone, merge, and trade ML models and technical analysis strategies on-chain.
                </p>
                <div className="hero-stats">
                  {[
                    { value: "10", label: "Core Strategies" },
                    { value: "ERC-7857", label: "Standard" },
                    { value: "Live", label: "Deribit Data" },
                    { value: "0G", label: "Network" },
                  ].map((s) => (
                    <div key={s.label} className="hero-stat">
                      <div className="value">{s.value}</div>
                      <div className="label">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <Marketplace onViewToken={handleViewToken} />
            </>
          ) : (
            <MyStrategies onViewToken={handleViewToken} />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid var(--border-subtle)",
        padding: "20px 24px",
        textAlign: "center",
        color: "var(--text-muted)",
        fontSize: "13px",
      }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <span>StrategyNFT · ERC-7857 iNFT Marketplace · 0G Galileo Testnet</span>
          <span style={{ display: "flex", gap: "16px" }}>
            <a href="https://docs.0g.ai" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-cyan)", textDecoration: "none" }}>0G Docs</a>
            <a href="https://test.deribit.com" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-cyan)", textDecoration: "none" }}>Deribit Testnet</a>
            <a href="https://github.com/0gfoundation/0g-agent-nft" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-cyan)", textDecoration: "none" }}>GitHub</a>
          </span>
        </div>
      </footer>
    </div>
  );
}
