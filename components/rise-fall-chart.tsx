'use client';

import { memo } from 'react';
import type { ActiveSymbol } from '@deriv/core';

export interface RiseFallChartProps {
  symbolKey?: string;
  symbol?: string;
  activeSymbol?: ActiveSymbol | null;
  symbols?: ActiveSymbol[];
  isConnectionOpened?: boolean;
  isMobile?: boolean;
  prices?: number[];
  pipSize?: number;
  onSymbolChange?: (symbol: string) => void;
  [key: string]: unknown;
}

/**
 * RiseFallChart component: SmartChart has been completely removed in favor of
 * the lightweight, high-performance MarketLiveTicker.
 */
export const RiseFallChart = memo(function RiseFallChart() {
  return null;
});
