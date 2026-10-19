'use client';

import {
  Play,
  Square,
  Activity,
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
  activeAccount?: any | null;
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
  activeAccount,
}: BotControlsProps) {
  const {
    isRunning,
    botStatus,
    statusMessage,
    wonRuns,
    lostRuns,
    winRate,
    netProfit,
    startBot,
    stopBot,
  } = bot;

  const getStatusBadge = () => {
    if (isRunning) {
      if (botStatus === 'contract_running') {
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            IN TRADE
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-400/20 text-yellow-400 border border-yellow-400/30">
          <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          BOT RUNNING
        </span>
      );
    }

    if (botStatus === 'stopped_take_profit') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          TARGET REACHED
        </span>
      );
    }
    if (botStatus === 'stopped_stop_loss') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">
          STOP LOSS HIT
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
        <span className="w-2 h-2 rounded-full bg-zinc-500" />
        BOT STOPPED
      </span>
    );
  };

  return (
    <div className="w-full space-y-3 pb-0">
      {/* Prominent Bright Yellow Account Summary Card */}
      <div className="mx-3 rounded-2xl bg-yellow-400 text-zinc-950 p-4 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">
            {activeAccount ? (activeAccount.account_type === 'demo' ? 'Demo Account' : 'Real Account') : 'Account Summary'}
          </span>
          <span className="text-[10px] font-mono font-bold bg-zinc-950/15 px-2 py-0.5 rounded-full">
            Volatility 100 Index
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-[10px] font-medium opacity-75 uppercase tracking-wider">Balance</p>
            <h2 className="text-2xl font-black font-mono tracking-tight">
              ${activeAccount ? Number(activeAccount.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '10,000.00'}
            </h2>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-medium opacity-75 uppercase tracking-wider">Session P/L</p>
            <p className={cn('text-lg font-extrabold font-mono tracking-tight', netProfit >= 0 ? 'text-zinc-950' : 'text-red-950')}>
              {netProfit >= 0 ? `+$${netProfit.toFixed(2)}` : `-$${Math.abs(netProfit).toFixed(2)}`}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-950/15 text-center">
          <div className="bg-zinc-950/10 rounded-xl p-1.5">
            <span className="block text-[10px] font-medium opacity-75">Wins (W)</span>
            <span className="text-sm font-extrabold font-mono">{wonRuns}</span>
          </div>
          <div className="bg-zinc-950/10 rounded-xl p-1.5">
            <span className="block text-[10px] font-medium opacity-75">Losses (L)</span>
            <span className="text-sm font-extrabold font-mono">{lostRuns}</span>
          </div>
          <div className="bg-zinc-950/10 rounded-xl p-1.5">
            <span className="block text-[10px] font-medium opacity-75">Win Rate</span>
            <span className="text-sm font-extrabold font-mono">{winRate}%</span>
          </div>
        </div>
      </div>

      {/* Volatility 100 Index Trading Card & Bot Status & Start/Stop Button */}
      <div className="mx-3 rounded-2xl border border-zinc-800 bg-[#1E1E22] p-4 shadow-md space-y-3.5 text-zinc-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-100 text-sm leading-tight flex items-center gap-1.5">
                <span>Volatility 100 Index</span>
              </h3>
              <p className="text-xs text-zinc-400">
                MACD (5, 13, 4) + EMA 20 • 5 Ticks
              </p>
            </div>
          </div>
          <div>{getStatusBadge()}</div>
        </div>

        {/* The Master Bright Yellow Start / Stop Button */}
        <div>
          {isRunning ? (
            <Button
              type="button"
              onClick={stopBot}
              size="lg"
              className="w-full h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-base shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
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
              className="w-full h-12 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-zinc-950 font-black text-base shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>START AUTO BOT</span>
            </Button>
          )}
        </div>
      </div>

      {/* Console Log Card - Full Width Edge-to-Edge Joining Navbar */}
      <div className="w-full rounded-none border-x-0 border-b-0 border-t border-zinc-800 bg-black text-zinc-100 p-4 shadow-none h-[220px] flex flex-col font-mono m-0">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-yellow-400 animate-pulse" />
            <span className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">Console Log</span>
          </div>
          <span className="text-[10px] text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded border border-yellow-400/30">
            Live
          </span>
        </div>
        <div className="flex-1 overflow-y-auto text-xs text-zinc-300 leading-relaxed py-2 space-y-1">
          <div className="text-yellow-400 font-semibold mb-1">{statusMessage}</div>
          {bot.logs.map((log) => {
            const text = log.details || '';
            const colorClass =
              log.status === 'WON' || text.includes('WIN') || text.includes('BULLISH') || text.includes('CONNECTED') || text.includes('Profit')
                ? 'text-emerald-400 font-bold'
                : log.status === 'LOST' || text.includes('LOSS') || text.includes('BEARISH') || text.includes('DISCONNECTED')
                ? 'text-rose-400 font-bold'
                : log.status === 'ERROR'
                ? 'text-amber-400 font-bold'
                : text.includes('Signal') || text.includes('Entry') || text.includes('Trade') || text.includes('Strategy')
                ? 'text-yellow-400 font-semibold'
                : text.includes('Session P/L')
                ? 'text-cyan-300 font-bold'
                : text.includes('Market') || text.includes('Analysis') || text.includes('Risk Manager')
                ? 'text-blue-400 font-medium'
                : 'text-zinc-300';
            return (
              <div key={log.id} className={cn('border-b border-zinc-900/80 pb-1 font-mono text-[11px]', colorClass)}>
                {text}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
