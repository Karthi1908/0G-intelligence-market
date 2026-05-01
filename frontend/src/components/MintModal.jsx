import React, { useState } from "react";
import { STRATEGY_METADATA } from "../utils/strategies";
import { CONTRACT_ADDRESSES, STRATEGY_INFT_ABI } from "../contracts/abis";
import { ethers } from "ethers";

export default function MintModal({ onClose, onSuccess, userAddress }) {
  const [selectedType, setSelectedType] = useState(0);
  const [step, setStep]           = useState("form"); // form | pending | done
  const [txHash, setTxHash]       = useState(null);
  const [error, setError]         = useState(null);

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

  const handleMint = async () => {
    setStep("pending");
    setError(null);
    try {
      if (!window.ethereum) throw new Error("Wallet provider not found.");
      
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const network = await provider.getNetwork();
      const expectedChainId = 16602;
      if (network.chainId !== expectedChainId) {
        throw new Error(
          `Wallet must be connected to 0G Galileo Testnet (chainId ${expectedChainId}), but wallet is on chainId ${network.chainId}. Please switch networks in your wallet.`,
        );
      }
      
      const meta = STRATEGY_METADATA[selectedType];
      const metadataJson = JSON.stringify({
        name: meta.name,
        type: selectedType,
        version: "1.0",
        createdAt: Date.now(),
      });
      const metadataHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(metadataJson));
      const encryptedURI = `ipfs://strategy-${selectedType}-${Date.now()}`;

      const contract = new ethers.Contract(CONTRACT_ADDRESSES.strategyINFT, STRATEGY_INFT_ABI, signer);
      const tx = await contract.mint(userAddress, selectedType, encryptedURI, metadataHash, {
        value: ethers.utils.parseEther("0.001"),
        gasLimit: 500000,
      });

      const normalizedHash = (tx.hash || String(tx)).trim().toLowerCase();
      if (!normalizedHash.startsWith('0x') || normalizedHash.length !== 66) {
        throw new Error(`Invalid tx hash: ${normalizedHash}`);
      }
      setTxHash(normalizedHash);
      await tryCopyToClipboard(normalizedHash);
      alert(`Transaction Submitted!\n\nHash: ${normalizedHash}\n\nExplorer: https://chainscan-galileo.0g.ai/tx/${normalizedHash}`);
      
      // Wait for confirmation
      await tx.wait();
      setStep("done");
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    } catch (err) {
      console.error(err);
      setError(err.reason || err.shortMessage || err.message || String(err));
      setStep("form");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: "500px" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">✨ Create Strategy iNFT</div>
        <div className="modal-subtitle">
          Tokenize a new trading strategy on the 0G Galileo Testnet.
        </div>

        {step === "form" && (
          <>
            <div className="form-group" style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "8px", color: "var(--text-muted)" }}>
                SELECT STRATEGY TYPE
              </label>
              <div className="strategy-selector-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {Object.entries(STRATEGY_METADATA).map(([type, meta]) => (
                  <button
                    key={type}
                    className={`strategy-type-card ${Number(type) === selectedType ? "active" : ""}`}
                    onClick={() => setSelectedType(Number(type))}
                    style={{
                      background: Number(type) === selectedType ? "var(--bg-card-hover)" : "var(--bg-surface)",
                      border: "1px solid " + (Number(type) === selectedType ? "var(--accent-gold)" : "var(--border-subtle)"),
                      borderRadius: "var(--radius-md)",
                      padding: "12px",
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px"
                    }}
                  >
                    <span style={{ fontSize: "20px" }}>{meta.emoji}</span>
                    <span style={{ fontSize: "12px", fontWeight: 600 }}>{meta.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{
              background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)",
              borderRadius: "var(--radius-md)", padding: "14px 16px",
              fontSize: "13px", color: "var(--text-secondary)", marginBottom: "20px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span>Mint Price:</span>
                <span style={{ fontWeight: 600, color: "var(--accent-gold)" }}>0.001 0G</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Network:</span>
                <span>0G Galileo Testnet</span>
              </div>
            </div>

            {error && (
              <div style={{ color: "var(--accent-red)", fontSize: "12px", marginBottom: "16px", background: "rgba(239,68,68,0.1)", padding: "8px", borderRadius: "4px" }}>
                ⚠️ {error}
              </div>
            )}

            <div className="modal-footer">
              <button className="btn btn-ghost btn-full" onClick={onClose}>Cancel</button>
              <button className="btn btn-gold btn-full" onClick={handleMint}>
                🚀 Mint iNFT
              </button>
            </div>
          </>
        )}

        {step === "pending" && (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div className="spinner" style={{ width: "40px", height: "40px", margin: "0 auto 16px", borderWidth: "3px", color: "var(--accent-gold)" }} />
            <div style={{ fontWeight: 600 }}>Minting your strategy iNFT...</div>
            <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "8px" }}>
              {isConfirming ? "Waiting for confirmation..." : "Please confirm in your wallet..."}
            </div>
          </div>
        )}

        {step === "done" && (
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>🎉</div>
            <div style={{ fontWeight: 700, fontSize: "18px", color: "var(--accent-gold)", marginBottom: "8px" }}>
              Strategy Minted Successfully!
            </div>
            <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              Your new strategy iNFT is now live on the blockchain.
            </div>
            {txHash && (
              <div style={{ marginTop: "14px", fontSize: "13px" }}>
                <a
                  href={`https://chainscan-galileo.0g.ai/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--accent-gold)", textDecoration: "underline" }}
                >
                  View transaction on ChainScan
                </a>
              </div>
            )}
            <button className="btn btn-gold btn-full" style={{ marginTop: "20px" }} onClick={onClose}>
              View My Strategies
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
