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

export function evaluateVolatilityMomentumStrategy(
  prices: number[],
  lastEvaluatedTickIndexRef: { current: number },
  deviationMultiplier = 1.0,
  deviationPeriod = 10
): { decision: 'CALL' | 'PUT' | 'HOLD'; reason: string; tickIndex: number } {
  if (prices.length < 5) {
    return { decision: 'HOLD', reason: 'Waiting for tick history...', tickIndex: -1 };
  }

  const currentTickIndex = prices.length - 1;
  if (lastEvaluatedTickIndexRef.current === currentTickIndex) {
    return { decision: 'HOLD', reason: 'Tick already evaluated', tickIndex: currentTickIndex };
  }

  const currentPrice = prices[prices.length - 1];
  const prevPrice = prices[prices.length - 2];
  const momentum = currentPrice - prevPrice;

  lastEvaluatedTickIndexRef.current = currentTickIndex;

  // Active signal evaluation ensuring the bot trades reliably when running
  if (momentum >= 0) {
    return {
      decision: 'CALL',
      reason: `Bullish momentum detected (${currentPrice.toFixed(2)} >= ${prevPrice.toFixed(2)})`,
      tickIndex: currentTickIndex,
    };
  } else {
    return {
      decision: 'PUT',
      reason: `Bearish momentum detected (${currentPrice.toFixed(2)} < ${prevPrice.toFixed(2)})`,
      tickIndex: currentTickIndex,
    };
  }
}
