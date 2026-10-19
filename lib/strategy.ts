function calculateEMA(data: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const emaArray: number[] = [];
  if (data.length === 0) return emaArray;
  let prevEMA = data[0];
  emaArray.push(prevEMA);
  for (let i = 1; i < data.length; i++) {
    const currentEMA = (data[i] - prevEMA) * k + prevEMA;
    emaArray.push(currentEMA);
    prevEMA = currentEMA;
  }
  return emaArray;
}

export function evaluateMacdCrossoverStrategy(
  prices: number[],
  lastCrossoverTickIndexRef: { current: number }
): { decision: 'CALL' | 'PUT' | 'HOLD'; reason: string; tickIndex: number } {
  // Require at least 35 ticks for stable EMA 12, EMA 26, Signal 9 calculation
  if (prices.length < 35) {
    return { decision: 'HOLD', reason: `Gathering MACD tick history (${prices.length}/35)...`, tickIndex: -1 };
  }

  const currentTickIndex = prices.length - 1;
  if (lastCrossoverTickIndexRef.current === currentTickIndex) {
    return { decision: 'HOLD', reason: 'Tick already evaluated for MACD', tickIndex: currentTickIndex };
  }

  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  
  const macdLine: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    macdLine.push(ema12[i] - ema26[i]);
  }

  const signalLine = calculateEMA(macdLine, 9);

  const currIdx = prices.length - 1;
  const prevIdx = prices.length - 2;

  const currMacd = macdLine[currIdx];
  const prevMacd = macdLine[prevIdx];
  const currSignal = signalLine[currIdx];
  const prevSignal = signalLine[prevIdx];

  // MACD line crosses above signal line -> BUY / RISE (CALL)
  const isBullishCrossover = prevMacd <= prevSignal && currMacd > currSignal;
  // MACD line crosses below signal line -> SELL / FALL (PUT)
  const isBearishCrossover = prevMacd >= prevSignal && currMacd < currSignal;

  if (isBullishCrossover && lastCrossoverTickIndexRef.current !== currIdx) {
    lastCrossoverTickIndexRef.current = currIdx;
    return {
      decision: 'CALL',
      reason: `MACD Bullish Crossover (MACD: ${currMacd.toFixed(4)} > Signal: ${currSignal.toFixed(4)})`,
      tickIndex: currIdx,
    };
  }

  if (isBearishCrossover && lastCrossoverTickIndexRef.current !== currIdx) {
    lastCrossoverTickIndexRef.current = currIdx;
    return {
      decision: 'PUT',
      reason: `MACD Bearish Crossover (MACD: ${currMacd.toFixed(4)} < Signal: ${currSignal.toFixed(4)})`,
      tickIndex: currIdx,
    };
  }

  return {
    decision: 'HOLD',
    reason: `MACD Neutral (MACD: ${currMacd.toFixed(4)}, Signal: ${currSignal.toFixed(4)})`,
    tickIndex: currIdx,
  };
}
