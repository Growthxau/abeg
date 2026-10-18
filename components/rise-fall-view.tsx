'use client';

import dynamic from 'next/dynamic';
import { Localize } from '@deriv-com/translations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Footer, FooterBar } from '@/components/custom/footer';
import { Header } from '@/components/custom/header';
import { LoginPromptDialog } from '@/components/custom/login-prompt-dialog';
import { PinnedBuyBar } from '@/components/custom/pinned-buy-bar';
import { useAppTranslations } from '@/components/custom/i18n-provider';
import { SymbolSelector } from '@/components/custom/symbol-selector';
import { ThemeToggle } from '@/components/custom/theme-toggle';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { useContractMarkers } from '@/hooks/use-contract-markers';
import { useCallback, useMemo, useState, type CSSProperties } from 'react';
import { Ban } from 'lucide-react';
import { TradeControls } from './trade-controls';
import { BotControls } from './bot-controls';
import { ConfigurableTradeControls, ConfigurableBuyButton } from './configurable-trade-controls';
import type { UseAutoTradingBotReturn } from '@/hooks/use-auto-trading-bot';
import type { RiseFallAppConfig } from '../lib/app-config';

/**
 * A zone overlaid on the chart region. Two modes:
 *  - not-editable (no onClick): ⛔ "… · not editable" hint on hover.
 *  - selectable (onClick): clickable to select; ring highlights when selected.
 * Either way it blocks direct chart interaction in edit mode.
 */
function FixedZone({
  label,
  style,
  onClick,
  selected,
}: {
  label: string;
  style: CSSProperties;
  onClick?: () => void;
  selected?: boolean;
}) {
  const { localize } = useAppTranslations();
  const selectable = !!onClick;
  return (
    <div
      className={`group/zone absolute left-0 right-0 z-[60] ${selectable ? 'cursor-pointer' : ''}`}
      style={style}
      onClick={onClick}
    >
      <div
        className={[
          'pointer-events-none absolute inset-0 rounded-md ring-2 ring-inset transition-opacity',
          selected
            ? 'opacity-100 ring-primary'
            : 'opacity-0 ring-muted-foreground/30 group-hover/zone:opacity-100',
        ].join(' ')}
      >
        <span className="absolute left-3 top-2 flex items-center gap-1.5 rounded-md bg-background/90 px-2 py-1 text-[11px] font-medium text-muted-foreground shadow-sm ring-1 ring-border">
          {!selectable && <Ban className="h-3.5 w-3.5" />}
          {selectable ? label : localize('{{label}} · not editable', { label })}
        </span>
      </div>
    </div>
  );
}
import type {
  AuthState,
  DerivAccount,
  ActiveSymbol,
  ProposalInfo,
  BuyResult,
  DerivWS,
} from '@deriv/core';
import type { Direction, DurationSelectUnit, DurationOption } from '../lib/types';
import type { UseSmartChartsApiReturn } from '@/hooks/use-smartcharts-api';
import type { SmartChartChartData } from '@/hooks/use-smartchart-chart-data';
import type { OpenPosition } from '../lib/types';

import { MarketLiveTicker } from '@/components/market-live-ticker';

// Edit-mode stand-in for the login prompt's auth handlers — same rule as the
// header: no OAuth navigation out of the editor.
const noopAsyncAuth = async () => {};

export interface RiseFallViewProps {
  // Auth
  authState: AuthState;
  accounts: DerivAccount[];
  activeAccount: DerivAccount | null;
  onLogin: () => Promise<void>;
  onSignUp: () => Promise<void>;
  onLogout: () => void;
  onSwitchAccount: (accountId: string) => Promise<void>;

  // Connection / loading
  ws: DerivWS | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;

  // Market data
  symbols: ActiveSymbol[];
  activeSymbol: ActiveSymbol | null;
  selectSymbol: (symbol: string) => void;
  /** Recent price window + pip size for the active symbol — powers the
   *  Symbol Selector's movement indicator when the chart is hidden. */
  prices?: number[];
  pipSize?: number;

