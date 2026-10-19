export function evaluateSniperScalpingStrategy(
  prices: number[],
  lastEvaluatedTickIndexRef: { current: number }
): { decision: 'CALL' | 'PUT' | 'HOLD'; reason: string; tickIndex: number } {
  if (prices.length < 2) {
    return { decision: 'HOLD', reason: 'Waiting for tick data...', tickIndex: -1 };
  }

  const currentTickIndex = prices.length - 1;
  const currentPrice = prices[prices.length - 1];
  const prevPrice = prices[prices.length - 2];
  const prevPrevPrice = prices.length >= 3 ? prices[prices.length - 3] : prevPrice;

  lastEvaluatedTickIndexRef.current = currentTickIndex;

  const momentum = currentPrice - prevPrice;
  const trend = prevPrice - prevPrevPrice;

  // Faster sniper scalping strategy (no bands, continuous trading on momentum/trend)
  if (momentum >= 0 || trend >= 0) {
    return {
      decision: 'CALL',
      reason: `Sniper Bullish Scalp (Δ +${momentum.toFixed(4)})`,
      tickIndex: currentTickIndex,
    };
  } else {
    return {
      decision: 'PUT',
      reason: `Sniper Bearish Scalp (Δ ${momentum.toFixed(4)})`,
      tickIndex: currentTickIndex,
    };
  }
}
