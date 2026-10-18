'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { DerivWS, ProposalInfo, BuyResult, ActiveSymbol } from '@deriv/core';
import type { Direction, DurationSelectUnit, DurationOption } from '../lib/types';

export type BotStrategy =
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
  status: 'PENDING' | 'WON' | 'LOST' | 'ERROR';
  details?: string;
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
}

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
  startBot: () => void;
  stopBot: () => void;
  resetStats: () => void;
  clearLogs: () => void;
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

  const [settings, setSettings] = useState<BotSettings>({
    strategy: 'trend_following',
    moneyManagement: 'martingale',
    baseStake: 10,
    martingaleMultiplier: 2.0,
    takeProfit: 50,
    stopLoss: 50,
    maxConsecutiveLosses: 5,
    maxRuns: 20,
    cooldownSeconds: 2,
  });

  const [currentStake, setCurrentStake] = useState<number>(settings.baseStake);
  const [totalRuns, setTotalRuns] = useState(0);
  const [wonRuns, setWonRuns] = useState(0);
  const [lostRuns, setLostRuns] = useState(0);
  const [consecutiveLosses, setConsecutiveLosses] = useState(0);
  const [netProfit, setNetProfit] = useState(0);
  const [logs, setLogs] = useState<BotLogEntry[]>([]);
  const [activeContractId, setActiveContractId] = useState<number | null>(null);

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

  const updateSettings = useCallback((partial: Partial<BotSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      // If base stake changes and bot is idle, sync current stake
      if (partial.baseStake !== undefined && !isRunningRef.current) {
        setCurrentStake(partial.baseStake);
        setStake(partial.baseStake.toString());
      }
      return next;
    });
  }, [setStake]);

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
    setStatusMessage('Bot statistics have been reset.');
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
    setStatusMessage('Bot activated. Analyzing market signals for first entry...');
    toast.success('Auto Trading Bot Started', {
      description: `Strategy: ${settingsRef.current.strategy.replace('_', ' ').toUpperCase()} | Base Stake: $${base}`,
    });
  }, [isAuthenticated, isConnected, onRequireAuth, setStake]);

  // Determine next direction according to strategy
  const determineNextDirection = useCallback((): Direction => {
    const strat = settingsRef.current.strategy;
    if (strat === 'fixed_rise') return 'CALL';
    if (strat === 'fixed_fall') return 'PUT';
    if (strat === 'alternating') {
      return directionRef.current === 'CALL' ? 'PUT' : 'CALL';
    }

    const pts = pricesRef.current;
    if (pts.length >= 2) {
      const last = pts[pts.length - 1];
      const prev = pts[pts.length - 2];
      const isUp = last >= prev;
      if (strat === 'trend_following') {
        return isUp ? 'CALL' : 'PUT';
      }
      if (strat === 'contrarian') {
        return isUp ? 'PUT' : 'CALL';
      }
    }

    return directionRef.current || 'CALL';
  }, []);

  // When buyResult arrives, record active contract and log
  useEffect(() => {
    if (!buyResult || !isRunningRef.current) return;

    setActiveContractId(buyResult.contractId);
    activeContractIdRef.current = buyResult.contractId;
    setBotStatus('contract_running');
    setStatusMessage(`Contract #${buyResult.contractId} running. Waiting for expiry...`);

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
    };

    setLogs((prev) => [newLog, ...prev.slice(0, 99)]);
  }, [buyResult, activeSymbol]);

  // Handle buy errors while bot is running
  useEffect(() => {
    if (!buyError || !isRunningRef.current) return;

    toast.error('Bot Trade Error', { description: buyError });
    setBotStatus('error');
    setStatusMessage(`Trade execution error: ${buyError}. Retrying in 4 seconds...`);

    // Cooldown before retrying
    cooldownTimerRef.current = setTimeout(() => {
      if (isRunningRef.current) {
        setBotStatus('analyzing');
        setStatusMessage('Resuming analysis after error recovery...');
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
        // Contract has concluded!
        const profit = parseFloat(String(contract.profit ?? '0'));
        const won = profit > 0;
        const buyPrice = parseFloat(String(contract.buy_price ?? currentStakeRef.current));

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

          toast.success(`Bot Trade Won! +$${profit.toFixed(2)}`, {
            description: `Contract #${contractId} won.`,
          });

          // Money management adjustments on WIN
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

          toast.error(`Bot Trade Lost: -$${Math.abs(profit).toFixed(2)}`, {
            description: `Contract #${contractId} lost.`,
          });

          // Money management adjustments on LOSS
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

        // Update log entry
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
          setStatusMessage(`🎉 Target Take Profit reached: +$${updatedNetProfit.toFixed(2)}! Bot has stopped.`);
          toast.success('Take Profit Reached!', {
            description: `Session target of +$${takeProfit} achieved. Total: +$${updatedNetProfit.toFixed(2)}`,
          });
          return;
        }

        if (stopLoss > 0 && updatedNetProfit <= -stopLoss) {
          setIsRunning(false);
          isRunningRef.current = false;
          setBotStatus('stopped_stop_loss');
          setStatusMessage(`⚠️ Stop Loss limit reached: -$${Math.abs(updatedNetProfit).toFixed(2)}. Bot has stopped to protect capital.`);
          toast.error('Stop Loss Hit', {
            description: `Loss limit of -$${stopLoss} reached. Bot halted.`,
          });
          return;
        }

        if (maxConsecutiveLosses > 0 && newConsecutiveLosses >= maxConsecutiveLosses) {
          setIsRunning(false);
          isRunningRef.current = false;
          setBotStatus('stopped_max_losses');
          setStatusMessage(`⚠️ Max consecutive losses limit (${maxConsecutiveLosses}) reached. Bot has stopped.`);
          toast.error('Consecutive Losses Limit', {
            description: `Safety threshold reached (${maxConsecutiveLosses} losses in a row). Bot halted.`,
          });
          return;
        }

        if (maxRuns > 0 && updatedTotal >= maxRuns) {
          setIsRunning(false);
          isRunningRef.current = false;
          setBotStatus('stopped_max_runs');
          setStatusMessage(`🏁 Max scheduled runs reached (${maxRuns} trades). Bot has completed session.`);
          toast.info('Session Finished', {
            description: `Completed ${maxRuns} automated trades. Net P/L: $${updatedNetProfit.toFixed(2)}`,
          });
          return;
        }

        // If user requested stop during trade:
        if (!isRunningRef.current) {
          setBotStatus('stopped');
          setStatusMessage('Bot stopped after settling active contract.');
          return;
        }

        // If still active, enter cooldown before next trade
        const cooldown = Math.max(1, settingsRef.current.cooldownSeconds);
        setBotStatus('cooldown');
        setStatusMessage(`Trade finished (${won ? 'WON' : 'LOST'}). Next trade in ${cooldown}s with stake $${newStake}...`);

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

  // Main automated execution loop
  useEffect(() => {
    if (!isRunning) return;
    if (activeContractIdRef.current !== null) return;
    if (isBuying) return;
    if (botStatus !== 'analyzing') return;

    // Pick next direction
    const nextDir = determineNextDirection();
    if (directionRef.current !== nextDir) {
      setDirection(nextDir);
      directionRef.current = nextDir;
    }

    // Ensure stake string matches currentStake
    const expectedStake = currentStakeRef.current.toString();
    if (stake !== expectedStake) {
      setStake(expectedStake);
    }

    // Check if proposal matches
    const expectedContractType = allowEquals ? `${nextDir}E` : nextDir;
    const p = proposalRef.current;

    if (!p) {
      setBotStatus('waiting_proposal');
      setStatusMessage(`Waiting for quote on ${nextDir} ($${currentStakeRef.current})...`);
      return;
    }

    // Verify proposal matches target stake
    const isMatchingStake = Math.abs(p.askPrice - currentStakeRef.current) < 0.1;

    if (!isMatchingStake) {
      setBotStatus('waiting_proposal');
      setStatusMessage(`Syncing contract proposal for ${nextDir} ($${currentStakeRef.current})...`);
      return;
    }

    // Ready to execute trade!
    setBotStatus('buying');
    setStatusMessage(`Placing automated ${nextDir} trade (Stake: $${currentStakeRef.current}, Payout: $${p.payout.toFixed(2)})...`);

    buyContract().catch((err) => {
      console.error('[useAutoTradingBot] buy error:', err);
      setBotStatus('error');
      setStatusMessage('Order submission failed. Retrying shortly...');
    });
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

  // Clean up timers on unmount
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
    startBot,
    stopBot,
    resetStats,
    clearLogs,
  };
}
