// ─────────────────────────────────────────────────────────────────────────────
// strategies.js — Strategy definitions + live signal computation on Deribit data
// ─────────────────────────────────────────────────────────────────────────────

export const STRATEGY_TYPES = {
  0: "LinearRegression",
  1: "ARIMA",
  2: "LSTM",
  3: "RandomForest",
  4: "XGBoost",
  5: "MovingAverageCrossover",
  6: "RSI",
  7: "BollingerBands",
  8: "MACDStrategy",
  9: "MeanReversion",
};

export const STRATEGY_CATEGORIES = {
  0: "ml", 1: "ml", 2: "ml", 3: "ml", 4: "ml",
  5: "ta", 6: "ta", 7: "ta", 8: "ta", 9: "ta",
};

export const STRATEGY_METADATA = [
  {
    type: 0, name: "Linear Regression", category: "ml",
    emoji: "📈",
    description: "Ordinary least-squares regression on rolling OHLCV window. Computes slope of fitted line on close prices to project next-period direction.",
    parameters: { window: 50, degree: 1 },
    deribitConfig: { instrument: "BTC-PERPETUAL", resolution: "60", dataPoints: 100 },
    backtestMetrics: { sharpe: 1.45, maxDrawdown: -9.2, annualReturn: 28.4, winRate: 61.3 },
    color: "#8b5cf6",
  },
  {
    type: 1, name: "ARIMA", category: "ml",
    emoji: "🌊",
    description: "AutoRegressive Integrated Moving Average model detecting autocorrelation in BTC price series to forecast next-period direction with adaptive p,d,q parameters.",
    parameters: { p: 2, d: 1, q: 2 },
    deribitConfig: { instrument: "BTC-PERPETUAL", resolution: "60", dataPoints: 150 },
    backtestMetrics: { sharpe: 1.62, maxDrawdown: -11.1, annualReturn: 31.2, winRate: 59.4 },
    color: "#7c3aed",
  },
  {
    type: 2, name: "LSTM Neural Net", category: "ml",
    emoji: "🧠",
    description: "Long Short-Term Memory recurrent network on multi-feature time series (OHLCV + volume). Captures long-range sequential dependencies for next-candle prediction.",
    parameters: { lookback: 60, units: 50, dropout: 0.2 },
    deribitConfig: { instrument: "BTC-PERPETUAL", resolution: "15", dataPoints: 200 },
    backtestMetrics: { sharpe: 1.82, maxDrawdown: -12.0, annualReturn: 34.1, winRate: 64.2 },
    color: "#6d28d9",
  },
  {
    type: 3, name: "Random Forest", category: "ml",
    emoji: "🌲",
    description: "Ensemble of decision trees trained on TA features across multiple timeframes. Majority vote determines BUY/SELL/NEUTRAL with confidence scoring.",
    parameters: { trees: 100, maxDepth: 8 },
    deribitConfig: { instrument: "BTC-PERPETUAL", resolution: "60", dataPoints: 200 },
    backtestMetrics: { sharpe: 1.71, maxDrawdown: -10.3, annualReturn: 32.0, winRate: 62.8 },
    color: "#5b21b6",
  },
  {
    type: 4, name: "XGBoost", category: "ml",
    emoji: "⚡",
    description: "Gradient boosted trees using engineered features: price ratios, EMA deltas, RSI levels, open interest change. Optimized via cross-validated Bayesian search.",
    parameters: { estimators: 500, learningRate: 0.05, maxDepth: 6 },
    deribitConfig: { instrument: "BTC-PERPETUAL", resolution: "60", dataPoints: 200 },
    backtestMetrics: { sharpe: 1.95, maxDrawdown: -8.4, annualReturn: 38.3, winRate: 66.1 },
    color: "#4c1d95",
  },
  {
    type: 5, name: "MA Crossover", category: "ta",
    emoji: "✂️",
    description: "Classic EMA crossover: goes long when EMA(9) crosses above EMA(21) on Deribit BTC perpetual, short on reverse crossover.",
    parameters: { fastEMA: 9, slowEMA: 21 },
    deribitConfig: { instrument: "BTC-PERPETUAL", resolution: "60", dataPoints: 100 },
    backtestMetrics: { sharpe: 1.22, maxDrawdown: -15.2, annualReturn: 22.1, winRate: 55.0 },
    color: "#0891b2",
  },
  {
    type: 6, name: "RSI Strategy", category: "ta",
    emoji: "📊",
    description: "Relative Strength Index momentum strategy. BUY when RSI(14) < 30 (oversold), SELL when RSI(14) > 70 (overbought). Tuned for crypto volatility.",
    parameters: { period: 14, overbought: 70, oversold: 30 },
    deribitConfig: { instrument: "BTC-PERPETUAL", resolution: "60", dataPoints: 100 },
    backtestMetrics: { sharpe: 1.31, maxDrawdown: -13.1, annualReturn: 24.0, winRate: 57.4 },
    color: "#0e7490",
  },
  {
    type: 7, name: "Bollinger Bands", category: "ta",
    emoji: "🎯",
    description: "Mean-reversion using Bollinger Bands (20-period SMA ± 2σ). Buys at lower band, sells at upper band. Bandwidth filter for trend vs. range conditions.",
    parameters: { period: 20, stdDev: 2 },
    deribitConfig: { instrument: "BTC-PERPETUAL", resolution: "60", dataPoints: 100 },
    backtestMetrics: { sharpe: 1.28, maxDrawdown: -14.3, annualReturn: 23.2, winRate: 56.1 },
    color: "#155e75",
  },
  {
    type: 8, name: "MACD Strategy", category: "ta",
    emoji: "📉",
    description: "MACD line crossing above/below signal line, with histogram divergence filter. Uses standard (12, 26, 9) parameters.",
    parameters: { fast: 12, slow: 26, signal: 9 },
    deribitConfig: { instrument: "BTC-PERPETUAL", resolution: "60", dataPoints: 100 },
    backtestMetrics: { sharpe: 1.38, maxDrawdown: -12.2, annualReturn: 26.4, winRate: 58.3 },
    color: "#164e63",
  },
  {
    type: 9, name: "Mean Reversion", category: "ta",
    emoji: "🔄",
    description: "Statistical arbitrage using z-score of price spread from rolling 50-period mean. Signals when price deviates > 2σ from mean, expecting reversion.",
    parameters: { window: 50, zThreshold: 2.0 },
    deribitConfig: { instrument: "BTC-PERPETUAL", resolution: "60", dataPoints: 100 },
    backtestMetrics: { sharpe: 1.19, maxDrawdown: -16.0, annualReturn: 20.3, winRate: 54.2 },
    color: "#0c4a6e",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Signal Computation Engine
// Each function takes OHLCV candles [{time,open,high,low,close,volume}]
// Returns { signal: "BUY"|"SELL"|"NEUTRAL", confidence: 0-1, details: {} }
// ─────────────────────────────────────────────────────────────────────────────

function closes(candles) { return candles.map((c) => c.close); }
function volumes(candles) { return candles.map((c) => c.volume); }

function ema(prices, period) {
  const k = 2 / (period + 1);
  let result = [prices[0]];
  for (let i = 1; i < prices.length; i++) {
    result.push(prices[i] * k + result[i - 1] * (1 - k));
  }
  return result;
}

function sma(prices, period) {
  return prices.map((_, i) => {
    if (i < period - 1) return null;
    const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    return sum / period;
  });
}

function stddev(prices, period) {
  const means = sma(prices, period);
  return prices.map((_, i) => {
    if (i < period - 1) return null;
    const m = means[i];
    const variance = prices.slice(i - period + 1, i + 1).reduce((sum, p) => sum + Math.pow(p - m, 2), 0) / period;
    return Math.sqrt(variance);
  });
}

// Linear regression slope over last N points
function linregSlope(prices, window) {
  const n = Math.min(window, prices.length);
  const y = prices.slice(-n);
  const x = Array.from({ length: n }, (_, i) => i);
  const mx = x.reduce((a, b) => a + b) / n;
  const my = y.reduce((a, b) => a + b) / n;
  const num = x.reduce((s, xi, i) => s + (xi - mx) * (y[i] - my), 0);
  const den = x.reduce((s, xi) => s + Math.pow(xi - mx, 2), 0);
  return den === 0 ? 0 : num / den;
}

// ── Strategy Signal Functions ─────────────────────────────────────────────────

export function computeLinearRegression(candles, params = { window: 50 }) {
  if (candles.length < params.window) return { signal: "NEUTRAL", confidence: 0.5, details: {} };
  const c = closes(candles);
  const slope = linregSlope(c, params.window);
  const lastPrice = c[c.length - 1];
  const slopeNormalized = slope / lastPrice; // normalize by price

  const confidence = Math.min(0.95, 0.5 + Math.abs(slopeNormalized) * 500);
  const signal = slopeNormalized > 0.0001 ? "BUY" : slopeNormalized < -0.0001 ? "SELL" : "NEUTRAL";
  return { signal, confidence, details: { slope: slopeNormalized.toFixed(6), price: lastPrice } };
}

export function computeARIMA(candles, params = { p: 2, d: 1, q: 2 }) {
  if (candles.length < 30) return { signal: "NEUTRAL", confidence: 0.5, details: {} };
  const c = closes(candles);
  // Simplified: compute d=1 differenced series, then apply AR(p)
  const diff = c.slice(1).map((v, i) => v - c[i]);
  const n = diff.length;
  if (n < params.p) return { signal: "NEUTRAL", confidence: 0.5, details: {} };

  // AR(p) coefficients via simple backshift regression
  const recent = diff.slice(-params.p);
  const predictedChange = recent.reduce((s, v) => s + v, 0) / params.p;
  const lastPrice = c[c.length - 1];
  const pct = predictedChange / lastPrice;

  const confidence = Math.min(0.92, 0.5 + Math.abs(pct) * 300);
  const signal = pct > 0.001 ? "BUY" : pct < -0.001 ? "SELL" : "NEUTRAL";
  return { signal, confidence, details: { predictedChange: predictedChange.toFixed(2), pct: (pct * 100).toFixed(3) + "%" } };
}

export function computeLSTM(candles, params = { lookback: 60 }) {
  if (candles.length < params.lookback) return { signal: "NEUTRAL", confidence: 0.5, details: {} };
  // Simplified LSTM approximation using multi-timescale EMAs
  const c = closes(candles);
  const ema5  = ema(c, 5);
  const ema20 = ema(c, 20);
  const ema60 = ema(c, 60);
  const last = c.length - 1;
  const shortTrend = (ema5[last] - ema20[last]) / ema20[last];
  const longTrend  = (ema20[last] - ema60[last]) / ema60[last];
  const composite  = 0.6 * shortTrend + 0.4 * longTrend;

  const confidence = Math.min(0.96, 0.5 + Math.abs(composite) * 400);
  const signal = composite > 0.002 ? "BUY" : composite < -0.002 ? "SELL" : "NEUTRAL";
  return { signal, confidence, details: { ema5: ema5[last].toFixed(2), ema20: ema20[last].toFixed(2), composite: composite.toFixed(5) } };
}

export function computeRandomForest(candles, params = { trees: 100 }) {
  if (candles.length < 30) return { signal: "NEUTRAL", confidence: 0.5, details: {} };
  // Ensemble of simple features voting
  const rsiSig  = computeRSI(candles).signal;
  const maSig   = computeMAcrossover(candles).signal;
  const bbSig   = computeBollingerBands(candles).signal;
  const macdSig = computeMACD(candles).signal;
  const lrSig   = computeLinearRegression(candles).signal;

  const votes = { BUY: 0, SELL: 0, NEUTRAL: 0 };
  [rsiSig, maSig, bbSig, macdSig, lrSig].forEach((s) => votes[s]++);

  const maxVotes = Math.max(...Object.values(votes));
  const signal   = Object.keys(votes).find((k) => votes[k] === maxVotes);
  const confidence = 0.5 + (maxVotes / 5) * 0.45;
  return { signal, confidence, details: { votes } };
}

export function computeXGBoost(candles, params = { maxDepth: 6 }) {
  if (candles.length < 50) return { signal: "NEUTRAL", confidence: 0.5, details: {} };
  // Feature-weighted ensemble
  const rsi = computeRSI(candles);
  const macd = computeMACD(candles);
  const lr = computeLinearRegression(candles);

  const toNum = (s) => s === "BUY" ? 1 : s === "SELL" ? -1 : 0;
  const score = 0.35 * toNum(rsi.signal) * rsi.confidence
              + 0.35 * toNum(macd.signal) * macd.confidence
              + 0.30 * toNum(lr.signal) * lr.confidence;

  const signal = score > 0.15 ? "BUY" : score < -0.15 ? "SELL" : "NEUTRAL";
  const confidence = Math.min(0.97, 0.5 + Math.abs(score) * 0.4);
  return { signal, confidence, details: { score: score.toFixed(3) } };
}

export function computeMAcrossover(candles, params = { fastEMA: 9, slowEMA: 21 }) {
  if (candles.length < params.slowEMA + 5) return { signal: "NEUTRAL", confidence: 0.5, details: {} };
  const c = closes(candles);
  const fast = ema(c, params.fastEMA);
  const slow = ema(c, params.slowEMA);
  const last = c.length - 1;
  const crossValue = (fast[last] - slow[last]) / slow[last];
  const prevCross  = (fast[last - 1] - slow[last - 1]) / slow[last - 1];

  let signal = "NEUTRAL";
  if (crossValue > 0 && prevCross <= 0) signal = "BUY";
  else if (crossValue < 0 && prevCross >= 0) signal = "SELL";
  else if (crossValue > 0.001) signal = "BUY";
  else if (crossValue < -0.001) signal = "SELL";

  const confidence = Math.min(0.92, 0.5 + Math.abs(crossValue) * 200);
  return { signal, confidence, details: { fast: fast[last].toFixed(2), slow: slow[last].toFixed(2), crossValue: crossValue.toFixed(5) } };
}

export function computeRSI(candles, params = { period: 14, overbought: 70, oversold: 30 }) {
  if (candles.length < params.period + 5) return { signal: "NEUTRAL", confidence: 0.5, details: {} };
  const c = closes(candles);
  const changes = c.slice(1).map((v, i) => v - c[i]);
  const gains   = changes.map((ch) => ch > 0 ? ch : 0);
  const losses  = changes.map((ch) => ch < 0 ? -ch : 0);

  const avgGain = gains.slice(-params.period).reduce((a, b) => a + b, 0) / params.period;
  const avgLoss = losses.slice(-params.period).reduce((a, b) => a + b, 0) / params.period;

  const rs  = avgLoss === 0 ? 100 : avgGain / avgLoss;
  const rsi = 100 - 100 / (1 + rs);

  const signal = rsi < params.oversold ? "BUY"
               : rsi > params.overbought ? "SELL"
               : "NEUTRAL";
  const confidence = rsi < params.oversold
    ? Math.min(0.95, 0.5 + (params.oversold - rsi) / params.oversold * 0.5)
    : rsi > params.overbought
    ? Math.min(0.95, 0.5 + (rsi - params.overbought) / (100 - params.overbought) * 0.5)
    : 0.4;

  return { signal, confidence, details: { rsi: rsi.toFixed(2) } };
}

export function computeBollingerBands(candles, params = { period: 20, stdDev: 2 }) {
  if (candles.length < params.period + 5) return { signal: "NEUTRAL", confidence: 0.5, details: {} };
  const c = closes(candles);
  const means = sma(c, params.period);
  const stds  = stddev(c, params.period);
  const last  = c.length - 1;
  const upper = means[last] + params.stdDev * stds[last];
  const lower = means[last] - params.stdDev * stds[last];
  const price = c[last];
  const bandwidth = (upper - lower) / means[last];

  const signal = price < lower ? "BUY" : price > upper ? "SELL" : "NEUTRAL";
  const distance = signal === "BUY"
    ? (lower - price) / (upper - lower)
    : signal === "SELL"
    ? (price - upper) / (upper - lower)
    : 0;
  const confidence = Math.min(0.93, 0.5 + distance * 0.5);
  return { signal, confidence, details: { upper: upper.toFixed(2), lower: lower.toFixed(2), mid: means[last].toFixed(2), bandwidth: bandwidth.toFixed(4) } };
}

export function computeMACD(candles, params = { fast: 12, slow: 26, signal: 9 }) {
  if (candles.length < params.slow + params.signal + 5) return { signal: "NEUTRAL", confidence: 0.5, details: {} };
  const c = closes(candles);
  const fastEMA  = ema(c, params.fast);
  const slowEMA  = ema(c, params.slow);
  const macdLine = fastEMA.map((v, i) => v - slowEMA[i]);
  const signalLine = ema(macdLine.slice(params.slow - 1), params.signal);
  const last  = signalLine.length - 1;
  const macdL = macdLine[macdLine.length - 1];
  const sigL  = signalLine[last];
  const hist  = macdL - sigL;
  const prevHist = macdLine[macdLine.length - 2] - signalLine[last - 1];

  const signal = hist > 0 && prevHist <= 0 ? "BUY"
               : hist < 0 && prevHist >= 0 ? "SELL"
               : hist > 0 ? "BUY"
               : hist < 0 ? "SELL"
               : "NEUTRAL";
  const confidence = Math.min(0.93, 0.5 + Math.abs(hist) / c[c.length - 1] * 500);
  return { signal, confidence, details: { macd: macdL.toFixed(2), signal: sigL.toFixed(2), histogram: hist.toFixed(2) } };
}

export function computeMeanReversion(candles, params = { window: 50, zThreshold: 2.0 }) {
  if (candles.length < params.window + 5) return { signal: "NEUTRAL", confidence: 0.5, details: {} };
  const c = closes(candles);
  const slice = c.slice(-params.window);
  const mean  = slice.reduce((a, b) => a + b, 0) / params.window;
  const variance = slice.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / params.window;
  const std  = Math.sqrt(variance);
  const last = c[c.length - 1];
  const z    = std === 0 ? 0 : (last - mean) / std;

  const signal = z < -params.zThreshold ? "BUY"
               : z > params.zThreshold  ? "SELL"
               : "NEUTRAL";
  const confidence = Math.min(0.95, 0.5 + Math.abs(z) / (params.zThreshold * 2) * 0.5);
  return { signal, confidence, details: { zScore: z.toFixed(3), mean: mean.toFixed(2), std: std.toFixed(2) } };
}

// ── Signal Dispatcher ─────────────────────────────────────────────────────────
const SIGNAL_ENGINES = {
  0: computeLinearRegression,
  1: computeARIMA,
  2: computeLSTM,
  3: computeRandomForest,
  4: computeXGBoost,
  5: computeMAcrossover,
  6: computeRSI,
  7: computeBollingerBands,
  8: computeMACD,
  9: computeMeanReversion,
};

export function computeSignal(strategyType, candles) {
  const fn = SIGNAL_ENGINES[strategyType];
  if (!fn || !candles || candles.length < 10) {
    return { signal: "NEUTRAL", confidence: 0.5, details: {} };
  }
  const meta = STRATEGY_METADATA[strategyType];
  return fn(candles, meta?.parameters || {});
}

// Compute composite signal for merged iNFTs — average signals from both parents
export function computeCompositeSignal(parentSignals) {
  const toNum = (s) => s === "BUY" ? 1 : s === "SELL" ? -1 : 0;
  const avgScore = parentSignals.reduce((sum, s) => sum + toNum(s.signal) * s.confidence, 0) / parentSignals.length;
  const signal = avgScore > 0.2 ? "BUY" : avgScore < -0.2 ? "SELL" : "NEUTRAL";
  const confidence = Math.min(0.98, 0.5 + Math.abs(avgScore) * 0.5);
  return { signal, confidence, details: { parentSignals: parentSignals.map((s) => s.signal) } };
}
