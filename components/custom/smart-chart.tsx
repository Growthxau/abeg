'use client';

import React from 'react';

export interface ChartBarrier {
  shade?: string;
  color?: string;
  shadeColor?: string;
  foregroundColor?: string;
  high?: number | string;
  low?: number | string;
  relative?: boolean;
  draggable?: boolean;
  hideBarrierLine?: boolean;
  hideOffscreenBarrier?: boolean;
  hideOffscreenLine?: boolean;
  hidePriceLabel?: boolean;
}

export interface SmartChartWrapperProps {
  chartId?: string;
  symbolKey?: string;
  symbol?: string;
  isConnectionOpened?: boolean;
  isMobile?: boolean;
  [key: string]: unknown;
}

/**
 * SmartChart has been completely removed to ensure zero scroll lag, zero UI freezes,
 * and lightning-fast auto trading bot execution.
 */
export function SmartChartWrapper(_props: SmartChartWrapperProps) {
  return null;
}
