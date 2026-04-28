// ─────────────────────────────────────────────────────────────────────────────
// DeribitService.js — Live market data from Deribit Testnet
// WebSocket: wss://test.deribit.com/ws/api/v2
// REST:      https://test.deribit.com/api/v2
// ─────────────────────────────────────────────────────────────────────────────

const DERIBIT_WS_URL  = "wss://test.deribit.com/ws/api/v2";
const DERIBIT_REST_URL = "https://test.deribit.com/api/v2";

let ws = null;
let wsReady = false;
let pendingRequests = new Map();
let reqId = 1;
let subscribers = new Map(); // channel -> [callbacks]

// ── WebSocket Connection ──────────────────────────────────────────────────────
function getWebSocket() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    return ws;
  }

  ws = new WebSocket(DERIBIT_WS_URL);
  wsReady = false;

  ws.onopen = () => {
    wsReady = true;
    console.log("[Deribit] WebSocket connected");
  };

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);

    // Handle RPC responses
    if (msg.id && pendingRequests.has(msg.id)) {
      const { resolve, reject } = pendingRequests.get(msg.id);
      pendingRequests.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
    }

    // Handle subscription notifications
    if (msg.method === "subscription" && msg.params) {
      const channel = msg.params.channel;
      const callbacks = subscribers.get(channel) || [];
      callbacks.forEach((cb) => cb(msg.params.data));
    }
  };

  ws.onerror = (err) => console.error("[Deribit] WebSocket error:", err);
  ws.onclose = () => {
    wsReady = false;
    console.log("[Deribit] WebSocket closed — reconnecting in 3s");
    setTimeout(getWebSocket, 3000);
  };

  return ws;
}

// Send a JSON-RPC request over WebSocket
async function wsRequest(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = reqId++;
    const send = () => {
      const socket = getWebSocket();
      if (socket.readyState !== WebSocket.OPEN) {
        setTimeout(send, 200);
        return;
      }
      pendingRequests.set(id, { resolve, reject });
      socket.send(JSON.stringify({ jsonrpc: "2.0", id, method, params }));
    };
    send();
  });
}

// ── REST Fetch ────────────────────────────────────────────────────────────────
async function restFetch(endpoint, params = {}) {
  const url = new URL(`${DERIBIT_REST_URL}/${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Deribit REST error: ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.result;
}

// ── Public API Methods ────────────────────────────────────────────────────────

/**
 * Get OHLCV candles from Deribit
 * @param {string} instrument - e.g. "BTC-PERPETUAL"
 * @param {string} resolution - "1"|"3"|"5"|"15"|"30"|"60"|"120"|"180"|"360"|"720"|"1D"
 * @param {number} count - number of candles (max 5000)
 */
export async function getOHLCV(instrument = "BTC-PERPETUAL", resolution = "60", count = 200) {
  const endTs = Date.now();
  const resolutionMs = resolution === "1D"
    ? 86400000
    : parseInt(resolution) * 60 * 1000;
  const startTs = endTs - count * resolutionMs;

  const result = await restFetch("public/get_tradingview_chart_data", {
    instrument_name: instrument,
    resolution,
    start_timestamp: startTs,
    end_timestamp: endTs,
  });

  if (!result || result.status === "no_data") return [];

  // Convert to [{time, open, high, low, close, volume}]
  return result.ticks.map((t, i) => ({
    time:   Math.floor(t / 1000), // lightweight-charts uses seconds
    open:   result.open[i],
    high:   result.high[i],
    low:    result.low[i],
    close:  result.close[i],
    volume: result.volume[i],
  }));
}

/**
 * Get current ticker for an instrument
 */
export async function getTicker(instrument = "BTC-PERPETUAL") {
  return restFetch("public/ticker", { instrument_name: instrument });
}

/**
 * Get index price
 */
export async function getIndexPrice(currency = "btc") {
  return restFetch("public/get_index_price", { index_name: `${currency}_usd` });
}

/**
 * Get available instruments
 */
export async function getInstruments(currency = "BTC", kind = "future") {
  return restFetch("public/get_instruments", { currency, kind, expired: false });
}

/**
 * Get order book
 */
export async function getOrderBook(instrument = "BTC-PERPETUAL", depth = 10) {
  return restFetch("public/get_order_book", {
    instrument_name: instrument,
    depth,
  });
}

/**
 * Subscribe to live trades via WebSocket
 */
export function subscribeToTrades(instrument = "BTC-PERPETUAL", callback) {
  const channel = `trades.${instrument}.any`;
  if (!subscribers.has(channel)) subscribers.set(channel, []);
  subscribers.get(channel).push(callback);

  wsRequest("public/subscribe", { channels: [channel] }).catch(console.error);

  return () => {
    const cbs = subscribers.get(channel) || [];
    subscribers.set(channel, cbs.filter((cb) => cb !== callback));
  };
}

/**
 * Subscribe to live ticker
 */
export function subscribeToTicker(instrument = "BTC-PERPETUAL", callback) {
  const channel = `ticker.${instrument}.100ms`;
  if (!subscribers.has(channel)) subscribers.set(channel, []);
  subscribers.get(channel).push(callback);

  wsRequest("public/subscribe", { channels: [channel] }).catch(console.error);
  return () => {
    const cbs = subscribers.get(channel) || [];
    subscribers.set(channel, cbs.filter((cb) => cb !== callback));
  };
}

// Initialize WebSocket on module load
getWebSocket();

export default {
  getOHLCV,
  getTicker,
  getIndexPrice,
  getInstruments,
  getOrderBook,
  subscribeToTrades,
  subscribeToTicker,
};
