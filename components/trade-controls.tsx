'use client';

import { BotControls } from './bot-controls';
import type { UseAutoTradingBotReturn } from '@/hooks/use-auto-trading-bot';
import type { DerivWS, ActiveSymbol, ProposalInfo, BuyResult } from '@deriv/core';
import type { Direction, DurationSelectUnit, DurationOption } from '../lib/types';

export interface TradeControlsProps {
  direction: Direction;
  onDirectionChange: (direction: Direction) => void;
  allowEquals: boolean;
  onAllowEqualsChange: (value: boolean) => void;
  isConnected: boolean;
  stake: string;
  onStakeChange: (value: string) => void;
  duration: number;
  onDurationChange: (value: number) => void;
  durationOptions: DurationOption[];
  durationUnit: DurationSelectUnit;
  onDurationUnitChange: (unit: DurationSelectUnit) => void;
  endDate: Date | undefined;
  onEndDateChange: (date: Date | undefined) => void;
  endTime: string;
  onEndTimeChange: (time: string) => void;
  ws: DerivWS | null;
  activeSymbol: ActiveSymbol | null;
  proposal: ProposalInfo | null;
  onBuy: () => void;
  isBuying: boolean;
  buyResult: BuyResult | null;
  buyError: string | null;
  onClearBuyResult: () => void;
  isAuthenticated?: boolean;
  bot?: UseAutoTradingBotReturn;
}

export function TradeControls(props: TradeControlsProps) {
  if (props.bot) {
    return (
      <BotControls
        bot={props.bot}
        isConnected={props.isConnected}
        activeSymbol={props.activeSymbol}
        direction={props.direction}
        onDirectionChange={props.onDirectionChange}
        allowEquals={props.allowEquals}
        onAllowEqualsChange={props.onAllowEqualsChange}
        duration={props.duration}
        onDurationChange={props.onDurationChange}
        durationOptions={props.durationOptions}
        durationUnit={props.durationUnit}
        onDurationUnitChange={props.onDurationUnitChange}
        endDate={props.endDate}
        onEndDateChange={props.onEndDateChange}
        endTime={props.endTime}
        onEndTimeChange={props.onEndTimeChange}
        ws={props.ws}
        proposal={props.proposal}
        isAuthenticated={props.isAuthenticated}
      />
    );
  }

  // Fallback if bot is not passed
  return (
    <div className="w-full space-y-3">
      <div className="p-4 rounded-xl border border-slate-200 bg-white text-center">
        <p className="text-sm font-medium text-slate-800">Auto Trading Bot</p>
        <p className="text-xs text-slate-500 mt-1">Connecting bot engine...</p>
      </div>
    </div>
  );
}
