const { ethers } = require("hardhat");
const { keccak256, toUtf8Bytes } = ethers.utils;

// ── Strategy Definitions ─────────────────────────────────────────────────────
const STRATEGIES = [
  {
    type: 0, // LinearRegression
    name: "Linear Regression",
    category: "ml",
    description:
      "Uses ordinary least squares regression on historical OHLCV data to project short-term price direction. Calculates slope of fitted line on close prices over a rolling window.",
    parameters: { window: 50, degree: 1, instrument: "BTC-PERPETUAL", resolution: "60" },
    backtestMetrics: { sharpe: 1.45, maxDrawdown: -0.09, annualReturn: 0.28, winRate: 0.61 },
    deribitConfig: { instrument: "BTC-PERPETUAL", resolution: "60", dataPoints: 100 },
  },
  {
    type: 1, // ARIMA
    name: "ARIMA",
    category: "ml",
    description:
      "AutoRegressive Integrated Moving Average model. Identifies autocorrelation patterns in BTC price series to forecast next-period direction. Adaptive p,d,q parameters.",
    parameters: { p: 2, d: 1, q: 2, instrument: "BTC-PERPETUAL", resolution: "60" },
    backtestMetrics: { sharpe: 1.62, maxDrawdown: -0.11, annualReturn: 0.31, winRate: 0.59 },
    deribitConfig: { instrument: "BTC-PERPETUAL", resolution: "60", dataPoints: 150 },
  },
  {
    type: 2, // LSTM
    name: "LSTM Neural Net",
    category: "ml",
    description:
      "Long Short-Term Memory recurrent network trained on multi-feature time series (OHLCV + volume). Captures long-range sequential dependencies for next-candle prediction.",
    parameters: { lookback: 60, units: 50, dropout: 0.2, instrument: "ETH-PERPETUAL", resolution: "15" },
    backtestMetrics: { sharpe: 1.82, maxDrawdown: -0.12, annualReturn: 0.34, winRate: 0.64 },
    deribitConfig: { instrument: "BTC-PERPETUAL", resolution: "15", dataPoints: 200 },
  },
  {
    type: 3, // RandomForest
    name: "Random Forest",
    category: "ml",
    description:
      "Ensemble of decision trees trained on technical features across multiple timeframes. Majority vote determines BUY/SELL/NEUTRAL signal with confidence scoring.",
    parameters: { trees: 100, maxDepth: 8, features: ["rsi", "macd", "bb", "volume", "oi"], instrument: "BTC-PERPETUAL", resolution: "60" },
    backtestMetrics: { sharpe: 1.71, maxDrawdown: -0.10, annualReturn: 0.32, winRate: 0.63 },
    deribitConfig: { instrument: "BTC-PERPETUAL", resolution: "60", dataPoints: 200 },
  },
  {
    type: 4, // XGBoost
    name: "XGBoost",
    category: "ml",
    description:
      "Gradient boosted tree model using engineered features: price ratios, EMA deltas, RSI levels, open interest change. Optimized via cross-validated Bayesian search.",
    parameters: { estimators: 500, learningRate: 0.05, maxDepth: 6, instrument: "BTC-PERPETUAL", resolution: "60" },
    backtestMetrics: { sharpe: 1.95, maxDrawdown: -0.08, annualReturn: 0.38, winRate: 0.66 },
    deribitConfig: { instrument: "BTC-PERPETUAL", resolution: "60", dataPoints: 200 },
  },
  {
    type: 5, // MovingAverageCrossover
    name: "MA Crossover",
    category: "ta",
    description:
      "Classic EMA crossover system: goes long when fast EMA(9) crosses above slow EMA(21) on Deribit BTC perpetual, short on reverse crossover.",
    parameters: { fastEMA: 9, slowEMA: 21, instrument: "BTC-PERPETUAL", resolution: "60" },
    backtestMetrics: { sharpe: 1.22, maxDrawdown: -0.15, annualReturn: 0.22, winRate: 0.55 },
    deribitConfig: { instrument: "BTC-PERPETUAL", resolution: "60", dataPoints: 100 },
  },
  {
    type: 6, // RSI
    name: "RSI Strategy",
    category: "ta",
    description:
      "Relative Strength Index momentum strategy. Generates BUY signal when RSI(14) < 30 (oversold) and SELL when RSI(14) > 70 (overbought). Tuned for crypto volatility.",
    parameters: { period: 14, overbought: 70, oversold: 30, instrument: "BTC-PERPETUAL", resolution: "60" },
    backtestMetrics: { sharpe: 1.31, maxDrawdown: -0.13, annualReturn: 0.24, winRate: 0.57 },
    deribitConfig: { instrument: "BTC-PERPETUAL", resolution: "60", dataPoints: 100 },
  },
  {
    type: 7, // BollingerBands
    name: "Bollinger Bands",
    category: "ta",
    description:
      "Mean-reversion strategy using Bollinger Bands (20-period SMA ± 2σ). Buys at lower band, sells at upper band. Incorporates bandwidth filter for trend vs. range conditions.",
    parameters: { period: 20, stdDev: 2, instrument: "BTC-PERPETUAL", resolution: "60" },
    backtestMetrics: { sharpe: 1.28, maxDrawdown: -0.14, annualReturn: 0.23, winRate: 0.56 },
    deribitConfig: { instrument: "BTC-PERPETUAL", resolution: "60", dataPoints: 100 },
  },
  {
    type: 8, // MACDStrategy
    name: "MACD Strategy",
    category: "ta",
    description:
      "Moving Average Convergence Divergence strategy. Signals generated on MACD line crossing above/below signal line, with histogram divergence filter.",
    parameters: { fast: 12, slow: 26, signal: 9, instrument: "BTC-PERPETUAL", resolution: "60" },
    backtestMetrics: { sharpe: 1.38, maxDrawdown: -0.12, annualReturn: 0.26, winRate: 0.58 },
    deribitConfig: { instrument: "BTC-PERPETUAL", resolution: "60", dataPoints: 100 },
  },
  {
    type: 9, // MeanReversion
    name: "Mean Reversion",
    category: "ta",
    description:
      "Statistical arbitrage using z-score of price spread from rolling 50-period mean. Generates signals when price deviates > 2σ from its mean, expecting reversion.",
    parameters: { window: 50, zThreshold: 2.0, instrument: "BTC-PERPETUAL", resolution: "60" },
    backtestMetrics: { sharpe: 1.19, maxDrawdown: -0.16, annualReturn: 0.20, winRate: 0.54 },
    deribitConfig: { instrument: "BTC-PERPETUAL", resolution: "60", dataPoints: 100 },
  },
];

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("\n🚀 Deploying to 0G Galileo Testnet...");
  console.log("Deployer:", deployer.address);
  const balance = await deployer.getBalance();
  console.log("Balance:", ethers.utils.formatEther(balance), "0G\n");

  // ── 1. Deploy MockOracle ─────────────────────────────────────────────────
  console.log("📡 Deploying MockOracle...");
  const MockOracle = await ethers.getContractFactory("MockOracle");
  const oracle = await MockOracle.deploy();
  await oracle.deployed();
  console.log("✅ MockOracle deployed to:", oracle.address);

  // ── 2. Deploy StrategyINFT ────────────────────────────────────────────────
  console.log("\n🧠 Deploying StrategyINFT (ERC-7857)...");
  const StrategyINFT = await ethers.getContractFactory("StrategyINFT");
  const inft = await StrategyINFT.deploy(oracle.address);
  await inft.deployed();
  console.log("✅ StrategyINFT deployed to:", inft.address);

  // ── 3. Deploy StrategyMarketplace ─────────────────────────────────────────
  console.log("\n🏪 Deploying StrategyMarketplace...");
  const Marketplace = await ethers.getContractFactory("StrategyMarketplace");
  const marketplace = await Marketplace.deploy(inft.address);
  await marketplace.deployed();
  console.log("✅ StrategyMarketplace deployed to:", marketplace.address);

  // ── 4. Link marketplace to iNFT contract ──────────────────────────────────
  console.log("\n🔗 Linking marketplace to iNFT contract...");
  const linkTx = await inft.setMarketplace(marketplace.address);
  await linkTx.wait();
  console.log("✅ Marketplace linked");

  // ── 5. Mint the 10 base strategy iNFTs ────────────────────────────────────
  console.log("\n🎨 Minting 10 base strategy iNFTs...");
  const mintedTokenIds = [];

  for (const strategy of STRATEGIES) {
    // Simulate encrypted URI (in production this would be 0G Storage URI)
    const metadataJson = JSON.stringify({
      name: strategy.name,
      type: strategy.type,
      category: strategy.category,
      description: strategy.description,
      parameters: strategy.parameters,
      deribitConfig: strategy.deribitConfig,
      backtestMetrics: strategy.backtestMetrics,
      liveSignal: { signal: "NEUTRAL", confidence: 0.5, updatedAt: Date.now() },
      version: "1.0",
      composite: false,
      parents: [],
      createdAt: Date.now(),
    });

    const metadataHash = keccak256(toUtf8Bytes(metadataJson));
    // In production: store on 0G Storage and use the real URI
    const encryptedURI = `ipfs://strategy-${strategy.type}-${strategy.name.toLowerCase().replace(/\s/g, "-")}`;

    const mintTx = await inft.mint(
      deployer.address,
      strategy.type,
      encryptedURI,
      metadataHash,
      { value: ethers.utils.parseEther("0.001") }
    );
    const receipt = await mintTx.wait();
    const mintEvent = receipt.events?.find((e) => e.event === "StrategyMinted");
    const tokenId = mintEvent?.args?.tokenId?.toString() || "?";

    mintedTokenIds.push(tokenId);
    console.log(`  ✅ Token #${tokenId}: ${strategy.name} (type ${strategy.type})`);
  }

  // ── 6. Output deployment summary ──────────────────────────────────────────
  console.log("\n" + "=".repeat(60));
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log("Network:           0G Galileo Testnet");
  console.log("Chain ID:          16602");
  console.log("Oracle:           ", oracle.address);
  console.log("StrategyINFT:     ", inft.address);
  console.log("Marketplace:      ", marketplace.address);
  console.log("Strategies minted:", mintedTokenIds.join(", "));
  console.log("=".repeat(60));
  console.log("\n📝 Add these to your .env:");
  console.log(`VITE_INFT_CONTRACT_ADDRESS=${inft.address}`);
  console.log(`VITE_MARKETPLACE_CONTRACT_ADDRESS=${marketplace.address}`);
  console.log(`VITE_ORACLE_CONTRACT_ADDRESS=${oracle.address}`);
  console.log("\n🔍 Explorer: https://chainscan-galileo.0g.ai/address/" + inft.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