  // Trade controls
  direction: Direction;
  setDirection: (direction: Direction) => void;
  allowEquals: boolean;
  setAllowEquals: (value: boolean) => void;
  stake: string;
  setStake: (value: string) => void;
  duration: number;
  setDuration: (value: number) => void;
  durationOptions: DurationOption[];
  durationUnit: DurationSelectUnit;
  setDurationUnit: (unit: DurationSelectUnit) => void;
  endDate: Date | undefined;
  setEndDate: (date: Date | undefined) => void;
  endTime: string;
  setEndTime: (time: string) => void;
  proposal: ProposalInfo | null;
  buyContract: () => Promise<void>;
  isBuying: boolean;
  buyResult: BuyResult | null;
  buyError: string | null;
  clearBuyResult: () => void;

  // Positions
  openPositions: OpenPosition[];
  sellContract: (contractId: number, bidPrice: string) => Promise<void>;
  sellingId: number | null;

  // Chart data (optional, SmartChart has been completely removed)
  chartData?: SmartChartChartData;
  getQuotes?: UseSmartChartsApiReturn['getQuotes'];
  subscribeQuotes?: UseSmartChartsApiReturn['subscribeQuotes'];
  unsubscribeQuotes?: UseSmartChartsApiReturn['unsubscribeQuotes'];
  /** Passed to SmartChart. Set to false for a frozen preview. Defaults to true. */
  isLive?: boolean;
  /**
   * Unix epoch (seconds) to freeze the chart at. When set, SmartCharts renders
   * a static historical snapshot and never sets up a live subscription.
   */
  endEpoch?: number;

  // Branding (used by preview route; no-op in the real app)
  logoSrc?: string;
  appName?: string;
  showAppName?: boolean;

  /**
   * No-code config. When provided, the trade controls render in configurable
   * styles/order (ConfigurableTradeControls). When omitted, the standard
   * TradeControls render unchanged.
   */
  appConfig?: RiseFallAppConfig;
  /** Edit mode — components become selectable (click opens their accordion). */
  editMode?: boolean;
  /** Called when an editable component is clicked (e.g. "chart", "stake"). */
  onSelect?: (key: string) => void;
  /** Currently selected component (highlighted). */
  selectedKey?: string | null;
  /** Rearrange mode — drag blocks in the phone to reorder the layout. */
  rearrangeMode?: boolean;
  /** Called with the new block order after a drag-drop reorder. */
  onReorder?: (order: RiseFallAppConfig['order']) => void;
  bot?: UseAutoTradingBotReturn;
  showLoginPrompt?: boolean;
  setShowLoginPrompt?: (val: boolean) => void;
}

