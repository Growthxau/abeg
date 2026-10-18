'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import type { DerivWS, ProposalInfo, BuyResult, ActiveSymbol } from '@deriv/core';
import type { Direction } from '../lib/types';
import { playSuccessTradeSound, playProfitLimitSound, playLossLimitSound } from '@/lib/sound-effects';

export type BotStrategy =
  | 'ai_gemini'
  | 'volatility_breakout'
  | 'trend_following'
  | 'contrarian'
  | 'alternating'
  | 'fixed_rise'
  | 'fixed_fall';

export type MoneyManagement = 'martingale' | 'fixed' | 'dalembert';

export type BotStatus =
  | 'idle'
  | 'analyzing'
  | 'waiting_proposal'
  | 'buying'
  | 'contract_running'
  | 'cooldown'
  | 'stopped'
  | 'stopped_take_profit'
  | 'stopped_stop_loss'
  | 'stopped_max_runs'
  | 'stopped_max_losses'
  | 'error';

export interface BotLogEntry {
  id: string;
  time: string;
  contractId?: number;
  symbol: string;
  direction: 'CALL' | 'PUT';
  stake: number;
  payout?: number;
  profit?: number;
  status: 'PENDING' | 'WON' | 'LOST' | 'ERROR' | 'INFO';
  details?: string;
  strategyUsed?: string;
}

export interface BotSettings {
  strategy: BotStrategy;
  moneyManagement: MoneyManagement;
  baseStake: number;
  martingaleMultiplier: number;
  takeProfit: number; // 0 = disabled
  stopLoss: number; // 0 = disabled
  maxConsecutiveLosses: number; // 0 = disabled
  maxRuns: number; // 0 = unlimited
  cooldownSeconds: number;
  // Volatility Breakout settings
  deviationMultiplier: number;
  deviationPeriod: number;
  // AI Settings
  minAiConfidence: number;
}

export interface AiSignalData {
  recommendation: 'CALL' | 'PUT' | 'HOLD';
  confidence: number;
  marketRegime: string;
  reasoning: string;
  volatilityDeviation: number;
  isAnalyzing: boolean;
}

export const SETTINGS_STORAGE_KEY = 'deriv_bot_risk_settings_v2';

export const DEFAULT_BOT_SETTINGS: BotSettings = {
  strategy: 'volatility_breakout',
  moneyManagement: 'martingale',
  baseStake: 10,
  martingaleMultiplier: 2.0,
  takeProfit: 50,
  stopLoss: 50,
  maxConsecutiveLosses: 5,
  maxRuns: 20,
  cooldownSeconds: 2,
  deviationMultiplier: 1.5,
  deviationPeriod: 15,
  minAiConfidence: 65,
};

export interface UseAutoTradingBotParams {
  ws: DerivWS | null;
  isConnected: boolean;
  isAuthenticated: boolean;
  activeSymbol: ActiveSymbol | null;
  prices: number[];
  direction: Direction;
  setDirection: (dir: Direction) => void;
  stake: string;
  setStake: (val: string) => void;
  allowEquals: boolean;
  proposal: ProposalInfo | null;
  buyContract: () => Promise<void>;
  isBuying: boolean;
  buyResult: BuyResult | null;
  buyError: string | null;
  onRequireAuth: () => void;
}

export interface UseAutoTradingBotReturn {
  isRunning: boolean;
  botStatus: BotStatus;
  statusMessage: string;
  settings: BotSettings;
  updateSettings: (partial: Partial<BotSettings>) => void;
  currentStake: number;
  totalRuns: number;
  wonRuns: number;
  lostRuns: number;
  winRate: number;
  consecutiveLosses: number;
  netProfit: number;
  logs: BotLogEntry[];
  activeContractId: number | null;
  aiSignal: AiSignalData | null;
  volatilityStats: {
    upperBand: number;
    lowerBand: number;
    mean: number;
    deviation: number;
    devScore: number;
  };
  startBot: () => void;
  stopBot: () => void;
  resetStats: () => void;
  clearLogs: () => void;
  triggerAiAnalysis: () => Promise<AiSignalData | null>;
}

