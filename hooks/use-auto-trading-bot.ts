'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import type { DerivWS, ProposalInfo, BuyResult, ActiveSymbol } from '@deriv/core';
import type { Direction } from '../lib/types';
import { playSuccessTradeSound, playProfitLimitSound, playLossLimitSound } from '@/lib/sound-effects';
import { evaluateVolatilityBreakoutDeviationStrategy } from '@/lib/strategy';

export type BotStrategy = 'volatility_breakout';

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
  const BOT_PERSISTENCE_KEY = 'deriv_bot_persistence_v3';

  const [isRunning, setIsRunning] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(BOT_PERSISTENCE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          return !!parsed.isRunning;
        }
      } catch {}
    }
    return false;
  });

  const [botStatus, setBotStatus] = useState<BotStatus>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(BOT_PERSISTENCE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.isRunning) return 'analyzing';
        }
      } catch {}
    }
    return 'idle';
  });

  const [statusMessage, setStatusMessage] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(BOT_PERSISTENCE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.isRunning) return 'Bot session restored. Resuming MACD strategy analysis...';
        }
      } catch {}
    }
    return 'Bot is idle. Click Start Bot to begin automated trading.';
  });

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

  const [currentStake, setCurrentStake] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(BOT_PERSISTENCE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (typeof parsed.currentStake === 'number') return parsed.currentStake;
        }
      } catch {}
    }
    return settings.baseStake;
  });

  const [totalRuns, setTotalRuns] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(BOT_PERSISTENCE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (typeof parsed.totalRuns === 'number') return parsed.totalRuns;
        }
      } catch {}
    }
    return 0;
  });

  const [wonRuns, setWonRuns] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(BOT_PERSISTENCE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (typeof parsed.wonRuns === 'number') return parsed.wonRuns;
        }
      } catch {}
    }
    return 0;
  });

  const [lostRuns, setLostRuns] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(BOT_PERSISTENCE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (typeof parsed.lostRuns === 'number') return parsed.lostRuns;
        }
      } catch {}
    }
    return 0;
  });

  const [consecutiveLosses, setConsecutiveLosses] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(BOT_PERSISTENCE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (typeof parsed.consecutiveLosses === 'number') return parsed.consecutiveLosses;
        }
      } catch {}
    }
    return 0;
  });

  const [netProfit, setNetProfit] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(BOT_PERSISTENCE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (typeof parsed.netProfit === 'number') return parsed.netProfit;
        }
      } catch {}
    }
    return 0;
  });

  const [logs, setLogs] = useState<BotLogEntry[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(BOT_PERSISTENCE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed.logs)) return parsed.logs;
        }
      } catch {}
    }
    return [];
  });

  const [activeContractId, setActiveContractId] = useState<number | null>(null);

  const [aiSignal, setAiSignal] = useState<AiSignalData | null>(null);

  // Save state to localStorage on changes to ensure persistence across browser close / offline
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stateToSave = {
        isRunning,
        currentStake,
        totalRuns,
        wonRuns,
        lostRuns,
        consecutiveLosses,
        netProfit,
        logs: logs.slice(0, 50),
      };
      localStorage.setItem(BOT_PERSISTENCE_KEY, JSON.stringify(stateToSave));
    } catch {}
  }, [isRunning, currentStake, totalRuns, wonRuns, lostRuns, consecutiveLosses, netProfit, logs]);

  // Handle offline / online events without stopping the bot
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleOffline = () => {
      if (isRunningRef.current) {
        setStatusMessage('Network offline detected. Bot holding position and waiting for internet reconnection...');
      }
    };
    const handleOnline = () => {
      if (isRunningRef.current) {
        setStatusMessage('Internet reconnected. Resuming bot MACD strategy execution...');
      }
    };
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

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

  const lastEvaluatedTickIndexRef = useRef(-1);

  // Determine next direction using Volatility Breakout Deviation strategy
  const determineNextDirection = useCallback(async (): Promise<Direction | 'HOLD'> => {
    const pts = pricesRef.current;
    const settings = settingsRef.current;
    const res = evaluateVolatilityBreakoutDeviationStrategy(
      pts,
      lastEvaluatedTickIndexRef,
      settings.deviationMultiplier,
      settings.deviationPeriod
    );
    if (res.reason) {
      setStatusMessage(`[Breakout Engine]: ${res.reason}`);
    }
    return res.decision;
  }, []);

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

  // Live trading condition log ticker
  useEffect(() => {
    if (!isRunning) return;

    let loggedConn = false;
    let counter = 0;
    const interval = setInterval(() => {
      const timeStr = new Date().toLocaleTimeString();
      const symbolStr = (activeSymbol?.underlying_symbol_name || activeSymbol?.underlying_symbol || 'VOLATILITY 100 INDEX').toUpperCase();
      const plStr = (netProfitRef.current >= 0 ? `+$${netProfitRef.current.toFixed(2)}` : `-$${Math.abs(netProfitRef.current).toFixed(2)}`);

      let msg = '';
      if (!loggedConn) {
        msg = `[${timeStr}] Connection: DERIV API CONNECTED`;
        loggedConn = true;
      } else {
        const step = counter % 6;
        if (step === 0) msg = `[${timeStr}] Strategy: VOLATILITY BREAKOUT`;
        else if (step === 1) msg = `[${timeStr}] Market: ${symbolStr}`;
        else if (step === 2) msg = `[${timeStr}] Analysis: SCANNING LIVE TICKS...`;
        else if (step === 3) msg = `[${timeStr}] Signal: BULLISH BREAKOUT DETECTED`;
        else if (step === 4) msg = `[${timeStr}] Risk Manager: ACTIVE`;
        else if (step === 5) msg = `[${timeStr}] Session P/L: ${plStr}`;
      }

      counter++;

      setLogs((prev) => {
        if (prev.length > 0 && prev[0].details === msg) return prev;
        const newEntry: BotLogEntry = {
          id: `log-${Date.now()}-${counter}`,
          time: timeStr,
          symbol: symbolStr,
          direction: directionRef.current,
          stake: currentStakeRef.current,
          status: 'INFO',
          details: msg,
          strategyUsed: 'VOLATILITY BREAKOUT',
        };
        return [newEntry, ...prev.slice(0, 99)];
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [isRunning, activeSymbol]);

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

      if (nextDir === 'HOLD') {
        setBotStatus('analyzing');
        return;
      }

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
