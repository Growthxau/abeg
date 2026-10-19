export function evaluateVolatilityBreakoutDeviationStrategy(
  prices: number[],
  lastEvaluatedTickIndexRef: { current: number },
  deviationMultiplier = 1.5,
  deviationPeriod = 15
): { decision: 'CALL' | 'PUT' | 'HOLD'; reason: string; tickIndex: number } {
  if (prices.length < Math.max(5, deviationPeriod)) {
    return { decision: 'HOLD', reason: 'Waiting for tick history...', tickIndex: -1 };
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

  // Volatility Breakout Deviation Strategy
  if (currentPrice >= upperBand || (zScore >= 0.8 && momentum >= 0)) {
    return {
      decision: 'CALL',
      reason: `Bullish volatility deviation breakout (Z-Score: +${zScore.toFixed(2)}σ)`,
      tickIndex: currentTickIndex,
    };
  }

  if (currentPrice <= lowerBand || (zScore <= -0.8 && momentum <= 0)) {
    return {
      decision: 'PUT',
      reason: `Bearish volatility deviation breakout (Z-Score: ${zScore.toFixed(2)}σ)`,
      tickIndex: currentTickIndex,
    };
  }

  return {
    decision: 'HOLD',
    reason: `Consolidating within deviation envelope (Z-Score: ${zScore.toFixed(2)}σ)`,
    tickIndex: currentTickIndex,
  };
}
