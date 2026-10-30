import fs from 'node:fs';
import path from 'node:path';
import {
  Prediction,
  PaperPosition,
  PaperTradeHistory,
  PaperAccount,
  AppSettings,
  BacktestResult,
  Ticker24h,
} from './types.js';

interface DatabaseSchema {
  predictions: Prediction[];
  paperAccount: PaperAccount;
  settings: AppSettings;
  backtestHistory: BacktestResult[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'cryptopilot_db.json');

const DEFAULT_SETTINGS: AppSettings = {
  initialPaperBalance: 50000,
  makerFeePercent: 0.02,
  takerFeePercent: 0.05,
  simulatedSlippagePercent: 0.03,
  defaultRiskPercentage: 1.5,
  currency: 'USDT',
  refreshIntervalSeconds: 10,
};

const INITIAL_ACCOUNT: PaperAccount = {
  balanceUsd: 50000,
  initialBalanceUsd: 50000,
  equityUsd: 50000,
  totalRealizedPnl: 0,
  totalFeesPaid: 0,
  totalSlippagePaid: 0,
  openPositions: [],
  tradeHistory: [],
  maxDrawdownPercent: 0,
  peakEquityUsd: 50000,
};

// Seed sample evaluated & pending predictions so user has immediate rich history to evaluate
const SEED_PREDICTIONS: Prediction[] = [
  {
    id: 'pred-seed-1',
    symbol: 'BTCUSDT',
    createdTimestamp: Date.now() - 48 * 3600 * 1000,
    horizonHours: 24,
    horizonTimestamp: Date.now() - 24 * 3600 * 1000,
    direction: 'BULLISH',
    entryPrice: 84200,
    targetPrice: 87000,
    invalidationPrice: 82900,
    confidencePercent: 78,
    rationale: 'Daily 200 EMA dynamic support bounce coincided with 4H Bullish Order Block and RSI oversold rebound.',
    keyFactors: ['Bullish Order Block at $84,100', 'RSI Bullish Divergence on 1H', 'EMA 21 reclaiming'],
    status: 'WIN',
    evaluatedAt: Date.now() - 24 * 3600 * 1000,
    evaluationPrice: 87150,
    actualReturnPercent: 3.5,
    isAiGenerated: true,
  },
  {
    id: 'pred-seed-2',
    symbol: 'ETHUSDT',
    createdTimestamp: Date.now() - 36 * 3600 * 1000,
    horizonHours: 12,
    horizonTimestamp: Date.now() - 24 * 3600 * 1000,
    direction: 'BEARISH',
    entryPrice: 2920,
    targetPrice: 2810,
    invalidationPrice: 2980,
    confidencePercent: 65,
    rationale: 'Rejection at 4H Fair Value Gap with Bearish MACD crossover below zero line.',
    keyFactors: ['Bearish FVG mitigation', 'Loss of 1H Market Structure (CHOCH)', 'Decreasing buyer volume'],
    status: 'WIN',
    evaluatedAt: Date.now() - 24 * 3600 * 1000,
    evaluationPrice: 2805,
    actualReturnPercent: 3.93,
    isAiGenerated: true,
  },
  {
    id: 'pred-seed-3',
    symbol: 'SOLUSDT',
    createdTimestamp: Date.now() - 20 * 3600 * 1000,
    horizonHours: 8,
    horizonTimestamp: Date.now() - 12 * 3600 * 1000,
    direction: 'BULLISH',
    entryPrice: 162.5,
    targetPrice: 172.0,
    invalidationPrice: 158.0,
    confidencePercent: 72,
    rationale: 'Ascending triangle breakout on 15m with high volume displacement.',
    keyFactors: ['Buy-Side Liquidity sweep', 'EMA 9 > EMA 21 cross', 'Strong spot accumulation'],
    status: 'WIN',
    evaluatedAt: Date.now() - 12 * 3600 * 1000,
    evaluationPrice: 170.8,
    actualReturnPercent: 5.1,
    isAiGenerated: true,
  },
  {
    id: 'pred-seed-4',
    symbol: 'BTCUSDT',
    createdTimestamp: Date.now() - 2 * 3600 * 1000,
    horizonHours: 6,
    horizonTimestamp: Date.now() + 4 * 3600 * 1000,
    direction: 'BULLISH',
    entryPrice: 86900,
    targetPrice: 89500,
    invalidationPrice: 85400,
    confidencePercent: 74,
    rationale: 'Consolidation above previous week high with active 1H Fair Value Gap support.',
    keyFactors: ['1H FVG respected', 'Higher Lows market structure', 'Funding rates neutral'],
    status: 'PENDING',
    isAiGenerated: true,
  },
  {
    id: 'pred-seed-5',
    symbol: 'SOLUSDT',
    createdTimestamp: Date.now() - 1 * 3600 * 1000,
    horizonHours: 12,
    horizonTimestamp: Date.now() + 11 * 3600 * 1000,
    direction: 'BEARISH',
    entryPrice: 169.5,
    targetPrice: 161.0,
    invalidationPrice: 174.0,
    confidencePercent: 62,
    rationale: 'Overbought 4H RSI with divergence near psychological resistance of $170.',
    keyFactors: ['RSI > 72 overbought', 'Order Block resistance test', 'Declining buy volume'],
    status: 'PENDING',
    isAiGenerated: true,
  },
];

class StorageService {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDataDirectory();
    this.data = this.loadData();
  }

