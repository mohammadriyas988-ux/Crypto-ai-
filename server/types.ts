export interface Candle {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Ticker24h {
  symbol: string;
  name: string;
  baseAsset: string;
  quoteAsset: string;
  lastPrice: number;
  priceChange: number;
  priceChangePercent: number;
  highPrice: number;
  lowPrice: number;
  volume24h: number;
  quoteVolume24h: number;
  timestamp: number;
  dataSource: 'BINANCE_LIVE' | 'BINANCE_FALLBACK' | 'CACHED';
  isDelayed: boolean;
  category?: 'MAJORS' | 'LAYER1' | 'LAYER2' | 'DEFI' | 'AI_DATA' | 'MEMES' | 'INFRA';
}

export interface IndicatorEMA {
  ema9: number;
  ema21: number;
  ema50: number;
  ema200: number;
  trend: 'STRONG_BULLISH' | 'BULLISH' | 'BEARISH' | 'STRONG_BEARISH' | 'NEUTRAL';
  goldenCross: boolean; // 50 crossed above 200
  deathCross: boolean;  // 50 crossed below 200
}

export interface IndicatorRSI {
  rsi14: number;
  condition: 'OVERSOLD' | 'OVERBOUGHT' | 'NEUTRAL';
  signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

export interface IndicatorMACD {
  macdLine: number;
  signalLine: number;
  histogram: number;
  crossover: 'BULLISH_CROSS' | 'BEARISH_CROSS' | 'NONE';
}

export interface SupportResistance {
  supports: number[];
  resistances: number[];
  nearestSupport: number;
  nearestResistance: number;
}

export interface FibonacciLevels {
  high: number;
  low: number;
  fib0: number;
  fib236: number;
  fib382: number;
  fib500: number;
  fib618: number; // Golden Pocket
  fib786: number;
  fib100: number;
}

export interface FairValueGap {
  top: number;
  bottom: number;
  type: 'BULLISH' | 'BEARISH';
  time: number;
  mitigated: boolean;
}

export interface OrderBlock {
  high: number;
  low: number;
  type: 'BULLISH' | 'BEARISH';
  time: number;
}

export interface SmartMoneyConcepts {
  marketBias: 'BULLISH' | 'BEARISH' | 'CONSOLIDATION';
  bos: Array<{ price: number; type: 'BULLISH' | 'BEARISH'; time: number }>;
  choch: Array<{ price: number; type: 'BULLISH' | 'BEARISH'; time: number }>;
  fairValueGaps: FairValueGap[];
  orderBlocks: OrderBlock[];
  liquidityPools: {
    buySideLiquidity: number; // BSL swing high
    sellSideLiquidity: number; // SSL swing low
  };
}

export interface TechnicalAnalysisResult {
  symbol: string;
  timeframe: string;
  currentPrice: number;
  timestamp: number;
  ema: IndicatorEMA;
  rsi: IndicatorRSI;
  macd: IndicatorMACD;
  supportResistance: SupportResistance;
  fibonacci: FibonacciLevels;
  smc: SmartMoneyConcepts;
  compositeScore: number; // 0 - 100
  recommendation: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';
  riskLabel: 'HIGH_RISK' | 'MODERATE_RISK' | 'LOW_RISK';
}

export type PredictionDirection = 'BULLISH' | 'BEARISH' | 'NEUTRAL';
export type PredictionStatus = 'PENDING' | 'WIN' | 'LOSS' | 'INVALIDATED';

export interface Prediction {
  id: string;
  symbol: string;
  createdTimestamp: number;
  horizonHours: number;
  horizonTimestamp: number;
  direction: PredictionDirection;
  entryPrice: number;
  targetPrice: number;
  invalidationPrice: number;
  confidencePercent: number;
  rationale: string;
  keyFactors: string[];
  status: PredictionStatus;
  evaluatedAt?: number;
  evaluationPrice?: number;
  actualReturnPercent?: number;
  isAiGenerated: boolean;
}

export interface PaperPosition {
  id: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  quantity: number;
  amountUsd: number;
  leverage: number;
  stopLoss?: number;
  takeProfit?: number;
  openedAt: number;
  currentPrice: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  marginUsed: number;
}

export interface PaperTradeHistory {
  id: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  amountUsd: number;
  leverage: number;
  realizedPnl: number;
  feeUsd: number;
  slippageUsd: number;
  openedAt: number;
  closedAt: number;
  exitReason: 'TAKE_PROFIT' | 'STOP_LOSS' | 'MANUAL' | 'LIQUIDATION';
}

export interface PaperAccount {
  balanceUsd: number;
  initialBalanceUsd: number;
  equityUsd: number;
  totalRealizedPnl: number;
  totalFeesPaid: number;
  totalSlippagePaid: number;
  openPositions: PaperPosition[];
  tradeHistory: PaperTradeHistory[];
  maxDrawdownPercent: number;
  peakEquityUsd: number;
}

export interface BacktestTrade {
  entryTime: number;
  exitTime: number;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  exitPrice: number;
  pnlPercent: number;
  pnlUsd: number;
  reason: 'TP' | 'SL' | 'EXIT_SIGNAL';
}

export interface BacktestResult {
  id: string;
  strategyName: string;
  symbol: string;
  timeframe: string;
  startDate: string;
  endDate: string;
  initialBalance: number;
  finalBalance: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRatePercent: number;
  profitFactor: number;
  netProfitUsd: number;
  netProfitPercent: number;
  maxDrawdownPercent: number;
  trades: BacktestTrade[];
  equityCurve: Array<{ time: number; equity: number }>;
}

export interface AppSettings {
  initialPaperBalance: number;
  makerFeePercent: number;
  takerFeePercent: number;
  simulatedSlippagePercent: number;
  defaultRiskPercentage: number;
  currency: string;
  refreshIntervalSeconds: number;
}
