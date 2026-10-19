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
  deviationMultiplier = 1.5,
  deviationPeriod = 15
): { decision: 'CALL' | 'PUT' | 'HOLD'; reason: string; tickIndex: number } {
  if (prices.length < Math.max(10, deviationPeriod)) {
    return { decision: 'HOLD', reason: 'Waiting for sufficient tick history...', tickIndex: -1 };
  }

  const currentTickIndex = prices.length - 1;
  if (lastEvaluatedTickIndexRef.current === currentTickIndex) {
    return { decision: 'HOLD', reason: 'Tick already evaluated', tickIndex: currentTickIndex };
  }

  const window = prices.slice(-deviationPeriod);
  const currentPrice = prices[prices.length - 1];
  const prevPrice = prices[prices.length - 2];

  const mean = window.reduce((a, b) => a + b, 0) / window.length;
  const variance = window.reduce((acc, p) => acc + Math.pow(p - mean, 2), 0) / window.length;
  const deviation = Math.sqrt(variance);

  const upperBand = mean + deviationMultiplier * deviation;
  const lowerBand = mean - deviationMultiplier * deviation;

  const zScore = deviation > 0 ? (currentPrice - mean) / deviation : 0;
  const momentum = currentPrice - prevPrice;

  lastEvaluatedTickIndexRef.current = currentTickIndex;

  // Volatility Breakout Deviation + Momentum Volatility + Tick Confluence
  if (currentPrice >= upperBand || (zScore >= 1.2 && momentum > 0 && currentPrice > mean)) {
    return {
      decision: 'CALL',
      reason: `RISE Signal: Volatility deviation upper band breakthrough with positive momentum.`,
      tickIndex: currentTickIndex,
    };
  }

  if (currentPrice <= lowerBand || (zScore <= -1.2 && momentum < 0 && currentPrice < mean)) {
    return {
      decision: 'PUT',
      reason: `FALL Signal: Volatility deviation lower band breakthrough with negative momentum.`,
      tickIndex: currentTickIndex,
    };
  }

  return {
    decision: 'HOLD',
    reason: `Market consolidating within volatility envelope (Z-Score: ${zScore.toFixed(2)}σ).`,
    tickIndex: currentTickIndex,
  };
}