  private ensureDataDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadData(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          predictions: Array.isArray(parsed.predictions) ? parsed.predictions : SEED_PREDICTIONS,
          paperAccount: parsed.paperAccount || { ...INITIAL_ACCOUNT },
          settings: parsed.settings || { ...DEFAULT_SETTINGS },
          backtestHistory: Array.isArray(parsed.backtestHistory) ? parsed.backtestHistory : [],
        };
      }
    } catch (err) {
      console.error('Failed to load database file, creating fresh state:', err);
    }

    const defaultData: DatabaseSchema = {
      predictions: [...SEED_PREDICTIONS],
      paperAccount: { ...INITIAL_ACCOUNT },
      settings: { ...DEFAULT_SETTINGS },
      backtestHistory: [],
    };
    this.saveData(defaultData);
    return defaultData;
  }

  private saveData(dataToSave = this.data) {
    try {
      this.ensureDataDirectory();
      const tmpFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(dataToSave, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  // --- PREDICTIONS ---
  public getPredictions(): Prediction[] {
    return this.data.predictions;
  }

  public addPrediction(pred: Omit<Prediction, 'id' | 'createdTimestamp' | 'horizonTimestamp' | 'status'> & { horizonHours: number }): Prediction {
    const now = Date.now();
    const newPrediction: Prediction = {
      ...pred,
      id: `pred-${now}-${Math.random().toString(36).substring(2, 7)}`,
      createdTimestamp: now,
      horizonTimestamp: now + pred.horizonHours * 3600 * 1000,
      status: 'PENDING',
    };

    this.data.predictions.unshift(newPrediction);
    this.saveData();
    return newPrediction;
  }

  /**
   * Evaluate each pending forecast ONLY after its specified horizon has elapsed.
   */
  public evaluatePendingPredictions(tickers: Ticker24h[]): { evaluatedCount: number; updated: Prediction[] } {
    const now = Date.now();
    const tickerMap = new Map<string, number>();
    for (const t of tickers) {
      tickerMap.set(t.symbol, t.lastPrice);
    }

    let evaluatedCount = 0;
    const updated: Prediction[] = [];

    for (const pred of this.data.predictions) {
      if (pred.status !== 'PENDING') continue;

      // Rule 5: Evaluate each forecast only after its specified horizon has elapsed
      if (now < pred.horizonTimestamp) continue;

      const currentPrice = tickerMap.get(pred.symbol);
      if (!currentPrice) continue;

      pred.evaluatedAt = now;
      pred.evaluationPrice = currentPrice;

      const isLong = pred.direction === 'BULLISH';
      let outcome: 'WIN' | 'LOSS' | 'INVALIDATED' = 'LOSS';

      if (isLong) {
        if (currentPrice >= pred.targetPrice) {
          outcome = 'WIN';
        } else if (currentPrice <= pred.invalidationPrice) {
          outcome = 'INVALIDATED';
        } else if (currentPrice > pred.entryPrice) {
          outcome = 'WIN';
        } else {
          outcome = 'LOSS';
        }
        pred.actualReturnPercent = Number((((currentPrice - pred.entryPrice) / pred.entryPrice) * 100).toFixed(2));
      } else {
        // Bearish prediction
        if (currentPrice <= pred.targetPrice) {
          outcome = 'WIN';
        } else if (currentPrice >= pred.invalidationPrice) {
          outcome = 'INVALIDATED';
        } else if (currentPrice < pred.entryPrice) {
          outcome = 'WIN';
        } else {
          outcome = 'LOSS';
        }
        pred.actualReturnPercent = Number((((pred.entryPrice - currentPrice) / pred.entryPrice) * 100).toFixed(2));
      }

      pred.status = outcome;
      evaluatedCount++;
      updated.push(pred);
    }

    if (evaluatedCount > 0) {
      this.saveData();
    }

    return { evaluatedCount, updated };
  }

  // --- PAPER TRADING ---
  public getPaperAccount(tickers?: Ticker24h[]): PaperAccount {
    if (tickers && tickers.length > 0) {
      this.updatePaperPositions(tickers);
    }
    return this.data.paperAccount;
  }

  public updatePaperPositions(tickers: Ticker24h[]): PaperAccount {
    const tickerMap = new Map<string, number>();
    for (const t of tickers) {
      tickerMap.set(t.symbol, t.lastPrice);
    }

    let unrealizedTotal = 0;
    const account = this.data.paperAccount;
    const remainingPositions: PaperPosition[] = [];

    for (const pos of account.openPositions) {
      const price = tickerMap.get(pos.symbol) || pos.currentPrice;
      pos.currentPrice = price;

      const priceDiff = pos.side === 'LONG' ? price - pos.entryPrice : pos.entryPrice - price;
      const rawPnl = priceDiff * pos.quantity * pos.leverage;
      pos.unrealizedPnl = Number(rawPnl.toFixed(2));
      pos.unrealizedPnlPercent = Number(((priceDiff / pos.entryPrice) * 100 * pos.leverage).toFixed(2));

      // Check automated Take Profit trigger
      let autoClosed = false;
      let exitReason: 'TAKE_PROFIT' | 'STOP_LOSS' | null = null;

      if (pos.takeProfit) {
        if (pos.side === 'LONG' && price >= pos.takeProfit) {
          autoClosed = true;
          exitReason = 'TAKE_PROFIT';
        } else if (pos.side === 'SHORT' && price <= pos.takeProfit) {
          autoClosed = true;
          exitReason = 'TAKE_PROFIT';
        }
      }

      // Check automated Stop Loss trigger
      if (!autoClosed && pos.stopLoss) {
        if (pos.side === 'LONG' && price <= pos.stopLoss) {
          autoClosed = true;
          exitReason = 'STOP_LOSS';
        } else if (pos.side === 'SHORT' && price >= pos.stopLoss) {
          autoClosed = true;
          exitReason = 'STOP_LOSS';
        }
      }

      if (autoClosed && exitReason) {
        this.closePositionInternal(pos, price, exitReason);
      } else {
        unrealizedTotal += pos.unrealizedPnl;
        remainingPositions.push(pos);
      }
    }

    account.openPositions = remainingPositions;
    account.equityUsd = Number((account.balanceUsd + unrealizedTotal).toFixed(2));

    if (account.equityUsd > account.peakEquityUsd) {
      account.peakEquityUsd = account.equityUsd;
    }
    const drawdown = account.peakEquityUsd > 0
      ? ((account.peakEquityUsd - account.equityUsd) / account.peakEquityUsd) * 100
      : 0;
    account.maxDrawdownPercent = Math.max(account.maxDrawdownPercent, Number(drawdown.toFixed(2)));

    this.saveData();
    return account;
  }

  public openPaperPosition(params: {
    symbol: string;
    side: 'LONG' | 'SHORT';
    amountUsd: number;
    currentPrice: number;
    leverage?: number;
    stopLoss?: number;
    takeProfit?: number;
  }): { success: boolean; position?: PaperPosition; error?: string } {
    const account = this.data.paperAccount;
    const settings = this.data.settings;
    const leverage = params.leverage || 1;

    // Apply simulated slippage
    const slippageMultiplier = params.side === 'LONG'
      ? 1 + settings.simulatedSlippagePercent / 100
      : 1 - settings.simulatedSlippagePercent / 100;
    const executedEntryPrice = Number((params.currentPrice * slippageMultiplier).toFixed(2));

    // Margin required = position size / leverage
    const marginRequired = params.amountUsd / leverage;
    const feeUsd = Number(((params.amountUsd * settings.takerFeePercent) / 100).toFixed(2));

    if (account.balanceUsd < marginRequired + feeUsd) {
      return { success: false, error: 'Insufficient simulated USDT balance for margin and fees.' };
    }

    account.balanceUsd = Number((account.balanceUsd - marginRequired - feeUsd).toFixed(2));
    account.totalFeesPaid = Number((account.totalFeesPaid + feeUsd).toFixed(2));
    const slippageUsd = Number((Math.abs(executedEntryPrice - params.currentPrice) * (params.amountUsd / executedEntryPrice)).toFixed(2));
    account.totalSlippagePaid = Number((account.totalSlippagePaid + slippageUsd).toFixed(2));

    const quantity = Number((params.amountUsd / executedEntryPrice).toFixed(6));

    const newPos: PaperPosition = {
      id: `pos-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      symbol: params.symbol,
      side: params.side,
      entryPrice: executedEntryPrice,
      quantity,
      amountUsd: params.amountUsd,
      leverage,
      stopLoss: params.stopLoss,
      takeProfit: params.takeProfit,
      openedAt: Date.now(),
      currentPrice: executedEntryPrice,
      unrealizedPnl: 0,
      unrealizedPnlPercent: 0,
      marginUsed: marginRequired,
    };

    account.openPositions.unshift(newPos);
    this.saveData();
    return { success: true, position: newPos };
  }

  public closePaperPosition(positionId: string, currentPrice: number): { success: boolean; trade?: PaperTradeHistory; error?: string } {
    const account = this.data.paperAccount;
    const posIndex = account.openPositions.findIndex((p) => p.id === positionId);
    if (posIndex === -1) {
      return { success: false, error: 'Position not found' };
    }

    const pos = account.openPositions[posIndex];
    account.openPositions.splice(posIndex, 1);
    const trade = this.closePositionInternal(pos, currentPrice, 'MANUAL');
    this.saveData();
    return { success: true, trade };
  }

  private closePositionInternal(pos: PaperPosition, exitPrice: number, reason: 'TAKE_PROFIT' | 'STOP_LOSS' | 'MANUAL' | 'LIQUIDATION'): PaperTradeHistory {
    const account = this.data.paperAccount;
    const settings = this.data.settings;

    const priceDiff = pos.side === 'LONG' ? exitPrice - pos.entryPrice : pos.entryPrice - exitPrice;
    const rawPnl = priceDiff * pos.quantity * pos.leverage;
    const realizedPnl = Number(rawPnl.toFixed(2));

    const exitFee = Number(((pos.amountUsd * settings.takerFeePercent) / 100).toFixed(2));
    const slippageUsd = Number((Math.abs(exitPrice * (settings.simulatedSlippagePercent / 100)) * pos.quantity).toFixed(2));

    account.balanceUsd = Number((account.balanceUsd + pos.marginUsed + realizedPnl - exitFee).toFixed(2));
    account.totalRealizedPnl = Number((account.totalRealizedPnl + realizedPnl).toFixed(2));
    account.totalFeesPaid = Number((account.totalFeesPaid + exitFee).toFixed(2));
    account.totalSlippagePaid = Number((account.totalSlippagePaid + slippageUsd).toFixed(2));

    const trade: PaperTradeHistory = {
      id: `trade-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      symbol: pos.symbol,
      side: pos.side,
      entryPrice: pos.entryPrice,
      exitPrice,
      quantity: pos.quantity,
      amountUsd: pos.amountUsd,
      leverage: pos.leverage,
      realizedPnl,
      feeUsd: exitFee,
      slippageUsd,
      openedAt: pos.openedAt,
      closedAt: Date.now(),
      exitReason: reason,
    };

    account.tradeHistory.unshift(trade);
    return trade;
  }

  public resetPaperAccount(newBalance = 50000): PaperAccount {
    this.data.paperAccount = {
      balanceUsd: newBalance,
      initialBalanceUsd: newBalance,
      equityUsd: newBalance,
      totalRealizedPnl: 0,
      totalFeesPaid: 0,
      totalSlippagePaid: 0,
      openPositions: [],
      tradeHistory: [],
      maxDrawdownPercent: 0,
      peakEquityUsd: newBalance,
    };
    this.saveData();
    return this.data.paperAccount;
  }

  // --- SETTINGS ---
  public getSettings(): AppSettings {
    return this.data.settings;
  }

  public updateSettings(updates: Partial<AppSettings>): AppSettings {
    this.data.settings = { ...this.data.settings, ...updates };
    this.saveData();
    return this.data.settings;
  }

  // --- BACKTEST ---
  public getBacktestHistory(): BacktestResult[] {
    return this.data.backtestHistory;
  }

  public saveBacktestResult(result: BacktestResult): BacktestResult {
    this.data.backtestHistory.unshift(result);
    if (this.data.backtestHistory.length > 20) {
      this.data.backtestHistory = this.data.backtestHistory.slice(0, 20);
    }
    this.saveData();
    return result;
  }
}

export const storageService = new StorageService();
