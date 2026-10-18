'use client';

import { useState, useEffect } from 'react';
import { ShieldAlert, Plus, Minus, Check, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { UseAutoTradingBotReturn } from '@/hooks/use-auto-trading-bot';
import { toast } from 'sonner';

export interface RiskManagementViewProps {
  bot: UseAutoTradingBotReturn;
}

export function RiskManagementView({ bot }: RiskManagementViewProps) {
  const { isRunning, settings, updateSettings } = bot;

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
    toast.success(`Base stake updated to $${clamped}`);
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
    toast.success(`Daily profit target updated to $${clamped}`);
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
    toast.success(`Maximum daily loss updated to $${clamped}`);
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

  return (
    <div className="w-full space-y-4 pb-20">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <ShieldAlert className="w-4 h-4 text-emerald-600" />
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Risk Management & Stake Setup</h3>
            <p className="text-xs text-slate-500">Configure permitted risk limits and stake size for G-Squad</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Base Stake */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-slate-700">
                Stake Amount (USD)
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
                className="h-10 bg-slate-50 border-slate-200 text-sm font-mono text-center font-bold"
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

          {/* Daily Profit Target */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-slate-700">
                Daily Profit Target (USD)
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

          {/* Maximum Daily Loss */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-slate-700">
                Maximum Daily Loss (USD)
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

        {isRunning && (
          <p className="text-[11px] text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
            Risk settings are locked while G-Squad bot is running. Stop the bot to edit limits.
          </p>
        )}
      </div>
    </div>
  );
}
