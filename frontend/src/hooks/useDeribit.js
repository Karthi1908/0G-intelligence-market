import { useState, useEffect, useCallback, useRef } from "react";
import { getOHLCV, getTicker, getIndexPrice, subscribeToTicker } from "../utils/DeribitService";
import { computeSignal, computeCompositeSignal, STRATEGY_METADATA } from "../utils/strategies";

// ── Hook: Live Deribit OHLCV data ─────────────────────────────────────────────
export function useDeribitOHLCV(instrument = "BTC-PERPETUAL", resolution = "60", count = 200) {
  const [candles, setCandles]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  const fetchCandles = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getOHLCV(instrument, resolution, count);
      setCandles(data);
      setLastFetch(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [instrument, resolution, count]);

  useEffect(() => {
    fetchCandles();
    // Refresh every 60s (or per resolution)
    const interval = setInterval(fetchCandles, 60_000);
    return () => clearInterval(interval);
  }, [fetchCandles]);

  return { candles, loading, error, lastFetch, refresh: fetchCandles };
}

// ── Hook: Live Ticker ─────────────────────────────────────────────────────────
export function useDeribitTicker(instrument = "BTC-PERPETUAL") {
  const [ticker, setTicker]   = useState(null);
  const [loading, setLoading] = useState(true);
  const prevRef = useRef(null);

  useEffect(() => {
    // Initial fetch
    getTicker(instrument)
      .then((t) => { setTicker(t); prevRef.current = t; })
      .catch(console.error)
      .finally(() => setLoading(false));

    // Subscribe to live updates
    const unsub = subscribeToTicker(instrument, (data) => {
      setTicker(data);
    });

    // Polling fallback every 5s
    const poll = setInterval(() => {
      getTicker(instrument).then(setTicker).catch(() => {});
    }, 5000);

    return () => {
      unsub();
      clearInterval(poll);
    };
  }, [instrument]);

  return { ticker, loading };
}

// ── Hook: Index Price ─────────────────────────────────────────────────────────
export function useDeribitIndexPrice(currency = "btc") {
  const [price, setPrice]   = useState(null);
  const [change, setChange] = useState(0);

  useEffect(() => {
    let prevPrice = null;
    const fetch = () => {
      getIndexPrice(currency).then((res) => {
        const p = res.index_price;
        if (prevPrice !== null) setChange(((p - prevPrice) / prevPrice) * 100);
        prevPrice = p;
        setPrice(p);
      }).catch(() => {});
    };
    fetch();
    const interval = setInterval(fetch, 5000);
    return () => clearInterval(interval);
  }, [currency]);

  return { price, change };
}

// ── Hook: Strategy Live Signal ────────────────────────────────────────────────
export function useStrategySignal(strategyType, compositeParentTypes = []) {
  const [signal, setSignal]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [updatedAt, setUpdatedAt] = useState(null);

  const isComposite = compositeParentTypes.length > 0;
  const meta = STRATEGY_METADATA[strategyType];
  const instrument = meta?.deribitConfig?.instrument || "BTC-PERPETUAL";
  const resolution = meta?.deribitConfig?.resolution || "60";
  const dataPoints = meta?.deribitConfig?.dataPoints || 100;

  const compute = useCallback(async () => {
    try {
      setLoading(true);
      if (isComposite) {
        // Fetch signals for all parent strategies
        const parentSignals = await Promise.all(
          compositeParentTypes.map(async (pType) => {
            const pMeta = STRATEGY_METADATA[pType];
            const candles = await getOHLCV(
              pMeta?.deribitConfig?.instrument || "BTC-PERPETUAL",
              pMeta?.deribitConfig?.resolution || "60",
              pMeta?.deribitConfig?.dataPoints || 100
            );
            return computeSignal(pType, candles);
          })
        );
        const composite = computeCompositeSignal(parentSignals);
        setSignal({ ...composite, parentSignals });
      } else {
        const candles = await getOHLCV(instrument, resolution, dataPoints);
        const result  = computeSignal(strategyType, candles);
        setSignal(result);
      }
      setUpdatedAt(new Date());
    } catch (err) {
      console.error("Signal compute error:", err);
    } finally {
      setLoading(false);
    }
  }, [strategyType, instrument, resolution, dataPoints, isComposite]);

  useEffect(() => {
    compute();
    const interval = setInterval(compute, 60_000);
    return () => clearInterval(interval);
  }, [compute]);

  return { signal, loading, updatedAt, refresh: compute };
}
