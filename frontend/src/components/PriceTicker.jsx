import React, { useState, useEffect } from "react";
import { useDeribitTicker, useDeribitIndexPrice } from "../hooks/useDeribit";

export default function PriceTicker() {
  const { ticker: btcTicker } = useDeribitTicker("BTC-PERPETUAL");
  const { ticker: ethTicker } = useDeribitTicker("ETH-PERPETUAL");
  const { price: btcIdx, change: btcChange } = useDeribitIndexPrice("btc");
  const { price: ethIdx, change: ethChange } = useDeribitIndexPrice("eth");

  const fmt = (n) => n ? `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : "—";
  const fmtChange = (n) => n ? `${n >= 0 ? "+" : ""}${n.toFixed(2)}%` : "";

  return (
    <div className="price-ticker">
      <div className="ticker-item">
        <span className="ticker-label">BTC INDEX</span>
        <span className="ticker-price">{fmt(btcIdx)}</span>
        {btcChange !== 0 && (
          <span className={`ticker-change ${btcChange >= 0 ? "up" : "down"}`}>
            {fmtChange(btcChange)}
          </span>
        )}
      </div>
      <div className="ticker-divider" />
      <div className="ticker-item">
        <span className="ticker-label">BTC PERP</span>
        <span className="ticker-price">{fmt(btcTicker?.last_price)}</span>
        {btcTicker && (
          <span className={`ticker-change ${(btcTicker.price_change || 0) >= 0 ? "up" : "down"}`}>
            {btcTicker.price_change ? fmtChange(btcTicker.price_change) : ""}
          </span>
        )}
      </div>
      <div className="ticker-divider" />
      <div className="ticker-item">
        <span className="ticker-label">ETH INDEX</span>
        <span className="ticker-price">{fmt(ethIdx)}</span>
        {ethChange !== 0 && (
          <span className={`ticker-change ${ethChange >= 0 ? "up" : "down"}`}>
            {fmtChange(ethChange)}
          </span>
        )}
      </div>
      <div className="ticker-divider" />
      <div className="ticker-item">
        <span className="ticker-label">ETH PERP</span>
        <span className="ticker-price">{fmt(ethTicker?.last_price)}</span>
      </div>
      {btcTicker && (
        <>
          <div className="ticker-divider" />
          <div className="ticker-item">
            <span className="ticker-label">BTC 24H VOL</span>
            <span className="ticker-price">{btcTicker.stats?.volume?.toFixed(1) || "—"} BTC</span>
          </div>
          <div className="ticker-divider" />
          <div className="ticker-item">
            <span className="ticker-label">BTC FUNDING</span>
            <span className={`ticker-price ${(btcTicker.funding_8h || 0) >= 0 ? "" : ""}`} style={{ color: (btcTicker.funding_8h || 0) >= 0 ? "var(--accent-green)" : "var(--accent-red)" }}>
              {btcTicker.funding_8h ? `${(btcTicker.funding_8h * 100).toFixed(4)}%` : "—"}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
