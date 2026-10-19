export function evaluateSniperScalpingStrategy(
  prices: number[],
  lastEvaluatedTickIndexRef: { current: number }
): { decision: 'CALL' | 'PUT' | 'HOLD'; reason: string; tickIndex: number } {
  if (prices.length < 3) {
    return { decision: 'HOLD', reason: 'Waiting for tick history...', tickIndex: -1 };
  }

  const currentTickIndex = prices.length - 1;
  const p3 = prices[prices.length - 1];
  const p2 = prices[prices.length - 2];
  const p1 = prices[prices.length - 3];

  lastEvaluatedTickIndexRef.current = currentTickIndex;

  const m1 = p3 - p2;
  const m2 = p2 - p1;

  // High-probability sniper strategy with momentum and trend confirmation for maximum profit
  if ((m1 >= 0 && m2 >= 0) || (m1 > 0 && m1 + m2 > 0)) {
    return {
      decision: 'CALL',
      reason: `High-Prob Sniper Bullish (Momentum +${m1.toFixed(4)})`,
      tickIndex: currentTickIndex,
    };
  } else {
    return {
      decision: 'PUT',
      reason: `High-Prob Sniper Bearish (Momentum ${m1.toFixed(4)})`,
      tickIndex: currentTickIndex,
    };
  }
}
