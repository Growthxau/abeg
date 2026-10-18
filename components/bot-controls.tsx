'use client';

import { useState, useEffect } from 'react';
import {
  Play,
  Square,
  TrendingUp,
  ShieldAlert,
  Activity,
  DollarSign,
  Award,
  Zap,
  Plus,
  Minus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { UseAutoTradingBotReturn } from '@/hooks/use-auto-trading-bot';
import type { DerivWS, ActiveSymbol, ProposalInfo } from '@deriv/core';
import type { Direction, DurationSelectUnit, DurationOption } from '@/lib/types';

export interface BotControlsProps {
  bot: UseAutoTradingBotReturn;
  isConnected: boolean;
  activeSymbol: ActiveSymbol | null;
  direction: Direction;
  onDirectionChange: (dir: Direction) => void;
  allowEquals: boolean;
  onAllowEqualsChange: (val: boolean) => void;
  duration: number;
  onDurationChange: (val: number) => void;
  durationOptions: DurationOption[];
  durationUnit: DurationSelectUnit;
  onDurationUnitChange: (unit: DurationSelectUnit) => void;
  endDate: Date | undefined;
  onEndDateChange: (date: Date | undefined) => void;
  endTime: string;
  onEndTimeChange: (time: string) => void;
  ws: DerivWS | null;
  proposal: ProposalInfo | null;
  isAuthenticated?: boolean;
}

export function BotControls({
  bot,
  isConnected,
  activeSymbol,
}: BotControlsProps) {
  const {
    isRunning,
    botStatus,
    statusMessage,
    settings,
    updateSettings,
    currentStake,
    totalRuns,
    wonRuns,
    lostRuns,
    winRate,
    consecutiveLosses,
    netProfit,
    startBot,
    stopBot,
  } = bot;

  // Local input state for smooth typing
  const [baseStakeInput, setBaseStakeInput] = useState(settings.baseStake.toString());
  const [takeProfitInput, setTakeProfitInput] = useState(settings.takeProfit.toString());
  const [stopLossInput, setStopLossInput] = useState(settings.stopLoss.toString());

  useEffect(() => {
    setBaseStakeInput(settings.baseStake.toString());
    setTakeProfitInput(settings.takeProfit.toString());
    setStopLossInput(settings.stopLoss.toString());
  }, [settings.baseStake, settings.takeProfit, settings.stopLoss]);

  const commitBaseStake = (val: number) => {
    const clamped = Math.max(0.35, parseFloat(val.toFixed(2)));
    setBaseStakeInput(clamped.toString());
    updateSettings({ baseStake: clamped });
  };

  const stepStake = (delta: number) => {
    const current = parseFloat(baseStakeInput) || settings.baseStake || 10;
    commitBaseStake(current + delta);
  };

  const handleBaseStakeBlur = () => {
    const val = parseFloat(baseStakeInput);
    if (!isNaN(val) && val >= 0.35) {
      commitBaseStake(val);
    } else {
      setBaseStakeInput(settings.baseStake.toString());
    }
  };

  const commitTakeProfit = (val: number) => {
    const clamped = Math.max(0, parseFloat(val.toFixed(2)));
    setTakeProfitInput(clamped.toString());
    updateSettings({ takeProfit: clamped });
  };

  const stepTakeProfit = (delta: number) => {
    const current = parseFloat(takeProfitInput) || settings.takeProfit || 0;
    commitTakeProfit(Math.max(0, current + delta));
  };

  const handleTakeProfitBlur = () => {
    const val = parseFloat(takeProfitInput);
    if (!isNaN(val) && val >= 0) {
      commitTakeProfit(val);
    } else {
      setTakeProfitInput(settings.takeProfit.toString());
    }
  };

  const commitStopLoss = (val: number) => {
    const clamped = Math.max(0, parseFloat(val.toFixed(2)));
    setStopLossInput(clamped.toString());
    updateSettings({ stopLoss: clamped });
  };

  const stepStopLoss = (delta: number) => {
    const current = parseFloat(stopLossInput) || settings.stopLoss || 0;
    commitStopLoss(Math.max(0, current + delta));
  };

  const handleStopLossBlur = () => {
    const val = parseFloat(stopLossInput);
    if (!isNaN(val) && val >= 0) {
      commitStopLoss(val);
    } else {
      setStopLossInput(settings.stopLoss.toString());
    }
  };

  const getStatusBadge = () => {
    if (isRunning) {
      if (botStatus === 'contract_running') {
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            IN TRADE
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          BOT RUNNING
        </span>
      );
    }

    if (botStatus === 'stopped_take_profit') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
          🎯 TARGET REACHED
        </span>
      );
    }
    if (botStatus === 'stopped_stop_loss') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
          ⚠️ STOP LOSS HIT
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
        <span className="w-2 h-2 rounded-full bg-slate-400" />
        BOT STOPPED
      </span>
    );
  };

  return (
    <div className="w-full space-y-4">
      {/* Bot Master Card: Single Start/Stop Control & Market Info */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm leading-tight flex items-center gap-1.5">
                <span>Volatility 100 (1s) Index</span>
              </h3>
              <p className="text-xs text-slate-500">
                Automated Bot • Multiplier 1.5x
              </p>
            </div>
          </div>
          <div>{getStatusBadge()}</div>
        </div>

        {/* Live Narrative Status Bar */}
        <div className="text-xs text-slate-700 bg-slate-50/90 border border-slate-200/80 rounded-lg p-2.5 flex items-start gap-2">
          <Activity className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
          <span className="font-mono leading-relaxed">{statusMessage}</span>
        </div>

        {/* The Master Single Start / Stop Button */}
        <div>
          {isRunning ? (
            <Button
              type="button"
              onClick={stopBot}
              size="lg"
              className="w-full h-12 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-base shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>STOP BOT</span>
            </Button>
          ) : (
            <Button
              type="button"
              onClick={startBot}
              disabled={!isConnected}
              size="lg"
              className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>START AUTO BOT</span>
            </Button>
          )}
        </div>
      </div>

      {/* Live Session Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Net Profit</span>
            <DollarSign className="w-3.5 h-3.5" />
          </div>
          <div
            className={cn(
              'text-lg font-bold tracking-tight',
              netProfit > 0
                ? 'text-emerald-600'
                : netProfit < 0
                ? 'text-rose-600'
                : 'text-slate-800'
            )}
          >
            {netProfit >= 0 ? `+$${netProfit.toFixed(2)}` : `-$${Math.abs(netProfit).toFixed(2)}`}
          </div>
          <span className="text-[10px] text-slate-500">Session P/L</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Win Rate</span>
            <Award className="w-3.5 h-3.5" />
          </div>
          <div className="text-lg font-bold text-slate-900 tracking-tight">
            {winRate}%
          </div>
          <span className="text-[10px] text-slate-500">
            {wonRuns}W / {lostRuns}L ({totalRuns} runs)
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Next Stake</span>
            <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-lg font-bold text-slate-900 tracking-tight font-mono">
            ${currentStake.toFixed(2)}
          </div>
          <span className="text-[10px] text-slate-500">
            Base: ${settings.baseStake}
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Loss Streak</span>
            <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div
            className={cn(
              'text-lg font-bold tracking-tight',
              consecutiveLosses > 0 ? 'text-amber-600' : 'text-slate-900'
            )}
          >
            {consecutiveLosses}{' '}
            <span className="text-xs font-normal text-slate-500">
              / {settings.maxConsecutiveLosses || '∞'}
            </span>
          </div>
          <span className="text-[10px] text-slate-500">Consecutive</span>
        </div>
      </div>

      {/* Risk Management & Stake Setup Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <ShieldAlert className="w-4 h-4 text-emerald-600" />
          <h4 className="font-bold text-slate-900 text-sm">Risk Management & Stake Setup</h4>
        </div>

        <div className="space-y-3.5">
          {/* Base Stake */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-slate-700">
                Base Stake (USD)
              </Label>
              <span className="text-[11px] text-slate-500 font-mono">
                Min: $0.35
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={isRunning}
                onClick={() => stepStake(-1)}
                className="h-10 w-10 shrink-0 border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </Button>
              <Input
                type="text"
                inputMode="decimal"
                disabled={isRunning}
                value={baseStakeInput}
                onChange={(e) => setBaseStakeInput(e.target.value)}
                onBlur={handleBaseStakeBlur}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleBaseStakeBlur();
                }}
                className="h-10 bg-slate-50 border-slate-200 text-sm font-mono text-center"
                placeholder="10"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={isRunning}
                onClick={() => stepStake(1)}
                className="h-10 w-10 shrink-0 border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
            {/* Quick Stake Chips */}
            <div className="flex items-center gap-1 pt-1 flex-wrap">
              {[1, 5, 10, 25, 50, 100].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  disabled={isRunning}
                  onClick={() => commitBaseStake(amt)}
                  className={cn(
                    'px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors cursor-pointer border',
                    Math.abs(parseFloat(baseStakeInput) - amt) < 0.01
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  )}
                >
                  ${amt}
                </button>
              ))}
            </div>
          </div>

          {/* Profit Target */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-slate-700">
                Profit Target (USD)
              </Label>
              <span className="text-[11px] text-emerald-600 font-medium">
                Auto-stop on goal
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={isRunning}
                onClick={() => stepTakeProfit(-5)}
                className="h-10 w-10 shrink-0 border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </Button>
              <Input
                type="text"
                inputMode="decimal"
                disabled={isRunning}
                value={takeProfitInput}
                onChange={(e) => setTakeProfitInput(e.target.value)}
                onBlur={handleTakeProfitBlur}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTakeProfitBlur();
                }}
                className="h-10 bg-slate-50 border-slate-200 text-sm font-mono text-center font-bold text-emerald-700"
                placeholder="50"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={isRunning}
                onClick={() => stepTakeProfit(5)}
                className="h-10 w-10 shrink-0 border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Loss Target */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-slate-700">
                Loss Target / Stop Loss (USD)
              </Label>
              <span className="text-[11px] text-rose-600 font-medium">
                Auto-stop to preserve capital
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={isRunning}
                onClick={() => stepStopLoss(-5)}
                className="h-10 w-10 shrink-0 border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </Button>
              <Input
                type="text"
                inputMode="decimal"
                disabled={isRunning}
                value={stopLossInput}
                onChange={(e) => setStopLossInput(e.target.value)}
                onBlur={handleStopLossBlur}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleStopLossBlur();
                }}
                className="h-10 bg-slate-50 border-slate-200 text-sm font-mono text-center font-bold text-rose-700"
                placeholder="50"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={isRunning}
                onClick={() => stepStopLoss(5)}
                className="h-10 w-10 shrink-0 border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