export function useAutoTradingBot({
  ws,
  isConnected,
  isAuthenticated,
  activeSymbol,
  prices,
  direction,
  setDirection,
  stake,
  setStake,
  allowEquals,
  proposal,
  buyContract,
  isBuying,
  buyResult,
  buyError,
  onRequireAuth,
}: UseAutoTradingBotParams): UseAutoTradingBotReturn {
  const [isRunning, setIsRunning] = useState(false);
  const [botStatus, setBotStatus] = useState<BotStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('Bot is idle. Click Start Bot to begin automated trading.');

  // Load initial settings from localStorage if available
  const [settings, setSettings] = useState<BotSettings>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (saved) return { ...DEFAULT_BOT_SETTINGS, ...JSON.parse(saved) };
      } catch {}
    }
    return DEFAULT_BOT_SETTINGS;
  });

  const [currentStake, setCurrentStake] = useState<number>(settings.baseStake);
  const [totalRuns, setTotalRuns] = useState(0);
  const [wonRuns, setWonRuns] = useState(0);
  const [lostRuns, setLostRuns] = useState(0);
  const [consecutiveLosses, setConsecutiveLosses] = useState(0);
  const [netProfit, setNetProfit] = useState(0);
  const [logs, setLogs] = useState<BotLogEntry[]>([]);
  const [activeContractId, setActiveContractId] = useState<number | null>(null);

  const [aiSignal, setAiSignal] = useState<AiSignalData | null>(null);

  // References to keep callbacks current without retriggering loops
  const isRunningRef = useRef(isRunning);
  isRunningRef.current = isRunning;

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const currentStakeRef = useRef(currentStake);
  currentStakeRef.current = currentStake;

  const netProfitRef = useRef(netProfit);
  netProfitRef.current = netProfit;

  const totalRunsRef = useRef(totalRuns);
  totalRunsRef.current = totalRuns;

  const consecutiveLossesRef = useRef(consecutiveLosses);
  consecutiveLossesRef.current = consecutiveLosses;

  const activeContractIdRef = useRef(activeContractId);
  activeContractIdRef.current = activeContractId;

  const pricesRef = useRef(prices);
  pricesRef.current = prices;

  const directionRef = useRef(direction);
  directionRef.current = direction;

  const proposalRef = useRef(proposal);
  proposalRef.current = proposal;

  const isBuyingRef = useRef(isBuying);
  isBuyingRef.current = isBuying;

  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isAnalyzingAiRef = useRef(false);

  // Volatility Breakout stats calculation
  const volatilityStats = useMemo(() => {
    const pts = prices;
    const period = settings.deviationPeriod || 15;
    const mult = settings.deviationMultiplier || 2.0;
    const window = pts.slice(-period);
    if (window.length < 3) {
      return { upperBand: 0, lowerBand: 0, mean: 0, deviation: 0, devScore: 0 };
    }
    const mean = window.reduce((a, b) => a + b, 0) / window.length;
    const variance = window.reduce((acc, p) => acc + Math.pow(p - mean, 2), 0) / window.length;
    const deviation = Math.sqrt(variance);
    const upperBand = mean + mult * deviation;
    const lowerBand = mean - mult * deviation;
    const current = window[window.length - 1];
    const devScore = deviation > 0 ? (current - mean) / deviation : 0;
    return { upperBand, lowerBand, mean, deviation, devScore };
  }, [prices, settings.deviationPeriod, settings.deviationMultiplier]);

  // Listen for storage changes from the separate Risk Management page
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SETTINGS_STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setSettings((prev) => ({ ...prev, ...parsed }));
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const updateSettings = useCallback(
    (partial: Partial<BotSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...partial };
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
          }
        } catch {}

        if (partial.baseStake !== undefined && !isRunningRef.current) {
          setCurrentStake(partial.baseStake);
          setStake(partial.baseStake.toString());
        }
        return next;
      });
    },
    [setStake]
  );

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const resetStats = useCallback(() => {
    setTotalRuns(0);
    setWonRuns(0);
    setLostRuns(0);
    setConsecutiveLosses(0);
    setNetProfit(0);
    setCurrentStake(settingsRef.current.baseStake);
    setStake(settingsRef.current.baseStake.toString());
    setLogs([]);
    setBotStatus('idle');
    setStatusMessage('Bot statistics and session history reset.');
  }, [setStake]);

  const stopBot = useCallback(() => {
    setIsRunning(false);
    isRunningRef.current = false;
    if (cooldownTimerRef.current) {
      clearTimeout(cooldownTimerRef.current);
      cooldownTimerRef.current = null;
    }
    if (activeContractIdRef.current) {
      setBotStatus('stopped');
      setStatusMessage(`Bot stopping... Waiting for active contract #${activeContractIdRef.current} to settle.`);
      toast.info('Bot stopping', {
        description: 'Waiting for active contract to finish.',
      });
    } else {
      setBotStatus('stopped');
      setStatusMessage('Bot stopped by user.');
      toast.info('Bot stopped');
    }
  }, []);

  const startBot = useCallback(() => {
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }
    if (!isConnected) {
      toast.error('Cannot start bot', { description: 'Connection to Deriv server is not established.' });
      return;
    }

    const base = settingsRef.current.baseStake;
    setCurrentStake(base);
    currentStakeRef.current = base;
    setStake(base.toString());
    setConsecutiveLosses(0);
    consecutiveLossesRef.current = 0;

    setIsRunning(true);
    isRunningRef.current = true;
    setBotStatus('analyzing');
    setStatusMessage(`Bot activated. Evaluating ${settingsRef.current.strategy.replace('_', ' ').toUpperCase()} signals...`);
    toast.success('Auto Trading Bot Started', {
      description: `Strategy: ${settingsRef.current.strategy.replace('_', ' ').toUpperCase()} | Stake: $${base}`,
    });
  }, [isAuthenticated, isConnected, onRequireAuth, setStake]);

  // Server-side AI Market Analysis trigger
  const triggerAiAnalysis = useCallback(async (): Promise<AiSignalData | null> => {
    if (isAnalyzingAiRef.current) return aiSignal;
    isAnalyzingAiRef.current = true;

    try {
      const res = await fetch('/api/bot/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: activeSymbol?.underlying_symbol_name || activeSymbol?.underlying_symbol || 'Market',
          prices: pricesRef.current.slice(-30),
          recentStats: {
            winRate: totalRunsRef.current > 0 ? Math.round((wonRuns / totalRunsRef.current) * 100) : 0,
            consecutiveLosses: consecutiveLossesRef.current,
            netProfit: netProfitRef.current,
          },
        }),
      });

      if (!res.ok) throw new Error('AI analysis failed');
      const data = await res.json();
      const signal: AiSignalData = {
        recommendation: data.recommendation || 'CALL',
        confidence: data.confidence || 75,
        marketRegime: data.marketRegime || 'Normal Market',
        reasoning: data.reasoning || 'Standard trend alignment.',
        volatilityDeviation: data.volatilityDeviation || 1.0,
        isAnalyzing: false,
      };
      setAiSignal(signal);
      return signal;
    } catch (e) {
      console.warn('[AI Bot Analysis Network Fallback]:', e);
      return null;
    } finally {
      isAnalyzingAiRef.current = false;
    }
  }, [activeSymbol, wonRuns]);

  // Determine next direction according to strategy
  const determineNextDirection = useCallback(async (): Promise<Direction> => {
    const strat = settingsRef.current.strategy;
    const pts = pricesRef.current;

    // 1. AI Gemini Model Strategy
    if (strat === 'ai_gemini') {
      const signal = await triggerAiAnalysis();
      if (signal && signal.confidence >= settingsRef.current.minAiConfidence) {
        if (signal.recommendation === 'CALL' || signal.recommendation === 'PUT') {
          return signal.recommendation;
        }
      }
      // If AI recommends HOLD or below threshold, fallback to volatility breakout
    }

    // 2. Volatility Breakout Deviation Strategy
    if (strat === 'volatility_breakout' || strat === 'ai_gemini') {
      const period = settingsRef.current.deviationPeriod || 15;
      const mult = settingsRef.current.deviationMultiplier || 2.0;
      const window = pts.slice(-period);
      if (window.length >= 5) {
        const mean = window.reduce((a, b) => a + b, 0) / window.length;
        const variance = window.reduce((acc, p) => acc + Math.pow(p - mean, 2), 0) / window.length;
        const stdDev = Math.sqrt(variance);
        const upperBand = mean + mult * stdDev;
        const lowerBand = mean - mult * stdDev;
        const current = window[window.length - 1];

        if (current >= upperBand) return 'CALL'; // Breakout up
        if (current <= lowerBand) return 'PUT'; // Breakout down

        // Inside bands: check direction of latest micro momentum
        const prev = window[window.length - 2];
        return current >= prev ? 'CALL' : 'PUT';
      }
    }

    // 3. Fixed Rise / Fall
    if (strat === 'fixed_rise') return 'CALL';
    if (strat === 'fixed_fall') return 'PUT';

    // 4. Alternating
    if (strat === 'alternating') {
      return directionRef.current === 'CALL' ? 'PUT' : 'CALL';
    }

    // 5. Trend Following vs Contrarian
    if (pts.length >= 2) {
      const last = pts[pts.length - 1];
      const prev = pts[pts.length - 2];
      const isUp = last >= prev;
      if (strat === 'trend_following') return isUp ? 'CALL' : 'PUT';
      if (strat === 'contrarian') return isUp ? 'PUT' : 'CALL';
    }

    return directionRef.current || 'CALL';
  }, [triggerAiAnalysis]);

  // When buyResult arrives, record active contract and log
  useEffect(() => {
    if (!buyResult || !isRunningRef.current) return;

    setActiveContractId(buyResult.contractId);
    activeContractIdRef.current = buyResult.contractId;
    setBotStatus('contract_running');
    setStatusMessage(`Contract #${buyResult.contractId} active. Monitoring live ticks for settlement...`);
    playSuccessTradeSound();

    const newLog: BotLogEntry = {
      id: `${buyResult.contractId}-${Date.now()}`,
      time: new Date().toLocaleTimeString(),
      contractId: buyResult.contractId,
      symbol: activeSymbol?.underlying_symbol_name || activeSymbol?.underlying_symbol || 'Market',
      direction: directionRef.current,
      stake: buyResult.buyPrice,
      payout: buyResult.payout,
      status: 'PENDING',
      details: buyResult.longcode,
      strategyUsed: settingsRef.current.strategy.replace('_', ' ').toUpperCase(),
    };

    setLogs((prev) => [newLog, ...prev.slice(0, 99)]);
  }, [buyResult, activeSymbol]);

  // Handle buy errors while bot is running
  useEffect(() => {
    if (!buyError || !isRunningRef.current) return;

    toast.error('Bot Trade Error', { description: buyError });
    setBotStatus('error');
    setStatusMessage(`Trade submission notice: ${buyError}. Retrying in 4 seconds...`);

    cooldownTimerRef.current = setTimeout(() => {
      if (isRunningRef.current) {
        setBotStatus('analyzing');
        setStatusMessage('Resuming automated analysis...');
      }
    }, 4000);
  }, [buyError]);

  // Listen for contract settlement via WebSocket proposal_open_contract messages
  useEffect(() => {
    if (!ws || !isConnected || !isAuthenticated) return;

    const unsubscribe = ws.onMessage((data) => {
      if (data.msg_type !== 'proposal_open_contract') return;
      const contract = data.proposal_open_contract as Record<string, unknown> | undefined;
      if (!contract) return;

      const contractId = contract.contract_id as number;
      if (!contractId || contractId !== activeContractIdRef.current) return;

      const isSold = !!contract.is_sold;
      const isExpired = !!contract.is_expired;
      const status = contract.status as string;

      if (isSold || isExpired || status !== 'open') {
        // Contract concluded!
        const profit = parseFloat(String(contract.profit ?? '0'));
        const won = profit > 0;

        setActiveContractId(null);
        activeContractIdRef.current = null;

        // Update stats
        const updatedTotal = totalRunsRef.current + 1;
        totalRunsRef.current = updatedTotal;
        setTotalRuns(updatedTotal);

        const updatedNetProfit = parseFloat((netProfitRef.current + profit).toFixed(2));
        netProfitRef.current = updatedNetProfit;
        setNetProfit(updatedNetProfit);

        let newStake = currentStakeRef.current;
        let newConsecutiveLosses = consecutiveLossesRef.current;

        if (won) {
          setWonRuns((w) => w + 1);
          newConsecutiveLosses = 0;
          consecutiveLossesRef.current = 0;
          setConsecutiveLosses(0);

          toast.success(`Trade Won! +$${profit.toFixed(2)}`, {
            description: `Contract #${contractId} won.`,
          });

          // Money management on WIN
          if (settingsRef.current.moneyManagement === 'martingale') {
            newStake = settingsRef.current.baseStake;
          } else if (settingsRef.current.moneyManagement === 'dalembert') {
            newStake = Math.max(
              settingsRef.current.baseStake,
              parseFloat((currentStakeRef.current - settingsRef.current.baseStake).toFixed(2))
            );
          }
        } else {
          setLostRuns((l) => l + 1);
          newConsecutiveLosses = consecutiveLossesRef.current + 1;
          consecutiveLossesRef.current = newConsecutiveLosses;
          setConsecutiveLosses(newConsecutiveLosses);

          toast.error(`Trade Lost: -$${Math.abs(profit).toFixed(2)}`, {
            description: `Contract #${contractId} lost.`,
          });

          // Money management on LOSS
          if (settingsRef.current.moneyManagement === 'martingale') {
            newStake = parseFloat(
              (currentStakeRef.current * settingsRef.current.martingaleMultiplier).toFixed(2)
            );
          } else if (settingsRef.current.moneyManagement === 'dalembert') {
            newStake = parseFloat(
              (currentStakeRef.current + settingsRef.current.baseStake).toFixed(2)
            );
          }
        }

        setCurrentStake(newStake);
        currentStakeRef.current = newStake;
        setStake(newStake.toString());

        // Update log
        setLogs((prev) =>
          prev.map((log) => {
            if (log.contractId === contractId) {
              return {
                ...log,
                profit,
                status: won ? 'WON' : 'LOST',
              };
            }
            return log;
          })
        );

        // Check Risk Management Triggers
        const { takeProfit, stopLoss, maxConsecutiveLosses, maxRuns } = settingsRef.current;

        if (takeProfit > 0 && updatedNetProfit >= takeProfit) {
          setIsRunning(false);
          isRunningRef.current = false;
          setBotStatus('stopped_take_profit');
          setStatusMessage(`🎯 Target Take Profit reached (+$${updatedNetProfit.toFixed(2)})! Bot halted safely.`);
          playProfitLimitSound();
          toast.success('Take Profit Target Reached!', {
            description: `Session goal of +$${takeProfit} reached. Total: +$${updatedNetProfit.toFixed(2)}`,
          });
          return;
        }

        if (stopLoss > 0 && updatedNetProfit <= -stopLoss) {
          setIsRunning(false);
          isRunningRef.current = false;
          setBotStatus('stopped_stop_loss');
          setStatusMessage(`⚠️ Stop Loss threshold hit (-$${Math.abs(updatedNetProfit).toFixed(2)}). Bot halted.`);
          playLossLimitSound();
          toast.error('Stop Loss Hit', {
            description: `Loss limit of -$${stopLoss} reached. Capital preserved.`,
          });
          return;
        }

        if (maxConsecutiveLosses > 0 && newConsecutiveLosses >= maxConsecutiveLosses) {
          setIsRunning(false);
          isRunningRef.current = false;
          setBotStatus('stopped_max_losses');
          setStatusMessage(`⚠️ Max consecutive losses limit (${maxConsecutiveLosses}) reached. Safety shutdown.`);
          playLossLimitSound();
          toast.error('Consecutive Losses Safety', {
            description: `Hit ${maxConsecutiveLosses} losses in a row. Bot stopped.`,
          });
          return;
        }

        if (maxRuns > 0 && updatedTotal >= maxRuns) {
          setIsRunning(false);
          isRunningRef.current = false;
          setBotStatus('stopped_max_runs');
          setStatusMessage(`🏁 Session completed: ${maxRuns} total runs executed.`);
          toast.info('Session Finished', {
            description: `Completed ${maxRuns} trades. Net P/L: $${updatedNetProfit.toFixed(2)}`,
          });
          return;
        }

        if (!isRunningRef.current) {
          setBotStatus('stopped');
          setStatusMessage('Bot stopped after settling active contract.');
          return;
        }

        // Cooldown before next trade
        const cooldown = Math.max(1, settingsRef.current.cooldownSeconds);
        setBotStatus('cooldown');
        setStatusMessage(`Settled (${won ? 'WON' : 'LOST'}). Next trade in ${cooldown}s (Stake: $${newStake})...`);

        cooldownTimerRef.current = setTimeout(() => {
          if (isRunningRef.current) {
            setBotStatus('analyzing');
            setStatusMessage('Analyzing signal for next trade entry...');
          }
        }, cooldown * 1000);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [ws, isConnected, isAuthenticated, setStake]);

  // Auto-resume analyzing when proposal arrives while waiting
  useEffect(() => {
    if (isRunning && botStatus === 'waiting_proposal' && proposal) {
      setBotStatus('analyzing');
    }
  }, [isRunning, botStatus, proposal]);

  // Live 1-second trading condition log ticker (one condition per second, no duplicates at same time, appears at top)
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      const pts = pricesRef.current;
      if (pts.length === 0) return;
      const currentPrice = pts[pts.length - 1];
      const strat = settingsRef.current.strategy.replace('_', ' ').toUpperCase();
      const stats = volatilityStats;
      const timeStr = new Date().toLocaleTimeString();

      const conditionText = `[${timeStr}] Strategy: ${strat} | Price: ${currentPrice.toFixed(2)} | Mean: ${stats.mean.toFixed(2)} | Dev: ${stats.deviation.toFixed(2)}`;

      setLogs((prev) => {
        if (prev.length > 0 && prev[0].details === conditionText) {
          return prev; // do not double print same value at the same time
        }
        const newEntry: BotLogEntry = {
          id: `cond-${Date.now()}`,
          time: timeStr,
          symbol: activeSymbol?.underlying_symbol_name || activeSymbol?.underlying_symbol || 'Market',
          direction: directionRef.current,
          stake: currentStakeRef.current,
          status: 'INFO',
          details: conditionText,
          strategyUsed: strat,
        };
        return [newEntry, ...prev.slice(0, 99)];
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, volatilityStats, activeSymbol]);

  // Main automated execution loop
  useEffect(() => {
    if (!isRunning) return;
    if (activeContractIdRef.current !== null) return;
    if (isBuying) return;
    if (botStatus !== 'analyzing') return;

    let cancelled = false;

    const executeNextTrade = async () => {
      const nextDir = await determineNextDirection();
      if (cancelled || !isRunningRef.current) return;

      if (directionRef.current !== nextDir) {
        setDirection(nextDir);
        directionRef.current = nextDir;
      }

      const expectedStake = currentStakeRef.current.toString();
      if (stake !== expectedStake) {
        setStake(expectedStake);
      }

      const p = proposalRef.current;
      if (!p) {
        setBotStatus('waiting_proposal');
        setStatusMessage(`Waiting for quote on ${nextDir} ($${currentStakeRef.current})...`);
        return;
      }

      const isMatchingStake = Math.abs(p.askPrice - currentStakeRef.current) < 0.1;
      if (!isMatchingStake) {
        setBotStatus('waiting_proposal');
        setStatusMessage(`Syncing contract proposal for ${nextDir} ($${currentStakeRef.current})...`);
        return;
      }

      setBotStatus('buying');
      setStatusMessage(`Placing automated ${nextDir} trade (Stake: $${currentStakeRef.current}, Payout: $${p.payout.toFixed(2)})...`);

      buyContract().catch((err) => {
        console.error('[useAutoTradingBot] buy error:', err);
        setBotStatus('error');
        setStatusMessage('Order submission failed. Retrying shortly...');
      });
    };

    executeNextTrade();

    return () => {
      cancelled = true;
    };
  }, [
    isRunning,
    botStatus,
    isBuying,
    proposal,
    direction,
    stake,
    allowEquals,
    determineNextDirection,
    setDirection,
    setStake,
    buyContract,
  ]);

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
      }
    };
  }, []);

  const winRate = totalRuns > 0 ? Math.round((wonRuns / totalRuns) * 100) : 0;

  return {
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
    activeContractId,
    aiSignal,
    volatilityStats,
    startBot,
    stopBot,
    resetStats,
    clearLogs,
    triggerAiAnalysis,
  };
}
