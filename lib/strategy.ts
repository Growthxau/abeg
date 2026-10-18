export interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
}

export function computeEMA(data: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const emaArray: number[] = [];
  if (data.length === 0) return emaArray;
  let prevEma = data[0];
  emaArray.push(prevEma);
  for (let i = 1; i < data.length; i++) {
    const currentEma = (data[i] - prevEma) * k + prevEma;
    emaArray.push(currentEma);
    prevEma = currentEma;
  }
  return emaArray;
}

export function computeRSI(closes: number[], period: number = 14): number[] {
  const rsiArray: number[] = [];
  if (closes.length < period + 1) return closes.map(() => 50);

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = 0; i < closes.length; i++) {
    if (i < period) {
      rsiArray.push(50);
      continue;
    }
    if (i > period) {
      const change = closes[i] - closes[i - 1];
      const gain = change > 0 ? change : 0;
      const loss = change < 0 ? -change : 0;
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
    }
    if (avgLoss === 0) {
      rsiArray.push(100);
    } else {
      const rs = avgGain / avgLoss;
      rsiArray.push(100 - 100 / (1 + rs));
    }
  }
  return rsiArray;
}

export function evaluateTrendAndPullbackStrategy(
  prices: number[],
  lastEvaluatedCandleIndexRef: { current: number }
): { decision: 'CALL' | 'PUT' | 'HOLD'; reason: string; candleIndex: number } {
  if (prices.length < 10) {
    return { decision: 'HOLD', reason: 'Waiting for sufficient price history', candleIndex: -1 };
  }

  // Convert raw ticks into completed candles (grouping every 3 ticks into 1 candle)
  const ticksPerCandle = 3;
  const candles: Candle[] = [];
  for (let i = 0; i < prices.length - ticksPerCandle; i += ticksPerCandle) {
    const chunk = prices.slice(i, i + ticksPerCandle);
    const open = chunk[0];
    const close = chunk[chunk.length - 1];
    const high = Math.max(...chunk);
    const low = Math.min(...chunk);
    candles.push({ open, high, low, close });
  }

  if (candles.length < 5) {
    // If not enough candles yet, use recent tick momentum
    const recentDir = prices[prices.length - 1] >= prices[prices.length - 3] ? 'CALL' : 'PUT';
    return { decision: recentDir, reason: 'Initial tick momentum signal', candleIndex: -1 };
  }

  const currentCandleIndex = candles.length - 1;
  // Rule 6: Use completed candles. Prevent duplicate entry on same candle.
  if (lastEvaluatedCandleIndexRef.current === currentCandleIndex) {
    return { decision: 'HOLD', reason: 'Already evaluated candle #' + currentCandleIndex, candleIndex: currentCandleIndex };
  }

  const closes = candles.map(c => c.close);
  const ema9 = computeEMA(closes, 5);
  const ema21 = computeEMA(closes, 10);
  const rsi = computeRSI(closes, 7);

  const idx = closes.length - 1;
  const e9 = ema9[idx];
  const e21 = ema21[idx];
  const currentRsi = rsi[idx];
  const currentClose = closes[idx];
  const prevClose = closes[idx - 1] ?? currentClose;

  // Entry logic: if EMA9 >= EMA21 or price rising, CALL, else PUT
  lastEvaluatedCandleIndexRef.current = currentCandleIndex;

  if (e9 >= e21 || currentClose >= prevClose) {
    return { decision: 'CALL', reason: `Bullish Trend Signal (EMA9: ${e9.toFixed(2)}, RSI: ${currentRsi.toFixed(1)})`, candleIndex: currentCandleIndex };
  } else {
    return { decision: 'PUT', reason: `Bearish Trend Signal (EMA9: ${e9.toFixed(2)}, RSI: ${currentRsi.toFixed(1)})`, candleIndex: currentCandleIndex };
  }
}
