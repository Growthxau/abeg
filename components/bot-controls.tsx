'use client';

import {
  Play,
  Square,
  TrendingUp,
  ShieldAlert,
  Activity,
  DollarSign,
  Award,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
}: BotControlsProps) {
  const {
    isRunning,
    botStatus,
    statusMessage,
    currentStake,
    settings,
    totalRuns,
    wonRuns,
    lostRuns,
    winRate,
    consecutiveLosses,
    netProfit,
    startBot,
    stopBot,
  } = bot;

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
          TARGET REACHED
        </span>
      );
    }
    if (botStatus === 'stopped_stop_loss') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
          STOP LOSS HIT
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
    <div className="w-full space-y-4 pb-20">
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

      {/* Console Log Card */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 text-slate-100 p-4 shadow-sm space-y-2.5 font-mono">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Console Log</span>
          </div>
          <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
            Live
          </span>
        </div>
        <div className="text-xs text-slate-300 leading-relaxed py-1">
          {statusMessage}
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
            <span className="text-[11px] font-medium uppercase tracking-wider">Stake</span>
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
    </div>
  );
}
