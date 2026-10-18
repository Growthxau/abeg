'use client';

import { Activity, Award, DollarSign, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UseAutoTradingBotReturn } from '@/hooks/use-auto-trading-bot';

export interface HistoryViewProps {
  bot: UseAutoTradingBotReturn;
}

export function HistoryView({ bot }: HistoryViewProps) {
  const { logs, totalRuns, wonRuns, lostRuns, winRate, netProfit } = bot;

  return (
    <div className="w-full space-y-4 pb-16">
      {/* Header Summary */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-sm">Trading History & Performance</h3>
          </div>
          <span className="text-xs font-mono text-slate-500">{totalRuns} Total Runs</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-center">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Net P/L</span>
            <span className={cn('text-sm font-bold font-mono', netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
              {netProfit >= 0 ? `+$${netProfit.toFixed(2)}` : `-$${Math.abs(netProfit).toFixed(2)}`}
            </span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-center">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Win Rate</span>
            <span className="text-sm font-bold font-mono text-slate-900">{winRate}%</span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-center">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Win/Loss</span>
            <span className="text-sm font-bold font-mono text-slate-900">{wonRuns}W / {lostRuns}L</span>
          </div>
        </div>
      </div>

      {/* Logs List */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500">Executed Contracts Log</h4>

        {logs.length === 0 ? (
          <div className="text-center py-12 text-slate-400 space-y-2">
            <Activity className="w-8 h-8 mx-auto opacity-40" />
            <p className="text-sm font-medium">No trading history recorded yet.</p>
            <p className="text-xs text-slate-400">Start the auto trading bot from the dashboard to execute trades.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {logs.map((log) => {
              const isWon = log.status === 'WON';
              const isLost = log.status === 'LOST';
              return (
                <div
                  key={log.id}
                  className={cn(
                    'p-3 rounded-xl border text-xs flex items-center justify-between transition-colors',
                    isWon
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : isLost
                      ? 'bg-rose-50/50 border-rose-200'
                      : 'bg-slate-50 border-slate-200'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    {isWon ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : isLost ? (
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    )}
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <span>{log.symbol || 'Volatility 100 (1s)'}</span>
                        <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-mono', log.direction === 'CALL' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800')}>
                          {log.direction}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {log.time} {log.contractId ? `• ID: ${log.contractId}` : ''}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono font-bold text-slate-900">
                      Stake: ${log.stake.toFixed(2)}
                    </div>
                    {log.profit !== undefined && (
                      <div className={cn('font-mono font-semibold text-[11px]', log.profit >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
                        {log.profit >= 0 ? `+$${log.profit.toFixed(2)}` : `-$${Math.abs(log.profit).toFixed(2)}`}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
