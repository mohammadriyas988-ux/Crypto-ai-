import { Candle, BacktestResult, BacktestTrade, AppSettings } from './types.js';
import { calculateEMA, calculateRSI, calculateMACD } from './analysisEngine.js';

export function runBacktest(params: {
  strategyName: string;
  symbol: string;
  timeframe: string;
  candles: Candle[];
  settings: AppSettings;
  initialBalance?: number;
}): BacktestResult {
  const { strategyName, symbol, timeframe, candles, settings } = params;
  const initialBalance = params.initialBalance || 10000;
  const trades: BacktestTrade[] = [];
  const equityCurve: Array<{ time: number; equity: number }> = [];

  let currentBalance = initialBalance;
  let peakBalance = initialBalance;
  let maxDrawdown = 0;

  equityCurve.push({
    time: candles[0]?.time || Math.floor(Date.now() / 1000),
    equity: initialBalance,
  });

  const closes = candles.map((c) => c.close);
  const ema9 = calculateEMA(closes, 9);
  const ema21 = calculateEMA(closes, 21);
  const ema50 = calculateEMA(closes, 50);

  const feeRate = (settings.takerFeePercent / 100);
  const slippageRate = (settings.simulatedSlippagePercent / 100);

  let inPosition = false;
  let entryPrice = 0;
  let entryTime = 0;
  let positionSide: 'LONG' | 'SHORT' = 'LONG';
  let stopLoss = 0;
  let takeProfit = 0;
  const riskPerTradeUsd = initialBalance * 0.02; // 2% risk rule

  for (let i = 25; i < candles.length - 1; i++) {
    const c = candles[i];
    const prevC = candles[i - 1];

    if (!inPosition) {
      let signal: 'LONG' | 'SHORT' | null = null;

      if (strategyName === 'EMA_CROSSOVER') {
        // Bullish 9 / 21 cross above 50
        if (ema9[i - 1] <= ema21[i - 1] && ema9[i] > ema21[i] && c.close > ema50[i]) {
          signal = 'LONG';
        } else if (ema9[i - 1] >= ema21[i - 1] && ema9[i] < ema21[i] && c.close < ema50[i]) {
          signal = 'SHORT';
        }
      } else if (strategyName === 'RSI_MEAN_REVERSION') {
        const sliceCloses = closes.slice(0, i + 1);
        const rsiVal = calculateRSI(sliceCloses, 14).rsi14;
        if (rsiVal < 30) signal = 'LONG';
        else if (rsiVal > 70) signal = 'SHORT';
      } else {
        // MACD Momentum / SMC
        const sliceCloses = closes.slice(0, i + 1);
        const macd = calculateMACD(sliceCloses);
        if (macd.crossover === 'BULLISH_CROSS' && c.close > ema21[i]) signal = 'LONG';
        else if (macd.crossover === 'BEARISH_CROSS' && c.close < ema21[i]) signal = 'SHORT';
      }

      if (signal) {
        inPosition = true;
        positionSide = signal;
        entryTime = c.time;
        // Entry with slippage
        entryPrice = signal === 'LONG' ? c.close * (1 + slippageRate) : c.close * (1 - slippageRate);

        const stopDist = entryPrice * 0.025; // 2.5% stop
        if (signal === 'LONG') {
          stopLoss = entryPrice - stopDist;
          takeProfit = entryPrice + stopDist * 2.2; // 1:2.2 R:R
        } else {
          stopLoss = entryPrice + stopDist;
          takeProfit = entryPrice - stopDist * 2.2;
        }
      }
    } else {
      // Manage open position
      let shouldExit = false;
      let exitPrice = c.close;
      let exitReason: 'TP' | 'SL' | 'EXIT_SIGNAL' = 'EXIT_SIGNAL';

      if (positionSide === 'LONG') {
        if (c.high >= takeProfit) {
          shouldExit = true;
          exitPrice = takeProfit;
          exitReason = 'TP';
        } else if (c.low <= stopLoss) {
          shouldExit = true;
          exitPrice = stopLoss;
          exitReason = 'SL';
        }
      } else {
        if (c.low <= takeProfit) {
          shouldExit = true;
          exitPrice = takeProfit;
          exitReason = 'TP';
        } else if (c.high >= stopLoss) {
          shouldExit = true;
          exitPrice = stopLoss;
          exitReason = 'SL';
        }
      }

      if (shouldExit) {
        // Exit with slippage
        const finalExitPrice = positionSide === 'LONG'
          ? exitPrice * (1 - slippageRate)
          : exitPrice * (1 + slippageRate);

        const priceReturn = positionSide === 'LONG'
          ? (finalExitPrice - entryPrice) / entryPrice
          : (entryPrice - finalExitPrice) / entryPrice;

        // Position sizing based on risk
        const posSizeUsd = riskPerTradeUsd / 0.025;
        const grossPnl = posSizeUsd * priceReturn;
        const fees = posSizeUsd * feeRate * 2; // entry + exit fee
        const netPnl = grossPnl - fees;

        currentBalance += netPnl;
        if (currentBalance > peakBalance) peakBalance = currentBalance;
        const dd = ((peakBalance - currentBalance) / peakBalance) * 100;
        if (dd > maxDrawdown) maxDrawdown = dd;

        trades.push({
          entryTime,
          exitTime: c.time,
          side: positionSide,
          entryPrice: Number(entryPrice.toFixed(2)),
          exitPrice: Number(finalExitPrice.toFixed(2)),
          pnlPercent: Number((priceReturn * 100).toFixed(2)),
          pnlUsd: Number(netPnl.toFixed(2)),
          reason: exitReason,
        });

        equityCurve.push({
          time: c.time,
          equity: Number(currentBalance.toFixed(2)),
        });

        inPosition = false;
      }
    }
  }

  const winningTrades = trades.filter((t) => t.pnlUsd > 0).length;
  const losingTrades = trades.filter((t) => t.pnlUsd <= 0).length;
  const winRatePercent = trades.length > 0 ? Number(((winningTrades / trades.length) * 100).toFixed(1)) : 0;

  const totalGains = trades.filter((t) => t.pnlUsd > 0).reduce((acc, t) => acc + t.pnlUsd, 0);
  const totalLosses = Math.abs(trades.filter((t) => t.pnlUsd < 0).reduce((acc, t) => acc + t.pnlUsd, 0));
  const profitFactor = totalLosses > 0 ? Number((totalGains / totalLosses).toFixed(2)) : (totalGains > 0 ? 99 : 0);

  const netProfitUsd = Number((currentBalance - initialBalance).toFixed(2));
  const netProfitPercent = Number((((currentBalance - initialBalance) / initialBalance) * 100).toFixed(2));

  return {
    id: `bt-${Date.now()}`,
    strategyName,
    symbol,
    timeframe,
    startDate: new Date((candles[0]?.time || 0) * 1000).toISOString().split('T')[0],
    endDate: new Date((candles[candles.length - 1]?.time || 0) * 1000).toISOString().split('T')[0],
    initialBalance,
    finalBalance: Number(currentBalance.toFixed(2)),
    totalTrades: trades.length,
    winningTrades,
    losingTrades,
    winRatePercent,
    profitFactor,
    netProfitUsd,
    netProfitPercent,
    maxDrawdownPercent: Number(maxDrawdown.toFixed(2)),
    trades,
    equityCurve,
  };
}
