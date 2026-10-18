'use client';

import { Activity, Clock, CheckCircle2, XCircle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ClosedPosition } from '@/lib/types';

export interface HistoryViewProps {
  closedPositions: ClosedPosition[];
  onRefresh?: () => Promise<void>;
  isLoading?: boolean;
}

export function HistoryView({ closedPositions, onRefresh, isLoading }: HistoryViewProps) {
  const totalTrades = closedPositions.length;
  const totalProfit = closedPositions.reduce((sum, p) => sum + (p.sell_price - p.buy_price), 0);
  const wonTrades = closedPositions.filter(p => p.sell_price > p.buy_price).length;
  const winRate = totalTrades > 0 ? Math.round((wonTrades / totalTrades) * 100) : 0;

  return (
    <div className="w-full space-y-4 pb-20">
      {/* Header Summary */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-sm">Real Position History</h3>
          </div>
          {onRefresh && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="h-8 px-2.5 text-xs gap-1.5 cursor-pointer"
            >
              <RefreshCcw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
              <span>Refresh</span>
            </Button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-center">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Total P/L</span>
            <span className={cn('text-sm font-bold font-mono', totalProfit >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
              {totalProfit >= 0 ? `+$${totalProfit.toFixed(2)}` : `-$${Math.abs(totalProfit).toFixed(2)}`}
            </span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-center">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Win Rate</span>
            <span className="text-sm font-bold font-mono text-slate-900">{winRate}%</span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-center">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Closed</span>
            <span className="text-sm font-bold font-mono text-slate-900">{totalTrades}</span>
          </div>
        </div>
      </div>

      {/* Positions List */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500">Deriv Account Profit Table</h4>

        {closedPositions.length === 0 ? (
          <div className="text-center py-12 text-slate-400 space-y-2">
            <Activity className="w-8 h-8 mx-auto opacity-40" />
            <p className="text-sm font-medium">No closed positions found.</p>
            <p className="text-xs text-slate-400">Completed trades on your Deriv account will appear here.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {closedPositions.map((pos) => {
              const profit = pos.sell_price - pos.buy_price;
              const isWon = profit > 0;
              const timeStr = pos.sell_time ? new Date(pos.sell_time * 1000).toLocaleString() : 'Just now';

              return (
                <div
                  key={pos.contract_id}
                  className={cn(
                    'p-3 rounded-xl border text-xs flex items-center justify-between transition-colors',
                    isWon
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : 'bg-rose-50/50 border-rose-200'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    {isWon ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <span>{pos.underlying_symbol || 'Volatility 100 (1s)'}</span>
                        <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-mono', pos.contract_type?.includes('CALL') ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800')}>
                          {pos.contract_type}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {timeStr} • ID: {pos.contract_id}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono font-bold text-slate-900">
                      Stake: ${pos.buy_price.toFixed(2)}
                    </div>
                    <div className={cn('font-mono font-semibold text-[11px]', profit >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
                      {profit >= 0 ? `+$${profit.toFixed(2)}` : `-$${Math.abs(profit).toFixed(2)}`}
                    </div>
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
