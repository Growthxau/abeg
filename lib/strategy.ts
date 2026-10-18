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
  if (prices.length < 35) {
    return { decision: 'HOLD', reason: 'Waiting for sufficient price history', candleIndex: -1 };
  }

  // Convert raw ticks into completed candles (grouping every 5 ticks into 1 candle)
  const ticksPerCandle = 5;
  const candles: Candle[] = [];
  for (let i = 0; i < prices.length - ticksPerCandle; i += ticksPerCandle) {
    const chunk = prices.slice(i, i + ticksPerCandle);
    const open = chunk[0];
    const close = chunk[chunk.length - 1];
    const high = Math.max(...chunk);
    const low = Math.min(...chunk);
    candles.push({ open, high, low, close });
  }

  if (candles.length < 25) {
    return { decision: 'HOLD', reason: 'Building completed candles...', candleIndex: -1 };
  }

  const currentCandleIndex = candles.length - 1;
  // Rule 6: Use completed candles. Prevent duplicate entry on same candle.
  if (lastEvaluatedCandleIndexRef.current === currentCandleIndex) {
    return { decision: 'HOLD', reason: 'Already evaluated candle #' + currentCandleIndex, candleIndex: currentCandleIndex };
  }

  const closes = candles.map(c => c.close);
  const ema9 = computeEMA(closes, 9);
  const ema21 = computeEMA(closes, 21);
  const rsi = computeRSI(closes, 14);

  const idx = closes.length - 1;
  const e9 = ema9[idx];
  const e21 = ema21[idx];
  const prevE9 = ema9[idx - 1];
  const prevE21 = ema21[idx - 1];
  const currentRsi = rsi[idx];
  const currentClose = closes[idx];
  const prevClose = closes[idx - 1];

  // Volatility calculation (standard deviation of recent candle closes)
  const recentCloses = closes.slice(-10);
  const meanClose = recentCloses.reduce((a, b) => a + b, 0) / recentCloses.length;
  const variance = recentCloses.reduce((acc, c) => acc + Math.pow(c - meanClose, 2), 0) / recentCloses.length;
  const volatility = Math.sqrt(variance) || 0.001;

  const emaDiff = Math.abs(e9 - e21);
  const minRequiredSeparation = 0.15 * volatility; // Strict sideways filter threshold

  // Rule 4: Strict sideways-market filter
  const isCrossing = (prevE9 <= prevE21 && e9 > e21) || (prevE9 >= prevE21 && e9 < e21);
  if (emaDiff < minRequiredSeparation || isCrossing) {
    return { decision: 'HOLD', reason: 'Sideways / choppy market filtered out', candleIndex: currentCandleIndex };
  }

  // Rule 1: Trend detection via EMA 9 and EMA 21
  const isBullishTrend = e9 > e21 && e9 > prevE9;
  const isBearishTrend = e9 < e21 && e9 < prevE9;

  // Rule 2: Pullback confirmation
  const isBullishPullbackRecovery = prevClose <= prevE9 && currentClose > prevClose;
  const isBearishPullbackRecovery = prevClose >= prevE9 && currentClose < prevClose;

  // Rule 3: RSI confirmation
  const isRsiBullish = currentRsi > 50 && currentRsi < 80;
  const isRsiBearish = currentRsi < 50 && currentRsi > 20;

  // Rule 5: Entry rules
  if (isBullishTrend && isBullishPullbackRecovery && isRsiBullish) {
    lastEvaluatedCandleIndexRef.current = currentCandleIndex;
    return { decision: 'CALL', reason: `Bullish Trend & Pullback confirmed (RSI: ${currentRsi.toFixed(1)})`, candleIndex: currentCandleIndex };
  }

  if (isBearishTrend && isBearishPullbackRecovery && isRsiBearish) {
    lastEvaluatedCandleIndexRef.current = currentCandleIndex;
    return { decision: 'PUT', reason: `Bearish Trend & Pullback confirmed (RSI: ${currentRsi.toFixed(1)})`, candleIndex: currentCandleIndex };
  }

  return { decision: 'HOLD', reason: 'Waiting for valid trend + pullback setup', candleIndex: currentCandleIndex };
}
