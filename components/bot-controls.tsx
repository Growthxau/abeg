'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Play,
  Square,
  TrendingUp,
  RotateCcw,
  ShieldAlert,
  Sliders,
  History,
  Activity,
  DollarSign,
  Award,
  Zap,
  BrainCircuit,
  ExternalLink,
  Sparkles,
  Plus,
  Minus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [activeTab, setActiveTab] = useState<'strategy' | 'volatility' | 'risk' | 'logs'>('strategy');

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
    aiSignal,
    volatilityStats,
    startBot,
    stopBot,
    resetStats,
    clearLogs,
    triggerAiAnalysis,
  } = bot;

  // Local string state for smooth typing without cursor jumping or unwanted resets
  const [baseStakeInput, setBaseStakeInput] = useState(settings.baseStake.toString());
  const [durationInput, setDurationInput] = useState(duration.toString());
  const [takeProfitInput, setTakeProfitInput] = useState(settings.takeProfit.toString());
  const [stopLossInput, setStopLossInput] = useState(settings.stopLoss.toString());
  const [devMultInput, setDevMultInput] = useState((settings.deviationMultiplier || 2.0).toString());
  const [devPeriodInput, setDevPeriodInput] = useState((settings.deviationPeriod || 15).toString());
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Sync inputs when settings change externally
  useEffect(() => {
    setBaseStakeInput(settings.baseStake.toString());
    setTakeProfitInput(settings.takeProfit.toString());
    setStopLossInput(settings.stopLoss.toString());
    setDevMultInput((settings.deviationMultiplier || 2.0).toString());
    setDevPeriodInput((settings.deviationPeriod || 15).toString());
  }, [settings.baseStake, settings.takeProfit, settings.stopLoss, settings.deviationMultiplier, settings.deviationPeriod]);

  useEffect(() => {
    setDurationInput(duration.toString());
  }, [duration]);

  const activeDurationOption = durationOptions.find((o) => o.unit === durationUnit);

  // Input handlers with stepper buttons
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

  const commitDuration = (val: number) => {
    const min = activeDurationOption?.min ?? 1;
    const max = activeDurationOption?.max ?? 365;
    const clamped = Math.max(min, Math.min(max, Math.round(val)));
    setDurationInput(clamped.toString());
    onDurationChange(clamped);
  };

  const stepDuration = (delta: number) => {
    const current = parseInt(durationInput, 10) || duration || 1;
    commitDuration(current + delta);
  };

  const handleDurationBlur = () => {
    const val = parseInt(durationInput, 10);
    const min = activeDurationOption?.min ?? 1;
    const max = activeDurationOption?.max ?? 365;
    if (!isNaN(val) && val >= min && val <= max) {
      commitDuration(val);
    } else {
      setDurationInput(duration.toString());
    }
  };

  const commitDevMultiplier = (val: number) => {
    const clamped = Math.max(0.5, Math.min(5.0, parseFloat(val.toFixed(1))));
    setDevMultInput(clamped.toString());
    updateSettings({ deviationMultiplier: clamped });
  };

  const stepDevMultiplier = (delta: number) => {
    const current = parseFloat(devMultInput) || settings.deviationMultiplier || 2.0;
    commitDevMultiplier(current + delta);
  };

  const handleDevMultiplierBlur = () => {
    const val = parseFloat(devMultInput);
    if (!isNaN(val) && val >= 0.5) {
      commitDevMultiplier(val);
    } else {
      setDevMultInput((settings.deviationMultiplier || 2.0).toString());
    }
  };

  const commitDevPeriod = (val: number) => {
    const clamped = Math.max(5, Math.min(100, Math.round(val)));
    setDevPeriodInput(clamped.toString());
    updateSettings({ deviationPeriod: clamped });
  };

  const stepDevPeriod = (delta: number) => {
    const current = parseInt(devPeriodInput, 10) || settings.deviationPeriod || 15;
    commitDevPeriod(current + delta);
  };

  const handleDevPeriodBlur = () => {
    const val = parseInt(devPeriodInput, 10);
    if (!isNaN(val) && val >= 5) {
      commitDevPeriod(val);
    } else {
      setDevPeriodInput((settings.deviationPeriod || 15).toString());
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

  const commitStopLoss = (val: number) => {
    const clamped = Math.max(0, parseFloat(val.toFixed(2)));
    setStopLossInput(clamped.toString());
    updateSettings({ stopLoss: clamped });
  };

  const stepStopLoss = (delta: number) => {
    const current = parseFloat(stopLossInput) || settings.stopLoss || 0;
    commitStopLoss(Math.max(0, current + delta));
  };

  const handleManualAiCheck = async () => {
    setIsAiLoading(true);
    await triggerAiAnalysis();
    setIsAiLoading(false);
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
      {/* Bot Master Card: Single Start/Stop Control */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm leading-tight flex items-center gap-1.5 flex-wrap">
                <span>Auto Trading Bot</span>
                {settings.strategy === 'ai_gemini' && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-50 text-purple-700 border border-purple-200 font-semibold flex items-center gap-1">
                    <BrainCircuit className="w-3 h-3" />
                    AI Gemini 3.8
                  </span>
                )}
                {settings.strategy === 'volatility_breakout' && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-50 text-blue-700 border border-blue-200 font-semibold flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Breakout Dev {settings.deviationMultiplier}σ
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500">
                Single Control • Deriv WebSocket Engine
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

      {/* AI Market Signal Banner if AI is active */}
      {aiSignal && (
        <div className="rounded-xl border border-purple-200 bg-purple-50/70 p-3.5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-purple-900 font-semibold text-xs">
              <BrainCircuit className="w-4 h-4 text-purple-700" />
              <span>Gemini AI Intelligence Signal</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                Confidence: {aiSignal.confidence}%
              </span>
              <span
                className={cn(
                  'text-[11px] font-bold px-2 py-0.5 rounded-full uppercase',
                  aiSignal.recommendation === 'CALL'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                )}
              >
                Signal: {aiSignal.recommendation === 'CALL' ? 'Rise' : 'Fall'}
              </span>
            </div>
          </div>
          <p className="text-xs text-purple-950 font-medium leading-relaxed">
            {aiSignal.reasoning}
          </p>
          <div className="flex items-center justify-between text-[11px] text-purple-700 pt-1 border-t border-purple-200/60">
            <span>Regime: {aiSignal.marketRegime}</span>
            <span>Deviation: {aiSignal.volatilityDeviation >= 0 ? `+${aiSignal.volatilityDeviation}` : aiSignal.volatilityDeviation}σ</span>
          </div>
        </div>
      )}

      {/* Control Tabs */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="flex border-b border-slate-200 bg-slate-50/70 p-1 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('strategy')}
            className={cn(
              'flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer',
              activeTab === 'strategy'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Strategy</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('volatility')}
            className={cn(
              'flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer',
              activeTab === 'volatility'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Volatility Dev</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('risk')}
            className={cn(
              'flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer',
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
              'flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer',
              activeTab === 'logs'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            <History className="w-3.5 h-3.5" />
            <span>Logs ({logs.length})</span>
          </button>
        </div>

        <div className="p-4 space-y-4">
          {activeTab === 'strategy' && (
            <div className="space-y-4">
              {/* Trading Strategy Selector */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">
                  Trading Strategy Engine
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
                    <SelectItem value="ai_gemini">
                      🧠 AI Gemini 3.8 Neural Model (High Probability)
                    </SelectItem>
                    <SelectItem value="volatility_breakout">
                      📊 Volatility Breakout Deviation (k·σ Bands)
                    </SelectItem>
                    <SelectItem value="trend_following">
                      📈 Trend Following (Tick Momentum)
                    </SelectItem>
                    <SelectItem value="contrarian">
                      🔄 Contrarian (Reversal Spikes)
                    </SelectItem>
                    <SelectItem value="alternating">
                      ⚡ Alternating (Rise ⇄ Fall Sequence)
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
                  {settings.strategy === 'ai_gemini' &&
                    'Uses server-side Gemini 3.8 Flash model to analyze micro-trends and volatility deviation for higher win rates.'}
                  {settings.strategy === 'volatility_breakout' &&
                    'Calculates standard deviation channels and fires trades on volatility band expansion breakouts.'}
                  {settings.strategy === 'trend_following' &&
                    'Enters contracts aligning with the most recent tick impulse direction.'}
                  {settings.strategy === 'contrarian' &&
                    'Fades extended tick moves looking for rapid mean reversion.'}
                  {settings.strategy === 'alternating' &&
                    'Cycles strictly between Rise and Fall on each consecutive execution.'}
                  {settings.strategy === 'fixed_rise' &&
                    'Focuses exclusively on Rise contracts.'}
                  {settings.strategy === 'fixed_fall' &&
                    'Focuses exclusively on Fall contracts.'}
                </p>
              </div>

              {/* AI Quick Analysis Button */}
              {settings.strategy === 'ai_gemini' && (
                <div className="flex items-center justify-between p-3 rounded-lg border border-purple-200 bg-purple-50/60">
                  <div>
                    <div className="text-xs text-purple-900 font-semibold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      <span>Test AI Model on Current Ticks</span>
                    </div>
                    <p className="text-[11px] text-purple-700">
                      Evaluates price velocity and standard deviation.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isAiLoading}
                    onClick={handleManualAiCheck}
                    className="h-8 border-purple-300 text-purple-800 text-xs hover:bg-purple-100 bg-white cursor-pointer"
                  >
                    {isAiLoading ? 'Analyzing...' : 'Fetch AI Signal'}
                  </Button>
                </div>
              )}

              {/* Stake and Money Management */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                {/* Base Stake with Steppers and Quick Chips */}
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
                          'px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-colors cursor-pointer border',
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
              </div>

              {/* Martingale Multiplier */}
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
                      <SelectItem value="1.5">1.5x (Gentle Recovery)</SelectItem>
                      <SelectItem value="2">2.0x (Standard Martingale)</SelectItem>
                      <SelectItem value="2.2">2.2x (High Payout Recovery)</SelectItem>
                      <SelectItem value="2.5">2.5x (Aggressive Recovery)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Duration with Steppers and Quick Chips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    <>
                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          disabled={isRunning}
                          onClick={() => stepDuration(-1)}
                          className="h-10 w-10 shrink-0 border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </Button>
                        <Input
                          type="text"
                          inputMode="numeric"
                          disabled={isRunning}
                          value={durationInput}
                          onChange={(e) => setDurationInput(e.target.value)}
                          onBlur={handleDurationBlur}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleDurationBlur();
                          }}
                          className="h-10 bg-slate-50 border-slate-200 text-sm font-mono text-center"
                          placeholder="1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          disabled={isRunning}
                          onClick={() => stepDuration(1)}
                          className="h-10 w-10 shrink-0 border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      {durationUnit === 't' && (
                        <div className="flex items-center gap-1 pt-1">
                          {[1, 2, 3, 5, 10].map((t) => (
                            <button
                              key={t}
                              type="button"
                              disabled={isRunning}
                              onClick={() => commitDuration(t)}
                              className={cn(
                                'px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-colors cursor-pointer border',
                                parseInt(durationInput, 10) === t
                                  ? 'bg-blue-50 text-blue-800 border-blue-300 font-bold'
                                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                              )}
                            >
                              {t}t
                            </button>
                          ))}
                        </div>
                      )}
                    </>
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
                    Win contract if exit spot equals entry spot
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

          {activeTab === 'volatility' && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg border border-blue-200 bg-blue-50/70 text-xs text-blue-950 leading-relaxed space-y-1">
                <div className="font-semibold flex items-center gap-1.5 text-blue-900">
                  <TrendingUp className="w-4 h-4 text-blue-700" />
                  <span>Volatility Breakout Deviation Strategy</span>
                </div>
                <p>
                  Calculates real-time standard deviation (<span className="font-mono">σ</span>) envelopes around the rolling mean price.
                  When current price breaks above the upper deviation threshold (<span className="font-mono">Mean + k·σ</span>), a bullish breakout (Rise) is triggered.
                  When price breaks below (<span className="font-mono">Mean - k·σ</span>), a bearish breakout (Fall) is triggered.
                </p>
              </div>

              {/* Live Deviation Gauge & Bands */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-semibold text-slate-500">
                      Upper Breakout Band
                    </span>
                    <span className="text-[10px] text-emerald-600 font-bold">
                      +{settings.deviationMultiplier}σ
                    </span>
                  </div>
                  <p className="font-mono text-sm font-bold text-slate-900">
                    {volatilityStats.upperBand > 0 ? volatilityStats.upperBand.toFixed(3) : 'Calculating...'}
                  </p>
                  <span className="text-[10px] text-slate-500">Piercing triggers Rise (CALL)</span>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-semibold text-slate-500">
                      Lower Breakout Band
                    </span>
                    <span className="text-[10px] text-rose-600 font-bold">
                      -{settings.deviationMultiplier}σ
                    </span>
                  </div>
                  <p className="font-mono text-sm font-bold text-slate-900">
                    {volatilityStats.lowerBand > 0 ? volatilityStats.lowerBand.toFixed(3) : 'Calculating...'}
                  </p>
                  <span className="text-[10px] text-slate-500">Piercing triggers Fall (PUT)</span>
                </div>
              </div>

              {/* Current Live Deviation Score */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-800">Current Price Deviation</span>
                  <p className="text-[11px] text-slate-500">Distance from rolling mean in standard deviations</p>
                </div>
                <div className="text-right">
                  <span
                    className={cn(
                      'text-sm font-mono font-bold px-2.5 py-1 rounded-lg border',
                      volatilityStats.devScore >= settings.deviationMultiplier
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : volatilityStats.devScore <= -settings.deviationMultiplier
                        ? 'bg-rose-50 text-rose-700 border-rose-300'
                        : 'bg-white text-slate-700 border-slate-200'
                    )}
                  >
                    {volatilityStats.devScore >= 0 ? `+${volatilityStats.devScore.toFixed(2)}` : volatilityStats.devScore.toFixed(2)}σ
                  </span>
                </div>
              </div>

              {/* Deviation Multiplier with Stepper & Quick Chips */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-slate-700">
                    Deviation Multiplier (k·σ Threshold)
                  </Label>
                  <span className="text-xs font-semibold text-blue-700">
                    {devMultInput}σ
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={isRunning}
                    onClick={() => stepDevMultiplier(-0.1)}
                    className="h-10 w-10 shrink-0 border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </Button>
                  <Input
                    type="text"
                    inputMode="decimal"
                    disabled={isRunning}
                    value={devMultInput}
                    onChange={(e) => setDevMultInput(e.target.value)}
                    onBlur={handleDevMultiplierBlur}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleDevMultiplierBlur();
                    }}
                    placeholder="2.0"
                    className="h-10 bg-slate-50 border-slate-200 font-mono text-sm text-center"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={isRunning}
                    onClick={() => stepDevMultiplier(0.1)}
                    className="h-10 w-10 shrink-0 border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {/* Quick Multiplier Chips */}
                <div className="flex items-center gap-1 pt-1">
                  {[1.5, 1.8, 2.0, 2.2, 2.5].map((mult) => (
                    <button
                      key={mult}
                      type="button"
                      disabled={isRunning}
                      onClick={() => commitDevMultiplier(mult)}
                      className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-colors cursor-pointer border',
                        Math.abs(parseFloat(devMultInput) - mult) < 0.05
                          ? 'bg-blue-50 text-blue-800 border-blue-300 font-bold'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      )}
                    >
                      {mult}σ
                    </button>
                  ))}
                </div>
              </div>

              {/* Lookback Period with Stepper & Quick Chips */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-slate-700">
                    Lookback Period (Ticks)
                  </Label>
                  <span className="text-xs text-slate-500 font-mono">
                    {devPeriodInput} ticks
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={isRunning}
                    onClick={() => stepDevPeriod(-1)}
                    className="h-10 w-10 shrink-0 border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </Button>
                  <Input
                    type="text"
                    inputMode="numeric"
                    disabled={isRunning}
                    value={devPeriodInput}
                    onChange={(e) => setDevPeriodInput(e.target.value)}
                    onBlur={handleDevPeriodBlur}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleDevPeriodBlur();
                    }}
                    placeholder="15"
                    className="h-10 bg-slate-50 border-slate-200 font-mono text-sm text-center"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={isRunning}
                    onClick={() => stepDevPeriod(1)}
                    className="h-10 w-10 shrink-0 border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>

                <div className="flex items-center gap-1 pt-1">
                  {[10, 15, 20, 25, 30].map((p) => (
                    <button
                      key={p}
                      type="button"
                      disabled={isRunning}
                      onClick={() => commitDevPeriod(p)}
                      className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-colors cursor-pointer border',
                        parseInt(devPeriodInput, 10) === p
                          ? 'bg-blue-50 text-blue-800 border-blue-300 font-bold'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      )}
                    >
                      {p} ticks
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'risk' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Take Profit with Stepper */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-slate-700">
                      Take Profit (USD)
                    </Label>
                    <span className="text-[11px] text-emerald-700 font-mono">
                      +${takeProfitInput}
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
                      onBlur={() => {
                        const val = parseFloat(takeProfitInput);
                        commitTakeProfit(isNaN(val) ? 0 : val);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = parseFloat(takeProfitInput);
                          commitTakeProfit(isNaN(val) ? 0 : val);
                        }
                      }}
                      placeholder="50"
                      className="h-10 bg-slate-50 border-slate-200 font-mono text-sm text-center"
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

                  <div className="flex items-center gap-1 pt-1">
                    {[20, 50, 100, 200].map((tp) => (
                      <button
                        key={tp}
                        type="button"
                        disabled={isRunning}
                        onClick={() => commitTakeProfit(tp)}
                        className={cn(
                          'px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-colors cursor-pointer border',
                          parseFloat(takeProfitInput) === tp
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        )}
                      >
                        ${tp}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stop Loss with Stepper */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-slate-700">
                      Stop Loss (USD)
                    </Label>
                    <span className="text-[11px] text-rose-700 font-mono">
                      -${stopLossInput}
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
                      onBlur={() => {
                        const val = parseFloat(stopLossInput);
                        commitStopLoss(isNaN(val) ? 0 : val);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = parseFloat(stopLossInput);
                          commitStopLoss(isNaN(val) ? 0 : val);
                        }
                      }}
                      placeholder="50"
                      className="h-10 bg-slate-50 border-slate-200 font-mono text-sm text-center"
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

                  <div className="flex items-center gap-1 pt-1">
                    {[20, 50, 100, 200].map((sl) => (
                      <button
                        key={sl}
                        type="button"
                        disabled={isRunning}
                        onClick={() => commitStopLoss(sl)}
                        className={cn(
                          'px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-colors cursor-pointer border',
                          parseFloat(stopLossInput) === sl
                            ? 'bg-rose-50 text-rose-800 border-rose-300 font-bold'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        )}
                      >
                        ${sl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dedicated Risk Page Link Card */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    <span>Dedicated Risk Management Page</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Martingale stress tables, risk profiles, and capital safeguards.
                  </p>
                </div>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="bg-white border-slate-200 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  <Link href="/risk-management">
                    Open Page <ExternalLink className="w-3 h-3 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-medium text-slate-700">
                  Live Trade History ({logs.length})
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearLogs}
                    className="h-7 px-2 text-[11px] text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Clear Log
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={resetStats}
                    className="h-7 px-2 text-[11px] text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Reset Stats
                  </Button>
                </div>
              </div>

              {logs.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                  No automated trades recorded in this session yet.
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
                          {log.time} • {log.symbol} {log.strategyUsed ? `• ${log.strategyUsed}` : ''}
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

      {/* Footer Navigation Link */}
      <div className="flex items-center gap-2">
        <Button
          asChild
          variant="outline"
          className="flex-1 h-9 rounded-xl border-slate-200 bg-white text-xs text-slate-600 hover:text-slate-900 shadow-sm cursor-pointer"
        >
          <Link href="/risk-management">
            🛡️ Open Risk Management Page
          </Link>
        </Button>
        {isAuthenticated && (
          <Button
            asChild
            variant="outline"
            className="flex-1 h-9 rounded-xl border-slate-200 bg-white text-xs text-slate-600 hover:text-slate-900 shadow-sm cursor-pointer"
          >
            <Link href="/reports">
              📊 Positions & Reports
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
