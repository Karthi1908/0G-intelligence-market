import React, { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { STRATEGY_METADATA } from "../utils/strategies";
import { CONTRACT_ADDRESSES, STRATEGY_INFT_ABI } from "../contracts/abis";

const MOCK_SEALED_KEY = "0x" + "ab".repeat(32);
const MOCK_PROOF      = "0x" + "cd".repeat(32);

export default function CloneModal({ token, onClose, onSuccess, userAddress }) {
  const meta = STRATEGY_METADATA[token.strategyType] || {};
  const [step, setStep]       = useState("confirm"); // confirm | pending | done
  const [txHash, setTxHash]   = useState(null);
  const [error, setError]     = useState(null);

  const { data: hash, writeContractAsync } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  React.useEffect(() => {
    if (isConfirmed) {
      setStep("done");
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    }
  }, [isConfirmed, onSuccess]);

  const handleClone = async () => {
    setStep("pending");
    setError(null);
    try {
      const hashData = await writeContractAsync({
        address: CONTRACT_ADDRESSES.strategyINFT,
        abi: STRATEGY_INFT_ABI,
        functionName: "clone",
        args: [userAddress, BigInt(token.tokenId), MOCK_SEALED_KEY, MOCK_PROOF],
        gas: 500000n,    // Explicit gas limit for 0G Testnet
        type: 'legacy',  // Use legacy transaction for better compatibility
      });
      const normalizedHash = typeof hashData === "string" ? hashData : hashData?.hash ?? hashData?.transactionHash ?? String(hashData);
      setTxHash(normalizedHash);
      alert(`Transaction Submitted!\n\nHash (Copied to Clipboard): ${normalizedHash}\n\nExplorer: https://chainscan-galileo.0g.ai/tx/${normalizedHash}`);
      if (navigator.clipboard) navigator.clipboard.writeText(normalizedHash).catch(console.error);
    } catch (err) {
      console.error(err);
      setError(err.shortMessage || err.message);
      setStep("confirm");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">🧬 Clone Strategy iNFT</div>
        <div className="modal-subtitle">
          Creates a new iNFT with identical encrypted strategy metadata.
          The original token remains in your wallet.
        </div>

        <div className="strategy-info-panel">
          <span className="strategy-info-emoji">{meta.emoji}</span>
          <div>
            <div className="strategy-info-name">{meta.name}</div>
            <div className="strategy-info-type">Token #{token.tokenId} · ERC-7857</div>
          </div>
        </div>

        {step === "confirm" && (
          <>
            <div style={{
              background: "rgba(0,212,255,0.05)", border: "1px solid rgba(0,212,255,0.15)",
              borderRadius: "var(--radius-md)", padding: "14px 16px",
              fontSize: "13px", color: "var(--text-secondary)", marginBottom: "8px"
            }}>
              <div style={{ fontWeight: 600, color: "var(--accent-cyan)", marginBottom: "6px" }}>
                What happens when you clone?
              </div>
              <ul style={{ paddingLeft: "16px", lineHeight: "1.8" }}>
                <li>New iNFT minted to your address</li>
                <li>Identical strategy metadata (re-encrypted for you)</li>
                <li>Independent ownership — transfer or sell separately</li>
                <li>Live Deribit signals computed independently per token</li>
                <li>Oracle validates the metadata copy via TEE proof</li>
              </ul>
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "16px" }}>
              🔴 Contract address: {CONTRACT_ADDRESSES.strategyINFT === "0x0000000000000000000000000000000000000000" ? "Not deployed (demo mode)" : CONTRACT_ADDRESSES.strategyINFT}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost btn-full" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary btn-full" onClick={handleClone}>
                🧬 Clone Now
              </button>
            </div>
          </>
        )}

        {step === "pending" && (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div className="spinner" style={{ width: "40px", height: "40px", margin: "0 auto 16px", borderWidth: "3px", color: "var(--accent-cyan)" }} />
            <div style={{ fontWeight: 600 }}>Cloning Strategy...</div>
            <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "8px" }}>
              {isConfirming ? "Waiting for transaction confirmation..." : "Please confirm in your wallet..."}
            </div>
          </div>
        )}

        {step === "done" && (
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>✅</div>
            <div style={{ fontWeight: 700, fontSize: "18px", color: "var(--accent-green)", marginBottom: "8px" }}>
              Clone Successful!
            </div>
            <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "16px" }}>
              New iNFT has been minted to your wallet
            </div>
            {txHash && (
              <div style={{ fontSize: "13px", marginTop: "12px" }}>
                Transaction: <a
                  href={`https://chainscan-galileo.0g.ai/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--accent-green)", textDecoration: "underline" }}
                >
                  {txHash}
                </a>
              </div>
            )}
            <button className="btn btn-secondary btn-full" style={{ marginTop: "16px" }} onClick={onClose}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
