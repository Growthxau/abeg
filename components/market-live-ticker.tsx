'use client';

import { useMemo, useState, useEffect } from 'react';
import type { ActiveSymbol } from '@deriv/core';
import { SymbolSelector } from '@/components/custom/symbol-selector';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  BrainCircuit,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
  Radio,
} from 'lucide-react';
import type { UseAutoTradingBotReturn } from '@/hooks/use-auto-trading-bot';

export interface MarketLiveTickerProps {
  symbols: ActiveSymbol[];
  activeSymbol: ActiveSymbol | null;
  onSymbolChange: (symbol: string) => void;
  prices?: number[];
  pipSize?: number;
  bot?: UseAutoTradingBotReturn;
  isConnected: boolean;
}

export function MarketLiveTicker({
  symbols,
  activeSymbol,
  onSymbolChange,
  prices = [],
  pipSize = 2,
  bot,
  isConnected,
}: MarketLiveTickerProps) {
  const currentPrice = prices.length > 0 ? prices[prices.length - 1] : 0;
  const prevPrice = prices.length > 1 ? prices[prices.length - 2] : currentPrice;
  const priceDiff = currentPrice - prevPrice;
  const isUp = priceDiff >= 0;

  // Flash animation state when tick updates
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    if (prices.length < 2) return;
    const diff = prices[prices.length - 1] - prices[prices.length - 2];
    if (diff > 0) {
      setFlash('up');
    } else if (diff < 0) {
      setFlash('down');
    }
    const timer = setTimeout(() => setFlash(null), 350);
    return () => clearTimeout(timer);
  }, [prices]);

  // Session stats calculation
  const stats = useMemo(() => {
    if (!prices || prices.length === 0) {
      return { min: 0, max: 0, mean: 0, stdDev: 0, upperBand: 0, lowerBand: 0, zScore: 0 };
    }
    const recent = prices.slice(-30);
    const min = Math.min(...recent);
    const max = Math.max(...recent);
    const sum = recent.reduce((a, b) => a + b, 0);
    const mean = sum / recent.length;
    const variance =
      recent.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (recent.length || 1);
    const stdDev = Math.sqrt(variance);

    const mult = bot?.settings.deviationMultiplier ?? 2.0;
    const upperBand = mean + mult * stdDev;
    const lowerBand = mean - mult * stdDev;
    const zScore = stdDev > 0 ? (currentPrice - mean) / stdDev : 0;

    return { min, max, mean, stdDev, upperBand, lowerBand, zScore };
  }, [prices, currentPrice, bot?.settings.deviationMultiplier]);

  // Sparkline coordinates
  const sparklineData = useMemo(() => {
    const pts = prices.slice(-40);
    if (pts.length < 2) return null;

    const width = 460;
    const height = 120;
    const padding = 14;

    const minP = Math.min(...pts, stats.lowerBand || pts[0]);
    const maxP = Math.max(...pts, stats.upperBand || pts[pts.length - 1]);
    const range = maxP - minP || 1;

    const coords = pts.map((p, i) => {
      const x = padding + (i / (pts.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((p - minP) / range) * (height - 2 * padding);
      return { x, y, p };
    });

    const pointsString = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');

    // Mean and band lines
    const meanY = height - padding - ((stats.mean - minP) / range) * (height - 2 * padding);
    const upperY = height - padding - ((stats.upperBand - minP) / range) * (height - 2 * padding);
    const lowerY = height - padding - ((stats.lowerBand - minP) / range) * (height - 2 * padding);

    const lastCoord = coords[coords.length - 1];

    return {
      width,
      height,
      pointsString,
      coords,
      lastCoord,
      meanY,
      upperY,
      lowerY,
    };
  }, [prices, stats]);

  const decimals = pipSize ?? 2;
  const formattedPrice = currentPrice ? currentPrice.toFixed(decimals) : '—';
  const formattedDiff = priceDiff !== 0 ? `${isUp ? '+' : ''}${priceDiff.toFixed(decimals)}` : '0.00';
  const pctDiff = prevPrice > 0 ? `${isUp ? '+' : ''}${((priceDiff / prevPrice) * 100).toFixed(3)}%` : '0.00%';

  const isBreakoutUp = stats.zScore >= (bot?.settings.deviationMultiplier ?? 2.0);
  const isBreakoutDown = stats.zScore <= -(bot?.settings.deviationMultiplier ?? 2.0);

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Symbol Selector card */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isConnected ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  isConnected ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
            </span>
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              {isConnected ? 'Live Deriv Market Feed' : 'Connecting to Deriv...'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
            <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span>Ticks: {prices.length}</span>
          </div>
        </div>

        <SymbolSelector
          symbols={symbols}
          activeSymbol={activeSymbol}
          onSymbolChange={onSymbolChange}
          prices={prices}
          pipSize={pipSize}
        />
      </div>

      {/* Real-time Ticker & Price Action Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 relative overflow-hidden">
        {/* Flash background highlight on tick change */}
        <div
          className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${
            flash === 'up'
              ? 'bg-emerald-50/60 opacity-100'
              : flash === 'down'
              ? 'bg-rose-50/60 opacity-100'
              : 'opacity-0'
          }`}
        />

        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-3 border-b border-slate-100 relative">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
              <span>Spot Price</span>
              <span className="text-slate-400 font-mono text-[11px]">({activeSymbol?.underlying_symbol_name ?? activeSymbol?.underlying_symbol})</span>
            </div>
            <div className="flex items-baseline gap-2.5 mt-1">
              <span
                className={`text-3xl sm:text-4xl font-extrabold tracking-tight font-mono transition-colors duration-200 ${
                  flash === 'up'
                    ? 'text-emerald-600'
                    : flash === 'down'
                    ? 'text-rose-600'
                    : 'text-slate-900'
                }`}
              >
                {formattedPrice}
              </span>

              <div
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                  isUp
                    ? 'bg-emerald-100/80 text-emerald-700'
                    : 'bg-rose-100/80 text-rose-700'
                }`}
              >
                {isUp ? (
                  <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5 stroke-[2.5]" />
                )}
                <span>{formattedDiff}</span>
                <span className="opacity-75 font-normal">({pctDiff})</span>
              </div>
            </div>
          </div>

          {/* Quick Session Stats */}
          <div className="flex items-center gap-3 text-xs">
            <div className="bg-slate-50 border border-slate-200/60 rounded-lg px-2.5 py-1.5">
              <div className="text-[10px] text-slate-500 font-medium">Session Low</div>
              <div className="font-mono font-bold text-slate-700">
                {stats.min ? stats.min.toFixed(decimals) : '—'}
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200/60 rounded-lg px-2.5 py-1.5">
              <div className="text-[10px] text-slate-500 font-medium">Session High</div>
              <div className="font-mono font-bold text-slate-700">
                {stats.max ? stats.max.toFixed(decimals) : '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Lightweight SVG Tick Sparkline with Bollinger Deviation Bands */}
        <div className="mt-3 relative">
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
            <span className="font-semibold text-slate-600 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-600" />
              Live Tick Trend & Volatility Deviation
            </span>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-blue-500 inline-block" /> Tick Line
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-0.5 border-t border-dashed border-slate-400 inline-block" /> Mean (SMA)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-0.5 border-t border-dotted border-amber-500 inline-block" /> Bands (±{bot?.settings.deviationMultiplier ?? 2}σ)
              </span>
            </div>
          </div>

          <div className="w-full bg-slate-50/70 border border-slate-200/60 rounded-lg p-2 overflow-hidden">
            {sparklineData ? (
              <svg
                viewBox={`0 0 ${sparklineData.width} ${sparklineData.height}`}
                className="w-full h-28 sm:h-32 overflow-visible"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="tickGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Upper Deviation Band line */}
                <line
                  x1="0"
                  y1={sparklineData.upperY}
                  x2={sparklineData.width}
                  y2={sparklineData.upperY}
                  stroke="#f59e0b"
                  strokeWidth="1.2"
                  strokeDasharray="4 4"
                  opacity="0.8"
                />

                {/* Mean line */}
                <line
                  x1="0"
                  y1={sparklineData.meanY}
                  x2={sparklineData.width}
                  y2={sparklineData.meanY}
                  stroke="#94a3b8"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  opacity="0.7"
                />

                {/* Lower Deviation Band line */}
                <line
                  x1="0"
                  y1={sparklineData.lowerY}
                  x2={sparklineData.width}
                  y2={sparklineData.lowerY}
                  stroke="#f59e0b"
                  strokeWidth="1.2"
                  strokeDasharray="4 4"
                  opacity="0.8"
                />

                {/* Tick polyline */}
                <polyline
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={sparklineData.pointsString}
                />

                {/* Glowing current price spot dot */}
                {sparklineData.lastCoord && (
                  <g>
                    <circle
                      cx={sparklineData.lastCoord.x}
                      cy={sparklineData.lastCoord.y}
                      r="6"
                      className="fill-blue-500/30 animate-ping"
                    />
                    <circle
                      cx={sparklineData.lastCoord.x}
                      cy={sparklineData.lastCoord.y}
                      r="4"
                      className="fill-blue-600 stroke-white stroke-2"
                    />
                  </g>
                )}
              </svg>
            ) : (
              <div className="h-28 sm:h-32 flex items-center justify-center text-xs text-slate-400">
                Awaiting market tick stream...
              </div>
            )}
          </div>
        </div>

        {/* Live Volatility Breakout Deviation Metric Status Bar */}
        <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* Deviation Z-Score */}
          <div className="bg-slate-50 border border-slate-200/70 rounded-lg p-2.5 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-slate-500">Price Deviation (Z-Score)</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span
                className={`text-lg font-bold font-mono ${
                  isBreakoutUp
                    ? 'text-emerald-600'
                    : isBreakoutDown
                    ? 'text-rose-600'
                    : 'text-slate-800'
                }`}
              >
                {stats.zScore >= 0 ? '+' : ''}
                {stats.zScore.toFixed(2)}σ
              </span>
              <span className="text-[11px] text-slate-400">
                (±{(bot?.settings.deviationMultiplier ?? 2.0).toFixed(1)}σ band)
              </span>
            </div>
          </div>

          {/* Deviation Status Alert Badge */}
          <div className="bg-slate-50 border border-slate-200/70 rounded-lg p-2.5 flex flex-col justify-between sm:col-span-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500">Volatility Breakout Status</span>
              {bot?.settings.strategy === 'volatility_breakout' && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                  Bot Active Strategy
                </span>
              )}
            </div>
            <div className="mt-1">
              {isBreakoutUp ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>🚀 Bullish Deviation Breakout (Rise Signal)</span>
                </div>
              ) : isBreakoutDown ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>🔻 Bearish Deviation Breakout (Fall Signal)</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-200/80 text-slate-700">
                  <Activity className="w-3.5 h-3.5 text-slate-500" />
                  <span>⚖️ Price Within Normal Volatility Range</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI Model Win-Rate Signal Bar (if AI is active) */}
        {bot?.aiSignal && (
          <div className="mt-3 p-2.5 bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200/80 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-violet-600" />
              <div>
                <span className="text-xs font-bold text-violet-900">
                  AI Model Recommendation:{' '}
                  <span className={bot.aiSignal.recommendation === 'CALL' ? 'text-emerald-700' : 'text-rose-700'}>
                    {bot.aiSignal.recommendation === 'CALL' ? 'RISE ↗' : 'FALL ↘'}
                  </span>
                </span>
                <span className="text-[11px] text-violet-600 ml-2">
                  Confidence: {bot.aiSignal.confidence}% ({bot.aiSignal.marketRegime})
                </span>
              </div>
            </div>

            <div className="text-[10px] text-violet-500 font-mono">
              gemini-3.8-flash
            </div>
          </div>
        )}

        {/* Bot Quick Status Indicator */}
        {bot && (
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  bot.isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`}
              />
              <span className="font-semibold text-slate-700">
                Bot Status: {bot.isRunning ? 'Running' : 'Stopped'}
              </span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-500">
                Win Rate: <strong className="text-slate-800">{bot.winRate}%</strong>
              </span>
            </div>

            <div className="font-mono">
              <span className="text-slate-500">P/L: </span>
              <span
                className={`font-bold ${
                  bot.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {bot.netProfit >= 0 ? '+' : ''}${bot.netProfit.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
