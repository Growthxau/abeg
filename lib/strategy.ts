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

export function computeMACD(data: number[], fastPeriod = 5, slowPeriod = 13, signalPeriod = 4) {
  const fastEMA = computeEMA(data, fastPeriod);
  const slowEMA = computeEMA(data, slowPeriod);
  const macdLine = fastEMA.map((fast, i) => fast - slowEMA[i]);
  const signalLine = computeEMA(macdLine, signalPeriod);
  return { macdLine, signalLine };
}

export function evaluateMacdStrategy(
  prices: number[],
  lastEvaluatedTickIndexRef: { current: number }
): { decision: 'CALL' | 'PUT' | 'HOLD'; reason: string; tickIndex: number } {
  if (prices.length < 25) {
    return { decision: 'HOLD', reason: 'Waiting for sufficient price history (need 25+ ticks)', tickIndex: -1 };
  }

  const currentTickIndex = prices.length - 1;
  // Prevent duplicate signal evaluation on the exact same tick
  if (lastEvaluatedTickIndexRef.current === currentTickIndex) {
    return { decision: 'HOLD', reason: 'Already evaluated tick #' + currentTickIndex, tickIndex: currentTickIndex };
  }

  const ema20 = computeEMA(prices, 20);
  const { macdLine, signalLine } = computeMACD(prices, 5, 13, 4);

  const i = macdLine.length - 1;
  if (i < 1) {
    return { decision: 'HOLD', reason: 'Calculating MACD indicators...', tickIndex: currentTickIndex };
  }

  const currentPrice = prices[i];
  const prevPrice = prices[i - 1];
  const currentEma20 = ema20[i];

  const currentMacd = macdLine[i];
  const prevMacd = macdLine[i - 1];
  const currentSignal = signalLine[i];
  const prevSignal = signalLine[i - 1];

  // MACD crossover above signal line
  const macdCrossAbove = prevMacd <= prevSignal && currentMacd > currentSignal;
  // MACD crossover below signal line
  const macdCrossBelow = prevMacd >= prevSignal && currentMacd < currentSignal;

  // Trend filter: price above / below EMA 20
  const priceAboveEma = currentPrice > currentEma20;
  const priceBelowEma = currentPrice < currentEma20;

  // Next tick confirms upward / downward movement
  const confirmsUpward = currentPrice > prevPrice;
  const confirmsDownward = currentPrice < prevPrice;

  lastEvaluatedTickIndexRef.current = currentTickIndex;

  if (macdCrossAbove && priceAboveEma && confirmsUpward) {
    return {
      decision: 'CALL',
      reason: `RISE: MACD crossed above signal (${currentMacd.toFixed(4)} > ${currentSignal.toFixed(4)}), Price (${currentPrice.toFixed(2)}) > EMA20 (${currentEma20.toFixed(2)}), Tick confirmed UP.`,
      tickIndex: currentTickIndex,
    };
  }

  if (macdCrossBelow && priceBelowEma && confirmsDownward) {
    return {
      decision: 'PUT',
      reason: `FALL: MACD crossed below signal (${currentMacd.toFixed(4)} < ${currentSignal.toFixed(4)}), Price (${currentPrice.toFixed(2)}) < EMA20 (${currentEma20.toFixed(2)}), Tick confirmed DOWN.`,
      tickIndex: currentTickIndex,
    };
  }

  return {
    decision: 'HOLD',
    reason: `HOLD: MACD (${currentMacd.toFixed(4)}/${currentSignal.toFixed(4)}), Price (${currentPrice.toFixed(2)}) vs EMA20 (${currentEma20.toFixed(2)}). Skipping choppy/invalid condition.`,
    tickIndex: currentTickIndex,
  };
}
