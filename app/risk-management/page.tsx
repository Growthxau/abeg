'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  ArrowLeft,
  Sliders,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  BrainCircuit,
  Activity,
  CheckCircle2,
  Sparkles,
  Plus,
  Minus,
} from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '@/components/custom/header';
import { ThemeToggle } from '@/components/custom/theme-toggle';
import { Footer } from '@/components/custom/footer';
import { useDerivWSContext } from '@/components/custom/deriv-ws-provider';
import { useLogoSrc } from '@/components/custom/logo-src-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  SETTINGS_STORAGE_KEY,
  DEFAULT_BOT_SETTINGS,
  type BotSettings,
  type MoneyManagement,
} from '@/hooks/use-auto-trading-bot';

export default function RiskManagementPage() {
  const logoSrc = useLogoSrc();
  const { auth } = useDerivWSContext();
  const { authState, accounts, activeAccount, login, signUp, logout, switchAccount } = auth;

  // Local state for smooth, unhindered text typing
  const [settings, setSettings] = useState<BotSettings>(DEFAULT_BOT_SETTINGS);
  const [baseStakeStr, setBaseStakeStr] = useState('10');
  const [takeProfitStr, setTakeProfitStr] = useState('50');
  const [stopLossStr, setStopLossStr] = useState('50');
  const [maxLossesStr, setMaxLossesStr] = useState('5');
  const [maxRunsStr, setMaxRunsStr] = useState('20');
  const [cooldownStr, setCooldownStr] = useState('2');
  const [devMultStr, setDevMultStr] = useState('2.0');
  const [devPeriodStr, setDevPeriodStr] = useState('15');
  const [minConfidenceStr, setMinConfidenceStr] = useState('65');

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        const parsed = { ...DEFAULT_BOT_SETTINGS, ...JSON.parse(saved) };
        setSettings(parsed);
        setBaseStakeStr(parsed.baseStake.toString());
        setTakeProfitStr(parsed.takeProfit.toString());
        setStopLossStr(parsed.stopLoss.toString());
        setMaxLossesStr(parsed.maxConsecutiveLosses.toString());
        setMaxRunsStr(parsed.maxRuns.toString());
        setCooldownStr(parsed.cooldownSeconds.toString());
        setDevMultStr(parsed.deviationMultiplier.toString());
        setDevPeriodStr(parsed.deviationPeriod.toString());
        setMinConfidenceStr(parsed.minAiConfidence.toString());
      }
    } catch {}
  }, []);

  const handleSave = () => {
    const updated: BotSettings = {
      ...settings,
      baseStake: Math.max(0.35, parseFloat(baseStakeStr) || 10),
      takeProfit: Math.max(0, parseFloat(takeProfitStr) || 0),
      stopLoss: Math.max(0, parseFloat(stopLossStr) || 0),
      maxConsecutiveLosses: Math.max(0, parseInt(maxLossesStr, 10) || 0),
      maxRuns: Math.max(0, parseInt(maxRunsStr, 10) || 0),
      cooldownSeconds: Math.max(1, parseInt(cooldownStr, 10) || 2),
      deviationMultiplier: Math.max(0.5, parseFloat(devMultStr) || 2.0),
      deviationPeriod: Math.max(5, parseInt(devPeriodStr, 10) || 15),
      minAiConfidence: Math.max(50, Math.min(95, parseInt(minConfidenceStr, 10) || 65)),
    };

    setSettings(updated);
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: SETTINGS_STORAGE_KEY,
          newValue: JSON.stringify(updated),
        })
      );
      toast.success('Risk Management Parameters Saved', {
        description: 'New risk limits and algorithm parameters are synchronized with the bot.',
      });
    } catch {
      toast.error('Failed to save settings to browser storage.');
    }
  };

  const applyPreset = (preset: 'conservative' | 'balanced' | 'aggressive') => {
    let p: Partial<BotSettings> = {};
    if (preset === 'conservative') {
      p = {
        strategy: 'volatility_breakout',
        moneyManagement: 'fixed',
        baseStake: 5,
        martingaleMultiplier: 1.5,
        takeProfit: 25,
        stopLoss: 25,
        maxConsecutiveLosses: 3,
        maxRuns: 15,
        cooldownSeconds: 3,
        deviationMultiplier: 2.2,
        deviationPeriod: 20,
        minAiConfidence: 75,
      };
    } else if (preset === 'balanced') {
      p = {
        strategy: 'ai_gemini',
        moneyManagement: 'martingale',
        baseStake: 10,
        martingaleMultiplier: 2.0,
        takeProfit: 50,
        stopLoss: 50,
        maxConsecutiveLosses: 5,
        maxRuns: 25,
        cooldownSeconds: 2,
        deviationMultiplier: 2.0,
        deviationPeriod: 15,
        minAiConfidence: 65,
      };
    } else {
      p = {
        strategy: 'ai_gemini',
        moneyManagement: 'martingale',
        baseStake: 20,
        martingaleMultiplier: 2.2,
        takeProfit: 100,
        stopLoss: 100,
        maxConsecutiveLosses: 6,
        maxRuns: 50,
        cooldownSeconds: 1,
        deviationMultiplier: 1.8,
        deviationPeriod: 12,
        minAiConfidence: 60,
      };
    }

    const next = { ...settings, ...p };
    setSettings(next);
    setBaseStakeStr(next.baseStake.toString());
    setTakeProfitStr(next.takeProfit.toString());
    setStopLossStr(next.stopLoss.toString());
    setMaxLossesStr(next.maxConsecutiveLosses.toString());
    setMaxRunsStr(next.maxRuns.toString());
    setCooldownStr(next.cooldownSeconds.toString());
    setDevMultStr(next.deviationMultiplier.toString());
    setDevPeriodStr(next.deviationPeriod.toString());
    setMinConfidenceStr(next.minAiConfidence.toString());

    toast.info(`Applied ${preset.toUpperCase()} Risk Profile`, {
      description: 'Review the settings and click Save Changes below.',
    });
  };

  // Capital Stress Calculator
  const baseStakeNum = parseFloat(baseStakeStr) || 10;
  const multNum = settings.martingaleMultiplier || 2.0;
  const stressRows = [1, 2, 3, 4, 5, 6].map((lossCount) => {
    let stakeAtLoss = baseStakeNum;
    let totalLost = 0;
    for (let i = 1; i <= lossCount; i++) {
      totalLost += stakeAtLoss;
      if (settings.moneyManagement === 'martingale') {
        stakeAtLoss = parseFloat((stakeAtLoss * multNum).toFixed(2));
      } else if (settings.moneyManagement === 'dalembert') {
        stakeAtLoss = parseFloat((stakeAtLoss + baseStakeNum).toFixed(2));
      }
    }
    return { lossCount, nextStake: stakeAtLoss, cumulativeLoss: totalLost };
  });

  return (
    <main className="flex flex-col bg-slate-50 min-h-dvh text-slate-900">
      <Header
        authState={authState}
        accounts={accounts}
        activeAccount={activeAccount}
        onLogin={login}
        onSignUp={signUp}
        onLogout={logout}
        onSwitchAccount={switchAccount}
        logoSrc={logoSrc}
        actions={<ThemeToggle />}
      />

      <div className="flex-1 w-full max-w-5xl mx-auto px-4 py-6 pb-20 space-y-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Trading Bot</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-mono">
              Status: Live Sync Enabled
            </span>
            <Button
              size="sm"
              onClick={handleSave}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 cursor-pointer"
            >
              Save Changes
            </Button>
          </div>
        </div>

        {/* Page Banner */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900">
                Risk Management & Safety Controls
              </h2>
              <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
                Protect your capital with automated stop-loss thresholds, profit targets,
                standard deviation volatility breakout filters, and AI confidence gating.
                Configured parameters apply directly to your automated trading bot sessions.
              </p>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">
              Risk Presets:
            </span>
            <button
              type="button"
              onClick={() => applyPreset('conservative')}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              🛡️ Conservative Guard
            </button>
            <button
              type="button"
              onClick={() => applyPreset('balanced')}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              ⚖️ Balanced Growth (Recommended)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('aggressive')}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              🚀 High-Frequency Breakout
            </button>
          </div>
        </div>

        {/* 2-Column Configuration Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Section 1: Capital Protection */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <h3 className="font-semibold text-slate-900 text-sm">
                Capital Protection & Limits
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-slate-700">
                    Take Profit (USD)
                  </Label>
                  <span className="text-[11px] text-emerald-700 font-mono font-semibold">+${takeProfitStr || '0'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setTakeProfitStr((prev) => Math.max(0, (parseFloat(prev) || 0) - 5).toString())}
                    className="h-9 w-9 shrink-0 border-slate-200"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </Button>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={takeProfitStr}
                    onChange={(e) => setTakeProfitStr(e.target.value)}
                    placeholder="50"
                    className="bg-slate-50 border-slate-200 text-center font-mono text-sm h-9"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setTakeProfitStr((prev) => ((parseFloat(prev) || 0) + 5).toString())}
                    className="h-9 w-9 shrink-0 border-slate-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <div className="flex items-center gap-1 pt-0.5">
                  {[25, 50, 100, 200].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setTakeProfitStr(v.toString())}
                      className="px-1.5 py-0.5 text-[10px] rounded bg-slate-100 text-slate-600 hover:bg-slate-200 font-mono"
                    >
                      ${v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-slate-700">
                    Stop Loss (USD)
                  </Label>
                  <span className="text-[11px] text-rose-700 font-mono font-semibold">-${stopLossStr || '0'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setStopLossStr((prev) => Math.max(0, (parseFloat(prev) || 0) - 5).toString())}
                    className="h-9 w-9 shrink-0 border-slate-200"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </Button>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={stopLossStr}
                    onChange={(e) => setStopLossStr(e.target.value)}
                    placeholder="50"
                    className="bg-slate-50 border-slate-200 text-center font-mono text-sm h-9"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setStopLossStr((prev) => ((parseFloat(prev) || 0) + 5).toString())}
                    className="h-9 w-9 shrink-0 border-slate-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <div className="flex items-center gap-1 pt-0.5">
                  {[25, 50, 100, 200].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setStopLossStr(v.toString())}
                      className="px-1.5 py-0.5 text-[10px] rounded bg-slate-100 text-slate-600 hover:bg-slate-200 font-mono"
                    >
                      ${v}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">
                  Max Consecutive Losses
                </Label>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setMaxLossesStr((prev) => Math.max(0, (parseInt(prev, 10) || 0) - 1).toString())}
                    className="h-9 w-9 shrink-0 border-slate-200"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </Button>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={maxLossesStr}
                    onChange={(e) => setMaxLossesStr(e.target.value)}
                    placeholder="5"
                    className="bg-slate-50 border-slate-200 text-center font-mono text-sm h-9"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setMaxLossesStr((prev) => ((parseInt(prev, 10) || 0) + 1).toString())}
                    className="h-9 w-9 shrink-0 border-slate-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <span className="text-[10px] text-slate-500">Tripwire auto-stops bot on loss streak</span>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">
                  Max Total Runs (Trades)
                </Label>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setMaxRunsStr((prev) => Math.max(0, (parseInt(prev, 10) || 0) - 5).toString())}
                    className="h-9 w-9 shrink-0 border-slate-200"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </Button>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={maxRunsStr}
                    onChange={(e) => setMaxRunsStr(e.target.value)}
                    placeholder="20"
                    className="bg-slate-50 border-slate-200 text-center font-mono text-sm h-9"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setMaxRunsStr((prev) => ((parseInt(prev, 10) || 0) + 5).toString())}
                    className="h-9 w-9 shrink-0 border-slate-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <span className="text-[10px] text-slate-500">0 = Unlimited session runs</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">
                Delay Cooldown Between Trades (Seconds)
              </Label>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setCooldownStr((prev) => Math.max(1, (parseInt(prev, 10) || 2) - 1).toString())}
                  className="h-9 w-9 shrink-0 border-slate-200"
                >
                  <Minus className="w-3.5 h-3.5" />
                </Button>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={cooldownStr}
                  onChange={(e) => setCooldownStr(e.target.value)}
                  placeholder="2"
                  className="bg-slate-50 border-slate-200 text-center font-mono text-sm h-9"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setCooldownStr((prev) => ((parseInt(prev, 10) || 2) + 1).toString())}
                  className="h-9 w-9 shrink-0 border-slate-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
              <span className="text-[10px] text-slate-500">
                Allows tick feed stabilization before requesting next trade
              </span>
            </div>
          </div>

          {/* Section 2: Money Management & Sizing */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Sliders className="w-5 h-5 text-indigo-600" />
              <h3 className="font-semibold text-slate-900 text-sm">
                Money Management & Sizing
              </h3>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">
                Money Management Strategy
              </Label>
              <Select
                value={settings.moneyManagement}
                onValueChange={(v) =>
                  setSettings((prev) => ({ ...prev, moneyManagement: v as MoneyManagement }))
                }
              >
                <SelectTrigger className="bg-slate-50 border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="martingale">Martingale (Multiply on Loss)</SelectItem>
                  <SelectItem value="fixed">Fixed Stake (Flat Amount)</SelectItem>
                  <SelectItem value="dalembert">D&apos;Alembert (Step Adjust)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">
                  Initial Base Stake (USD)
                </Label>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setBaseStakeStr((prev) => Math.max(0.35, (parseFloat(prev) || 10) - 1).toFixed(2))}
                    className="h-9 w-9 shrink-0 border-slate-200"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </Button>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={baseStakeStr}
                    onChange={(e) => setBaseStakeStr(e.target.value)}
                    placeholder="10"
                    className="bg-slate-50 border-slate-200 text-center font-mono text-sm h-9"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setBaseStakeStr((prev) => ((parseFloat(prev) || 10) + 1).toFixed(2))}
                    className="h-9 w-9 shrink-0 border-slate-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <div className="flex items-center gap-1 pt-0.5">
                  {[1, 5, 10, 25, 50].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setBaseStakeStr(s.toString())}
                      className="px-1.5 py-0.5 text-[10px] rounded bg-slate-100 text-slate-600 hover:bg-slate-200 font-mono"
                    >
                      ${s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">
                  Martingale Multiplier
                </Label>
                <Select
                  value={settings.martingaleMultiplier.toString()}
                  onValueChange={(v) =>
                    setSettings((prev) => ({ ...prev, martingaleMultiplier: parseFloat(v) }))
                  }
                >
                  <SelectTrigger className="bg-slate-50 border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1.5">1.5x (Gentle Recovery)</SelectItem>
                    <SelectItem value="2">2.0x (Standard Martingale)</SelectItem>
                    <SelectItem value="2.2">2.2x (High Payout Recovery)</SelectItem>
                    <SelectItem value="2.5">2.5x (Aggressive Recovery)</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-[11px] text-slate-500">
                  Multiplied on loss, resets on win
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Volatility Breakout Deviation */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-slate-900 text-sm">
                Volatility Breakout Deviation
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Calculates real-time standard deviation (σ) envelopes around moving average ticks.
              Triggers high-conviction trades when price momentum pierces volatility bands.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-slate-700">
                    Deviation Multiplier (k·σ)
                  </Label>
                  <span className="text-xs font-mono font-semibold text-blue-700">{devMultStr}σ</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setDevMultStr((prev) => Math.max(0.5, (parseFloat(prev) || 2.0) - 0.1).toFixed(1))}
                    className="h-9 w-9 shrink-0 border-slate-200"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </Button>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={devMultStr}
                    onChange={(e) => setDevMultStr(e.target.value)}
                    placeholder="2.0"
                    className="bg-slate-50 border-slate-200 text-center font-mono text-sm h-9"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setDevMultStr((prev) => Math.min(5.0, (parseFloat(prev) || 2.0) + 0.1).toFixed(1))}
                    className="h-9 w-9 shrink-0 border-slate-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <div className="flex items-center gap-1 pt-0.5">
                  {[1.5, 1.8, 2.0, 2.2, 2.5].map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setDevMultStr(k.toString())}
                      className="px-1.5 py-0.5 text-[10px] rounded bg-slate-100 text-slate-600 hover:bg-slate-200 font-mono"
                    >
                      {k}σ
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-slate-700">
                    Lookback Period (Ticks)
                  </Label>
                  <span className="text-xs font-mono text-slate-500">{devPeriodStr}t</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setDevPeriodStr((prev) => Math.max(5, (parseInt(prev, 10) || 15) - 1).toString())}
                    className="h-9 w-9 shrink-0 border-slate-200"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </Button>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={devPeriodStr}
                    onChange={(e) => setDevPeriodStr(e.target.value)}
                    placeholder="15"
                    className="bg-slate-50 border-slate-200 text-center font-mono text-sm h-9"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setDevPeriodStr((prev) => ((parseInt(prev, 10) || 15) + 1).toString())}
                    className="h-9 w-9 shrink-0 border-slate-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <div className="flex items-center gap-1 pt-0.5">
                  {[10, 15, 20, 25].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setDevPeriodStr(t.toString())}
                      className="px-1.5 py-0.5 text-[10px] rounded bg-slate-100 text-slate-600 hover:bg-slate-200 font-mono"
                    >
                      {t}t
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: AI Gemini Model Integration */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <BrainCircuit className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-slate-900 text-sm">
                AI Gemini 3.8 Market Intelligence
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Gemini 3.8 Flash assesses tick momentum, volatility deviation envelopes, and mean-reversion
              probabilities. Filters out false breakouts to maximize win rate.
            </p>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-slate-700">
                  Minimum AI Confidence Threshold
                </Label>
                <span className="text-xs font-bold text-purple-700">
                  {minConfidenceStr}%
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setMinConfidenceStr((prev) => Math.max(50, (parseInt(prev, 10) || 65) - 5).toString())}
                  className="h-9 w-9 shrink-0 border-slate-200"
                >
                  <Minus className="w-3.5 h-3.5" />
                </Button>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={minConfidenceStr}
                  onChange={(e) => setMinConfidenceStr(e.target.value)}
                  placeholder="65"
                  className="bg-slate-50 border-slate-200 text-center font-mono text-sm h-9"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setMinConfidenceStr((prev) => Math.min(95, (parseInt(prev, 10) || 65) + 5).toString())}
                  className="h-9 w-9 shrink-0 border-slate-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
              <div className="flex items-center gap-1 pt-0.5">
                {[60, 65, 70, 75, 80].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setMinConfidenceStr(c.toString())}
                    className="px-1.5 py-0.5 text-[10px] rounded bg-purple-50 text-purple-700 hover:bg-purple-100 font-mono"
                  >
                    {c}%
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stress Simulator Table */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h4 className="font-semibold text-slate-900 text-sm">
                Martingale Capital Stress Simulation
              </h4>
            </div>
            <span className="text-xs text-slate-500">
              Base Stake: ${baseStakeNum} | Multiplier: {multNum}x
            </span>
          </div>

          <p className="text-xs text-slate-500">
            This stress table illustrates the required capital if an adverse streak of consecutive losses occurs:
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 px-3 font-medium">Loss Streak</th>
                  <th className="py-2 px-3 font-medium">Next Contract Stake</th>
                  <th className="py-2 px-3 font-medium">Cumulative Drawdown</th>
                  <th className="py-2 px-3 font-medium">Safety Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stressRows.map((row) => (
                  <tr key={row.lossCount} className="hover:bg-slate-50/50">
                    <td className="py-2 px-3 font-semibold text-slate-800">
                      {row.lossCount} {row.lossCount === 1 ? 'Loss' : 'Losses'}
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-900 font-bold">
                      ${row.nextStake.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 font-mono text-rose-600 font-bold">
                      -${row.cumulativeLoss.toFixed(2)}
                    </td>
                    <td className="py-2 px-3">
                      {row.lossCount <= 3 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                          <CheckCircle2 className="w-3 h-3" /> Safe
                        </span>
                      ) : row.lossCount <= 5 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
                          <AlertTriangle className="w-3 h-3" /> Moderate Risk
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full font-medium">
                          <AlertTriangle className="w-3 h-3" /> High Risk (Breaker Recommended)
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Button Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            asChild
            variant="outline"
            className="border-slate-200 text-slate-700"
          >
            <Link href="/">Cancel</Link>
          </Button>
          <Button
            onClick={handleSave}
            size="lg"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 cursor-pointer"
          >
            Save All Risk Controls
          </Button>
        </div>
      </div>

      <div className="py-3 text-center bg-slate-50/80 border-t border-slate-200/60 mt-auto">
        <Footer />
      </div>
    </main>
  );
}
