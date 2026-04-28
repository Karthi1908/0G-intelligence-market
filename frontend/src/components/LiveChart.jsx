import React, { useEffect, useRef } from "react";
import { createChart, ColorType, CrosshairMode } from "lightweight-charts";

const TIMEFRAMES = [
  { label: "15m", resolution: "15" },
  { label: "1H",  resolution: "60" },
  { label: "4H",  resolution: "240" },
  { label: "1D",  resolution: "1D" },
];

export default function LiveChart({
  candles = [],
  strategyType,
  signal,
  strategyMeta,
  resolution,
  onResolutionChange,
  instrument = "BTC-PERPETUAL",
}) {
  const chartRef       = useRef(null);
  const chartInstance  = useRef(null);
  const candleSeries   = useRef(null);
  const indicatorSeries = useRef([]);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = createChart(chartRef.current, {
      width:  chartRef.current.clientWidth,
      height: 340,
      layout: {
        background:  { type: ColorType.Solid, color: "transparent" },
        textColor:   "#94a3b8",
        fontFamily:  "'JetBrains Mono', monospace",
        fontSize:    11,
      },
      grid: {
        vertLines:   { color: "rgba(255,255,255,0.03)" },
        horzLines:   { color: "rgba(255,255,255,0.03)" },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.06)",
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.06)",
        timeVisible:  true,
        secondsVisible: false,
      },
    });

    chartInstance.current = chart;

    const cs = chart.addCandlestickSeries({
      upColor:          "#10b981",
      downColor:        "#ef4444",
      borderUpColor:    "#10b981",
      borderDownColor:  "#ef4444",
      wickUpColor:      "#10b981",
      wickDownColor:    "#ef4444",
    });
    candleSeries.current = cs;

    const handleResize = () => {
      if (chartRef.current) {
        chart.applyOptions({ width: chartRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (!candleSeries.current || !candles.length) return;
    const sorted = [...candles].sort((a, b) => a.time - b.time);
    candleSeries.current.setData(sorted);

    // Remove old indicators
    indicatorSeries.current.forEach((s) => {
      try { chartInstance.current?.removeSeries(s); } catch {}
    });
    indicatorSeries.current = [];

    if (!strategyType === undefined || !sorted.length) return;

    const closes  = sorted.map((c) => c.close);

    // Add strategy-specific overlays
    if (strategyType === 5) { // MA Crossover
      addEMASeries(sorted, closes, 9,  "#00d4ff");
      addEMASeries(sorted, closes, 21, "#7b2fff");
    }
    if (strategyType === 7) { // Bollinger Bands
      addBBSeries(sorted, closes, 20, 2);
    }
    if (strategyType === 2 || strategyType === 1 || strategyType === 0) { // ML — show EMA overlays
      addEMASeries(sorted, closes, 20, "#7b2fff");
      addEMASeries(sorted, closes, 50, "#00d4ff");
    }
    if (strategyType === 8) { // MACD
      addEMASeries(sorted, closes, 12, "#00d4ff");
      addEMASeries(sorted, closes, 26, "#7b2fff");
    }

  }, [candles, strategyType]);

  function addEMASeries(sorted, closes, period, color) {
    const k = 2 / (period + 1);
    let emaVal = closes[0];
    const data = sorted.map((c, i) => {
      emaVal = i === 0 ? closes[0] : closes[i] * k + emaVal * (1 - k);
      return { time: c.time, value: emaVal };
    }).filter((_, i) => i >= period);

    const series = chartInstance.current.addLineSeries({
      color, lineWidth: 1, priceLineVisible: false, lastValueVisible: false,
    });
    series.setData(data);
    indicatorSeries.current.push(series);
  }

  function addBBSeries(sorted, closes, period, stdDev) {
    const sma = closes.map((_, i) => {
      if (i < period - 1) return null;
      return closes.slice(i - period + 1, i + 1).reduce((a, b) => a + b) / period;
    });
    const sd = closes.map((_, i) => {
      if (!sma[i]) return null;
      const m = sma[i];
      const v = closes.slice(i - period + 1, i + 1).reduce((s, p) => s + Math.pow(p - m, 2), 0) / period;
      return Math.sqrt(v);
    });

    ["upper", "mid", "lower"].forEach((band, idx) => {
      const color = ["rgba(0,212,255,0.4)", "rgba(148,163,184,0.3)", "rgba(239,68,68,0.4)"][idx];
      const data = sorted.map((c, i) => {
        if (!sma[i]) return null;
        const val = idx === 0 ? sma[i] + stdDev * sd[i]
                  : idx === 1 ? sma[i]
                  : sma[i] - stdDev * sd[i];
        return { time: c.time, value: val };
      }).filter(Boolean);

      const series = chartInstance.current.addLineSeries({
        color, lineWidth: idx === 1 ? 1 : 1,
        lineStyle: idx === 1 ? 2 : 0,
        priceLineVisible: false, lastValueVisible: false,
      });
      series.setData(data);
      indicatorSeries.current.push(series);
    });
  }

  return (
    <div className="chart-container">
      <div className="chart-header">
        <div>
          <span className="chart-title">{instrument}</span>
          {signal && (
            <span className={`signal-badge ${signal.signal}`} style={{ marginLeft: "12px" }}>
              {signal.signal}
              {signal.confidence && ` • ${(signal.confidence * 100).toFixed(0)}%`}
            </span>
          )}
        </div>
        <div className="chart-controls">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.resolution}
              className={`chart-tf-btn ${resolution === tf.resolution ? "active" : ""}`}
              onClick={() => onResolutionChange?.(tf.resolution)}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>
      <div className="chart-area">
        <div ref={chartRef} style={{ width: "100%" }} />
        {!candles.length && (
          <div style={{ padding: "60px", textAlign: "center", color: "var(--text-muted)" }}>
            <div className="skeleton" style={{ height: "280px", borderRadius: 0 }} />
          </div>
        )}
      </div>
    </div>
  );
}