export function RiseFallView({
  authState,
  accounts,
  activeAccount,
  onLogin,
  onSignUp,
  onLogout,
  onSwitchAccount,
  ws,
  isConnected,
  isLoading,
  error,
  symbols,
  activeSymbol,
  selectSymbol,
  prices,
  pipSize,
  direction,
  setDirection,
  allowEquals,
  setAllowEquals,
  stake,
  setStake,
  duration,
  setDuration,
  durationOptions,
  durationUnit,
  setDurationUnit,
  endDate,
  setEndDate,
  endTime,
  setEndTime,
  proposal,
  buyContract,
  isBuying,
  buyResult,
  buyError,
  clearBuyResult,
  openPositions,
  chartData,
  getQuotes,
  subscribeQuotes,
  unsubscribeQuotes,
  isLive,
  endEpoch,
  logoSrc,
  appName,
  showAppName,
  appConfig,
  editMode,
  onSelect,
  selectedKey,
  rearrangeMode,
  onReorder,
  bot,
  showLoginPrompt: externalShowLoginPrompt,
  setShowLoginPrompt: externalSetShowLoginPrompt,
}: RiseFallViewProps) {
  const { localize } = useAppTranslations();
  const isMobile = useIsMobile();
  const chartHidden = appConfig?.chart?.hidden ?? false;
  // Never render a duplicate pinned buy button when Auto Trading Bot is active
  const pinBuy = !bot && !!appConfig?.buy?.pinned && isMobile;
  const inFlowFooter = !bot && !!appConfig && isMobile;
  const contractMarkers = useContractMarkers(openPositions, activeSymbol?.underlying_symbol, isMobile);
  const [internalShowLoginPrompt, setInternalShowLoginPrompt] = useState(false);
  const showLoginPrompt = externalShowLoginPrompt !== undefined ? externalShowLoginPrompt : internalShowLoginPrompt;
  const setShowLoginPrompt = externalSetShowLoginPrompt || setInternalShowLoginPrompt;

  const handleBuy = useCallback(async () => {
    if (editMode) return;
    if (authState === 'authenticating') return;
    if (authState !== 'authenticated') {
      setShowLoginPrompt(true);
      return;
    }
    if (bot) {
      if (bot.isRunning) {
        bot.stopBot();
      } else {
        bot.startBot();
      }
      return;
    }
    await buyContract();
  }, [editMode, authState, bot, buyContract, setShowLoginPrompt]);

  // In edit mode, login/sign-up/account actions are inert (no OAuth navigation
  // out of the editor) — only the theme toggle stays interactive.
  const headerEl = useMemo(() => {
    const noop = () => {};
    const noopAsync = async () => {};
    return (
      <Header
        authState={authState}
        accounts={accounts}
        activeAccount={activeAccount}
        onLogin={editMode ? noopAsync : onLogin}
        onSignUp={editMode ? noopAsync : onSignUp}
        onLogout={editMode ? noop : onLogout}
        onSwitchAccount={editMode ? noopAsync : onSwitchAccount}
        logoSrc={logoSrc}
        appName={appName}
        showAppName={showAppName}
        actions={<ThemeToggle />}
      />
    );
  }, [
    authState,
    accounts,
    activeAccount,
    editMode,
    onLogin,
    onSignUp,
    onLogout,
    onSwitchAccount,
    logoSrc,
    appName,
    showAppName,
  ]);

  // The chart + symbol block. Used in the standard 2-column layout (left column)
  // and as a reorderable block in the no-code layout. When the chart is hidden,
  // the SmartChart is NOT mounted at all (so nothing bleeds through) and a
  // standalone Symbol Selector takes its place so users can still switch markets.
  // The Market Ticker & Volatility Deviation block. Completely replaces the heavy SmartChart
  // with a lightweight, responsive live price ticker, real-time SVG sparkline,
  // volatility breakout deviation gauge, and symbol browser.
  const chartBlock = useMemo(
    () => (
      <div className="relative w-full">
        <div className={editMode ? 'pointer-events-none select-none' : ''}>
          <MarketLiveTicker
            symbols={symbols}
            activeSymbol={activeSymbol}
            onSymbolChange={selectSymbol}
            prices={prices ?? []}
            pipSize={pipSize}
            bot={bot}
            isConnected={isConnected}
          />
        </div>
        {editMode && !rearrangeMode && (
          <FixedZone label={localize('Market & Ticker')} style={{ top: 0, bottom: 0 }} />
        )}
      </div>
    ),
    [
      symbols,
      activeSymbol,
      selectSymbol,
      prices,
      pipSize,
      bot,
      isConnected,
      editMode,
      rearrangeMode,
      localize,
    ]
  );

  if (error) {
    return (
      <main className="flex flex-col bg-background items-center justify-center px-4 min-h-dvh">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-destructive">
              <Localize i18n_default_text="Connection Error" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  // The configurable controls. `withChart` includes the chart as a reorderable
  // block in the single column (mobile); on desktop the chart is its own column,
  // so it's omitted here.
  const renderConfigurable = (withChart: boolean) =>
    appConfig ? (
      <ConfigurableTradeControls
        config={appConfig}
        chartSlot={withChart ? chartBlock : undefined}
        direction={direction}
        onDirectionChange={setDirection}
        allowEquals={allowEquals}
        onAllowEqualsChange={setAllowEquals}
        isConnected={isConnected}
        stake={stake}
        onStakeChange={setStake}
        duration={duration}
        onDurationChange={setDuration}
        durationOptions={durationOptions}
        durationUnit={durationUnit}
        onDurationUnitChange={setDurationUnit}
        endDate={endDate}
        onEndDateChange={setEndDate}
        endTime={endTime}
        onEndTimeChange={setEndTime}
        ws={ws}
        activeSymbol={activeSymbol}
        proposal={proposal}
        onBuy={handleBuy}
        isBuying={isBuying}
        buyResult={buyResult}
        buyError={buyError}
        onClearBuyResult={clearBuyResult}
        isAuthenticated={authState === 'authenticated'}
        editMode={editMode}
        onSelect={onSelect}
        selectedKey={selectedKey}
        rearrangeMode={rearrangeMode}
        onReorder={onReorder}
        pinBuy={pinBuy}
        bot={bot}
      />
    ) : null;

  return (
    <main
      className={`flex flex-col min-h-dvh ${
        editMode ? 'bg-slate-100' : 'bg-slate-50'
      } text-slate-900`}
    >
      {editMode ? (
        <div className="group/hdr sticky top-0 z-50">
          {headerEl}
          <div className="pointer-events-none absolute inset-0 z-[60] opacity-0 ring-2 ring-inset ring-muted-foreground/25 transition-opacity group-hover/hdr:opacity-100">
            <span className="absolute left-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5 rounded-md bg-background/90 px-2 py-1 text-[11px] font-medium text-muted-foreground shadow-sm ring-1 ring-border">
              <Ban className="h-3.5 w-3.5" />
              <Localize i18n_default_text="Not editable" />
            </span>
          </div>
        </div>
      ) : (
        headerEl
      )}

      {appConfig ? (
        isMobile ? (
          <div className="w-full flex-1">
            <div className="mx-auto flex w-full max-w-md flex-col gap-3 px-3 py-3">
              {isLoading ? (
                <Skeleton className="h-48 w-full rounded-xl" />
              ) : (
                <>
                  {chartBlock}
                  {bot ? (
                    <BotControls
                      bot={bot}
                      isConnected={isConnected}
                      activeSymbol={activeSymbol}
                      direction={direction}
                      onDirectionChange={setDirection}
                      allowEquals={allowEquals}
                      onAllowEqualsChange={setAllowEquals}
                      duration={duration}
                      onDurationChange={setDuration}
                      durationOptions={durationOptions}
                      durationUnit={durationUnit}
                      onDurationUnitChange={setDurationUnit}
                      endDate={endDate}
                      onEndDateChange={setEndDate}
                      endTime={endTime}
                      onEndTimeChange={setEndTime}
                      ws={ws}
                      proposal={proposal}
                      isAuthenticated={authState === 'authenticated'}
                    />
                  ) : (
                    renderConfigurable(true)
                  )}
                </>
              )}
            </div>
          </div>
        ) : chartHidden ? (
          <div className="mx-auto flex w-full max-w-md flex-col gap-3 px-4 py-4 flex-1">
            {isLoading ? (
              <Skeleton className="h-96 w-full rounded-xl" />
            ) : bot ? (
              <BotControls
                bot={bot}
                isConnected={isConnected}
                activeSymbol={activeSymbol}
                direction={direction}
                onDirectionChange={setDirection}
                allowEquals={allowEquals}
                onAllowEqualsChange={setAllowEquals}
                duration={duration}
                onDurationChange={setDuration}
                durationOptions={durationOptions}
                durationUnit={durationUnit}
                onDurationUnitChange={setDurationUnit}
                endDate={endDate}
                onEndDateChange={setEndDate}
                endTime={endTime}
                onEndTimeChange={setEndTime}
                ws={ws}
                proposal={proposal}
                isAuthenticated={authState === 'authenticated'}
              />
            ) : (
              renderConfigurable(true)
            )}
          </div>
        ) : (
          <div className="flex w-full max-w-7xl mx-auto flex-col px-4 py-4 gap-3 flex-1">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_430px] gap-4 items-start">
              <div className="lg:sticky lg:top-4">{chartBlock}</div>
              {isLoading ? (
                <Skeleton className="h-[min(33.6rem,66vh)] min-h-[384px] w-full rounded-xl" />
              ) : (
                <div>
                  {bot ? (
                    <BotControls
                      bot={bot}
                      isConnected={isConnected}
                      activeSymbol={activeSymbol}
                      direction={direction}
                      onDirectionChange={setDirection}
                      allowEquals={allowEquals}
                      onAllowEqualsChange={setAllowEquals}
                      duration={duration}
                      onDurationChange={setDuration}
                      durationOptions={durationOptions}
                      durationUnit={durationUnit}
                      onDurationUnitChange={setDurationUnit}
                      endDate={endDate}
                      onEndDateChange={setEndDate}
                      endTime={endTime}
                      onEndTimeChange={setEndTime}
                      ws={ws}
                      proposal={proposal}
                      isAuthenticated={authState === 'authenticated'}
                    />
                  ) : (
                    <Card>
                      <CardContent className="pt-4">{renderConfigurable(false)}</CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      ) : (
        <div className="flex w-full max-w-7xl mx-auto flex-col px-3 py-3 sm:px-4 sm:py-4 gap-3 flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_430px] gap-4 items-start">
            <div className="lg:sticky lg:top-4">{chartBlock}</div>
            <div>
              {isLoading ? (
                <Skeleton className="lg:h-[min(33.6rem,66vh)] lg:min-h-[384px] max-lg:h-48 w-full rounded-xl" />
              ) : (
                <TradeControls
                  direction={direction}
                  onDirectionChange={setDirection}
                  allowEquals={allowEquals}
                  onAllowEqualsChange={setAllowEquals}
                  isConnected={isConnected}
                  stake={stake}
                  onStakeChange={setStake}
                  duration={duration}
                  onDurationChange={setDuration}
                  durationOptions={durationOptions}
                  durationUnit={durationUnit}
                  onDurationUnitChange={setDurationUnit}
                  endDate={endDate}
                  onEndDateChange={setEndDate}
                  endTime={endTime}
                  onEndTimeChange={setEndTime}
                  ws={ws}
                  activeSymbol={activeSymbol}
                  proposal={proposal}
                  onBuy={handleBuy}
                  isBuying={isBuying}
                  buyResult={buyResult}
                  buyError={buyError}
                  onClearBuyResult={clearBuyResult}
                  isAuthenticated={authState === 'authenticated'}
                  bot={bot}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {pinBuy ? (
        <PinnedBuyBar
          editMode={editMode}
          rearrangeMode={rearrangeMode}
          selected={selectedKey === 'buy'}
          onSelect={() => onSelect?.('buy')}
          label={localize('Start / Stop Bot')}
        >
          <ConfigurableBuyButton
            variant={appConfig!.styles.buy}
            isConnected={isConnected}
            proposal={proposal}
            onBuy={handleBuy}
            isBuying={isBuying}
            bot={bot}
          />
        </PinnedBuyBar>
      ) : inFlowFooter ? (
        <FooterBar />
      ) : (
        <div className="py-3 text-center bg-slate-50/90 border-t border-slate-200/70 mt-auto">
          <Footer />
        </div>
      )}

      <LoginPromptDialog
        open={showLoginPrompt}
        onOpenChange={setShowLoginPrompt}
        onLogin={editMode ? noopAsyncAuth : onLogin}
        onSignUp={editMode ? noopAsyncAuth : onSignUp}
      />
    </main>
  );
}
