'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Play,
  Square,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  ShieldAlert,
  Sliders,
  History,
  Activity,
  DollarSign,
  Award,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EndTimePicker } from '@/components/custom/end-time-picker';
import { cn } from '@/lib/utils';
import type {
  UseAutoTradingBotReturn,
  BotStrategy,
  MoneyManagement,
} from '@/hooks/use-auto-trading-bot';
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
  direction,
  onDirectionChange,
  allowEquals,
  onAllowEqualsChange,
  duration,
  onDurationChange,
  durationOptions,
  durationUnit,
  onDurationUnitChange,
  endDate,
  onEndDateChange,
  endTime,
  onEndTimeChange,
  ws,
  proposal,
  isAuthenticated,
}: BotControlsProps) {
  const [activeTab, setActiveTab] = useState<'strategy' | 'risk' | 'logs'>('strategy');

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
    logs,
    startBot,
    stopBot,
    resetStats,
    clearLogs,
  } = bot;

  const activeDurationOption = durationOptions.find((o) => o.unit === durationUnit);

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
      {/* Bot Header Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm leading-tight">
                Auto Trading Bot
              </h3>
              <p className="text-xs text-slate-500">
                Deriv Automated Rise / Fall Engine
              </p>
            </div>
          </div>
          <div>{getStatusBadge()}</div>
        </div>

        {/* Live Narrative Status Line */}
        <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200/60 rounded-lg p-2.5 flex items-start gap-2">
          <Activity className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
          <span className="font-mono leading-relaxed">{statusMessage}</span>
        </div>

        {/* Primary Start / Stop Button - NO MANUAL BUY BUTTON */}
        <div className="pt-1">
          {isRunning ? (
            <Button
              type="button"
              onClick={stopBot}
              size="lg"
              className="w-full h-13 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-base shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <Square className="w-5 h-5 fill-current" />
              <span>STOP BOT</span>
            </Button>
          ) : (
            <Button
              type="button"
              onClick={startBot}
              disabled={!isConnected}
              size="lg"
              className="w-full h-13 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-base shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>START AUTO BOT</span>
            </Button>
          )}
        </div>
      </div>

      {/* Live Session Analytics Cards */}
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
            {wonRuns}W / {lostRuns}L ({totalRuns} total)
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Current Stake</span>
            <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-lg font-bold text-slate-900 tracking-tight">
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

      {/* Tabs for Configuration & Logs */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="flex border-b border-slate-200 bg-slate-50/70 p-1 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('strategy')}
            className={cn(
              'flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5',
              activeTab === 'strategy'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Strategy & Stake</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('risk')}
            className={cn(
              'flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5',
              activeTab === 'risk'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Risk Controls</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={cn(
              'flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5',
              activeTab === 'logs'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            <History className="w-3.5 h-3.5" />
            <span>Bot Logs ({logs.length})</span>
          </button>
        </div>

        <div className="p-4 space-y-4">
          {activeTab === 'strategy' && (
            <div className="space-y-4">
              {/* Trading Strategy Selection */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">
                  Trading Strategy
                </Label>
                <Select
                  disabled={isRunning}
                  value={settings.strategy}
                  onValueChange={(v) => updateSettings({ strategy: v as BotStrategy })}
                >
                  <SelectTrigger className="h-10 bg-slate-50 border-slate-200 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trend_following">
                      📈 Trend Following (Follow tick momentum)
                    </SelectItem>
                    <SelectItem value="contrarian">
                      🔄 Contrarian (Trade market reversals)
                    </SelectItem>
                    <SelectItem value="alternating">
                      ⚡ Alternating (Rise ⇄ Fall every trade)
                    </SelectItem>
                    <SelectItem value="fixed_rise">
                      🟢 Fixed Rise (Always Buy Rise / CALL)
                    </SelectItem>
                    <SelectItem value="fixed_fall">
                      🔴 Fixed Fall (Always Buy Fall / PUT)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-slate-500">
                  {settings.strategy === 'trend_following' &&
                    'Bot evaluates recent tick movement to buy with the prevailing trend.'}
                  {settings.strategy === 'contrarian' &&
                    'Bot identifies short-term tick spikes to enter contrarian reversals.'}
                  {settings.strategy === 'alternating' &&
                    'Bot alternates between Rise and Fall on each consecutive run.'}
                  {settings.strategy === 'fixed_rise' &&
                    'Bot executes exclusively Rise contracts for every signal.'}
                  {settings.strategy === 'fixed_fall' &&
                    'Bot executes exclusively Fall contracts for every signal.'}
                </p>
              </div>

              {/* Money Management */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
                    Money Management
                  </Label>
                  <Select
                    disabled={isRunning}
                    value={settings.moneyManagement}
                    onValueChange={(v) =>
                      updateSettings({ moneyManagement: v as MoneyManagement })
                    }
                  >
                    <SelectTrigger className="h-10 bg-slate-50 border-slate-200 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="martingale">Martingale (Multiply on Loss)</SelectItem>
                      <SelectItem value="fixed">Fixed Stake (Flat Amount)</SelectItem>
                      <SelectItem value="dalembert">D&apos;Alembert (Step Adjust)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
                    Base Stake (USD)
                  </Label>
                  <Input
                    type="number"
                    disabled={isRunning}
                    min={0.35}
                    step="1"
                    value={settings.baseStake}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val) && val > 0) updateSettings({ baseStake: val });
                    }}
                    className="h-10 bg-slate-50 border-slate-200 text-sm"
                  />
                </div>
              </div>

              {/* Martingale Multiplier when enabled */}
              {settings.moneyManagement === 'martingale' && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-slate-700">
                      Martingale Multiplier
                    </Label>
                    <span className="text-xs font-semibold text-emerald-700">
                      {settings.martingaleMultiplier}x
                    </span>
                  </div>
                  <Select
                    disabled={isRunning}
                    value={settings.martingaleMultiplier.toString()}
                    onValueChange={(v) =>
                      updateSettings({ martingaleMultiplier: parseFloat(v) })
                    }
                  >
                    <SelectTrigger className="h-10 bg-slate-50 border-slate-200 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1.5">1.5x (Conservative)</SelectItem>
                      <SelectItem value="2">2.0x (Standard Martingale)</SelectItem>
                      <SelectItem value="2.2">2.2x (High Payout Recovery)</SelectItem>
                      <SelectItem value="2.5">2.5x (Aggressive Recovery)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Duration and Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">Duration Unit</Label>
                  <Select
                    disabled={isRunning}
                    value={durationUnit}
                    onValueChange={(v) => {
                      const opt = durationOptions.find((o) => o.unit === v);
                      if (opt) onDurationUnitChange(opt.unit);
                    }}
                  >
                    <SelectTrigger className="h-10 bg-slate-50 border-slate-200 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {durationOptions.map((opt) => (
                        <SelectItem key={opt.unit} value={opt.unit}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
                    Duration ({durationUnit})
                  </Label>
                  {durationUnit !== 'end-time' && (
                    <Input
                      type="number"
                      disabled={isRunning}
                      value={duration}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val)) onDurationChange(val);
                      }}
                      min={activeDurationOption?.min ?? 1}
                      max={activeDurationOption?.max ?? 365}
                      className="h-10 bg-slate-50 border-slate-200 text-sm"
                    />
                  )}
                </div>
              </div>

              {/* Allow Equals Switch */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                <div>
                  <Label htmlFor="bot-allow-equals" className="text-xs font-medium text-slate-800 block cursor-pointer">
                    Allow Equals
                  </Label>
                  <span className="text-[11px] text-slate-500">
                    Win if exit spot matches entry spot
                  </span>
                </div>
                <Switch
                  id="bot-allow-equals"
                  disabled={isRunning}
                  checked={allowEquals}
                  onCheckedChange={onAllowEqualsChange}
                />
              </div>
            </div>
          )}

          {activeTab === 'risk' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
                    Take Profit (USD)
                  </Label>
                  <Input
                    type="number"
                    disabled={isRunning}
                    min={0}
                    step="5"
                    value={settings.takeProfit}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      updateSettings({ takeProfit: isNaN(val) ? 0 : val });
                    }}
                    className="h-10 bg-slate-50 border-slate-200 text-sm"
                    placeholder="e.g. 50"
                  />
                  <span className="text-[10px] text-slate-500">Auto-stop on +${settings.takeProfit}</span>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
                    Stop Loss Limit (USD)
                  </Label>
                  <Input
                    type="number"
                    disabled={isRunning}
                    min={0}
                    step="5"
                    value={settings.stopLoss}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      updateSettings({ stopLoss: isNaN(val) ? 0 : val });
                    }}
                    className="h-10 bg-slate-50 border-slate-200 text-sm"
                    placeholder="e.g. 50"
                  />
                  <span className="text-[10px] text-slate-500">Auto-stop on -${settings.stopLoss}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
                    Max Consecutive Losses
                  </Label>
                  <Input
                    type="number"
                    disabled={isRunning}
                    min={1}
                    max={20}
                    value={settings.maxConsecutiveLosses}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      updateSettings({ maxConsecutiveLosses: isNaN(val) ? 0 : val });
                    }}
                    className="h-10 bg-slate-50 border-slate-200 text-sm"
                  />
                  <span className="text-[10px] text-slate-500">Safety breaker</span>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
                    Max Runs (Trades)
                  </Label>
                  <Input
                    type="number"
                    disabled={isRunning}
                    min={1}
                    max={500}
                    value={settings.maxRuns}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      updateSettings({ maxRuns: isNaN(val) ? 0 : val });
                    }}
                    className="h-10 bg-slate-50 border-slate-200 text-sm"
                  />
                  <span className="text-[10px] text-slate-500">0 = Unlimited</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">
                  Delay Between Trades (Seconds)
                </Label>
                <Input
                  type="number"
                  disabled={isRunning}
                  min={1}
                  max={10}
                  value={settings.cooldownSeconds}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    updateSettings({ cooldownSeconds: isNaN(val) ? 2 : val });
                  }}
                  className="h-10 bg-slate-50 border-slate-200 text-sm"
                />
                <span className="text-[10px] text-slate-500">
                  Cooldown time before placing the subsequent contract
                </span>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-medium text-slate-700">
                  Live Trade Activity ({logs.length})
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearLogs}
                    className="h-7 px-2 text-[11px] text-slate-500 hover:text-slate-800"
                  >
                    Clear Log
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={resetStats}
                    className="h-7 px-2 text-[11px] text-slate-500 hover:text-slate-800"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Reset Stats
                  </Button>
                </div>
              </div>

              {logs.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                  No automated trades executed in this session yet.
                  <br />
                  Click <span className="font-semibold text-emerald-600">Start Auto Bot</span> to begin.
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="pt-2 first:pt-0 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 font-medium text-slate-800">
                          <span
                            className={cn(
                              'px-1.5 py-0.5 rounded text-[10px] font-bold uppercase',
                              log.direction === 'CALL'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            )}
                          >
                            {log.direction === 'CALL' ? 'Rise' : 'Fall'}
                          </span>
                          <span>${log.stake.toFixed(2)}</span>
                          <span className="text-[10px] text-slate-400">
                            #{log.contractId}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {log.time} • {log.symbol}
                        </div>
                      </div>

                      <div className="text-right">
                        {log.status === 'WON' && (
                          <span className="font-bold text-emerald-600">
                            +${(log.profit ?? 0).toFixed(2)}
                          </span>
                        )}
                        {log.status === 'LOST' && (
                          <span className="font-bold text-rose-600">
                            -${Math.abs(log.profit ?? log.stake).toFixed(2)}
                          </span>
                        )}
                        {log.status === 'PENDING' && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 font-medium animate-pulse">
                            Active...
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reports Navigation */}
      {isAuthenticated && (
        <Button
          asChild
          variant="outline"
          className="w-full h-10 rounded-xl border-slate-200 bg-white text-xs text-slate-600 hover:text-slate-900 shadow-sm"
        >
          <Link href="/reports">
            View full positions history & statement →
          </Link>
        </Button>
      )}
    </div>
  );
}
