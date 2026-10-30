import {
  Candle,
  IndicatorEMA,
  IndicatorRSI,
  IndicatorMACD,
  SupportResistance,
  FibonacciLevels,
  SmartMoneyConcepts,
  TechnicalAnalysisResult,
  FairValueGap,
  OrderBlock,
} from './types.js';

export function calculateEMA(closes: number[], period: number): number[] {
  if (closes.length < period) {
    return new Array(closes.length).fill(closes[closes.length - 1] ?? 0);
  }
  const k = 2 / (period + 1);
  const emaArray: number[] = new Array(closes.length).fill(0);

  // Initial SMA as starting point
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += closes[i];
  }
  let currentEma = sum / period;
  emaArray[period - 1] = currentEma;

  for (let i = period; i < closes.length; i++) {
    currentEma = closes[i] * k + currentEma * (1 - k);
    emaArray[i] = currentEma;
  }
  // Fill beginning with first EMA value for continuity
  for (let i = 0; i < period - 1; i++) {
    emaArray[i] = emaArray[period - 1];
  }
  return emaArray;
}

export function calculateRSI(closes: number[], period = 14): IndicatorRSI {
  if (closes.length <= period) {
    return { rsi14: 50, condition: 'NEUTRAL', signal: 'NEUTRAL' };
  }

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) {
      avgGain = (avgGain * (period - 1) + diff) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(diff)) / period;
    }
  }

  if (avgLoss === 0) {
    return { rsi14: 100, condition: 'OVERBOUGHT', signal: 'BEARISH' };
  }

  const rs = avgGain / avgLoss;
  const rsi = Number((100 - 100 / (1 + rs)).toFixed(2));

  let condition: 'OVERSOLD' | 'OVERBOUGHT' | 'NEUTRAL' = 'NEUTRAL';
  let signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';

  if (rsi <= 30) {
    condition = 'OVERSOLD';
    signal = 'BULLISH';
  } else if (rsi >= 70) {
    condition = 'OVERBOUGHT';
    signal = 'BEARISH';
  }

  return { rsi14: rsi, condition, signal };
}

export function calculateMACD(
  closes: number[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
): IndicatorMACD {
  if (closes.length < slowPeriod) {
    return { macdLine: 0, signalLine: 0, histogram: 0, crossover: 'NONE' };
  }

  const fastEma = calculateEMA(closes, fastPeriod);
  const slowEma = calculateEMA(closes, slowPeriod);

  const macdSeries: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    macdSeries.push(fastEma[i] - slowEma[i]);
  }

  const signalSeries = calculateEMA(macdSeries, signalPeriod);

  const lastMacd = macdSeries[macdSeries.length - 1];
  const lastSignal = signalSeries[signalSeries.length - 1];
  const prevMacd = macdSeries[macdSeries.length - 2] ?? lastMacd;
  const prevSignal = signalSeries[signalSeries.length - 2] ?? lastSignal;

  const histogram = Number((lastMacd - lastSignal).toFixed(4));

  let crossover: 'BULLISH_CROSS' | 'BEARISH_CROSS' | 'NONE' = 'NONE';
  if (prevMacd <= prevSignal && lastMacd > lastSignal) {
    crossover = 'BULLISH_CROSS';
  } else if (prevMacd >= prevSignal && lastMacd < lastSignal) {
    crossover = 'BEARISH_CROSS';
  }

  return {
    macdLine: Number(lastMacd.toFixed(4)),
    signalLine: Number(lastSignal.toFixed(4)),
    histogram,
    crossover,
  };
}

export function calculateSupportResistance(
  candles: Candle[],
  pivotLength = 5
): SupportResistance {
  const supports: number[] = [];
  const resistances: number[] = [];

  for (let i = pivotLength; i < candles.length - pivotLength; i++) {
    const currentLow = candles[i].low;
    const currentHigh = candles[i].high;

    let isPivotLow = true;
    let isPivotHigh = true;

    for (let j = i - pivotLength; j <= i + pivotLength; j++) {
      if (j === i) continue;
      if (candles[j].low < currentLow) isPivotLow = false;
      if (candles[j].high > currentHigh) isPivotHigh = false;
    }

    if (isPivotLow) supports.push(Number(currentLow.toFixed(2)));
    if (isPivotHigh) resistances.push(Number(currentHigh.toFixed(2)));
  }

  // De-duplicate & cluster nearby levels (within 0.5%)
  const currentPrice = candles[candles.length - 1]?.close || 1;

  const clusterLevels = (levels: number[]): number[] => {
    levels.sort((a, b) => a - b);
    const clustered: number[] = [];
    for (const lvl of levels) {
      if (clustered.length === 0) {
        clustered.push(lvl);
      } else {
        const prev = clustered[clustered.length - 1];
        if (Math.abs(lvl - prev) / prev > 0.008) {
          clustered.push(lvl);
        }
      }
    }
    return clustered;
  };

  const finalSupports = clusterLevels(supports).filter((lvl) => lvl <= currentPrice);
  const finalResistances = clusterLevels(resistances).filter((lvl) => lvl >= currentPrice);

  const nearestSupport = finalSupports.length > 0 ? finalSupports[finalSupports.length - 1] : currentPrice * 0.95;
  const nearestResistance = finalResistances.length > 0 ? finalResistances[0] : currentPrice * 1.05;

  return {
    supports: finalSupports.slice(-5),
    resistances: finalResistances.slice(0, 5),
    nearestSupport: Number(nearestSupport.toFixed(2)),
    nearestResistance: Number(nearestResistance.toFixed(2)),
  };
}

export function calculateFibonacci(candles: Candle[]): FibonacciLevels {
  const lookback = Math.min(100, candles.length);
  const recentCandles = candles.slice(-lookback);

  let high = -Infinity;
  let low = Infinity;

  for (const c of recentCandles) {
    if (c.high > high) high = c.high;
    if (c.low < low) low = c.low;
  }

  const range = high - low;

  return {
    high: Number(high.toFixed(2)),
    low: Number(low.toFixed(2)),
    fib0: Number(high.toFixed(2)),
    fib236: Number((high - range * 0.236).toFixed(2)),
    fib382: Number((high - range * 0.382).toFixed(2)),
    fib500: Number((high - range * 0.5).toFixed(2)),
    fib618: Number((high - range * 0.618).toFixed(2)), // Golden Pocket
    fib786: Number((high - range * 0.786).toFixed(2)),
    fib100: Number(low.toFixed(2)),
  };
}

export function calculateSMC(candles: Candle[]): SmartMoneyConcepts {
  const fvgs: FairValueGap[] = [];
  const orderBlocks: OrderBlock[] = [];
  const bos: Array<{ price: number; type: 'BULLISH' | 'BEARISH'; time: number }> = [];
  const choch: Array<{ price: number; type: 'BULLISH' | 'BEARISH'; time: number }> = [];

  const len = candles.length;
  if (len < 5) {
    return {
      marketBias: 'CONSOLIDATION',
      bos: [],
      choch: [],
      fairValueGaps: [],
      orderBlocks: [],
      liquidityPools: { buySideLiquidity: 0, sellSideLiquidity: 0 },
    };
  }

  // 1. Detect Fair Value Gaps (3-bar pattern)
  for (let i = 2; i < len; i++) {
    const c1 = candles[i - 2];
    const c2 = candles[i - 1];
    const c3 = candles[i];

    // Bullish FVG: Low of candle 3 is higher than High of candle 1
    if (c3.low > c1.high) {
      // Check if subsequent candles mitigated this FVG
      let mitigated = false;
      for (let j = i + 1; j < len; j++) {
        if (candles[j].low <= c1.high) {
          mitigated = true;
          break;
        }
      }
      fvgs.push({
        top: Number(c3.low.toFixed(2)),
        bottom: Number(c1.high.toFixed(2)),
        type: 'BULLISH',
        time: c2.time,
        mitigated,
      });
    }

    // Bearish FVG: High of candle 3 is lower than Low of candle 1
    if (c3.high < c1.low) {
      let mitigated = false;
      for (let j = i + 1; j < len; j++) {
        if (candles[j].high >= c1.low) {
          mitigated = true;
          break;
        }
      }
      fvgs.push({
        top: Number(c1.low.toFixed(2)),
        bottom: Number(c3.high.toFixed(2)),
        type: 'BEARISH',
        time: c2.time,
        mitigated,
      });
    }
  }

  // 2. Detect Order Blocks (Last opposing candle before strong displacement)
  for (let i = 3; i < len - 1; i++) {
    const cPrev = candles[i - 1];
    const cCurr = candles[i];
    const cNext = candles[i + 1];

    const avgBody = (Math.abs(cPrev.close - cPrev.open) + Math.abs(cCurr.close - cCurr.open)) / 2;

    // Bullish Order Block: Down candle followed by a massive up move
    if (cCurr.close < cCurr.open && cNext.close > cNext.open && (cNext.close - cNext.open) > avgBody * 1.8) {
      orderBlocks.push({
        high: Number(cCurr.high.toFixed(2)),
        low: Number(cCurr.low.toFixed(2)),
        type: 'BULLISH',
        time: cCurr.time,
      });
    }

    // Bearish Order Block: Up candle followed by large drop
    if (cCurr.close > cCurr.open && cNext.close < cNext.open && (cNext.open - cNext.close) > avgBody * 1.8) {
      orderBlocks.push({
        high: Number(cCurr.high.toFixed(2)),
        low: Number(cCurr.low.toFixed(2)),
        type: 'BEARISH',
        time: cCurr.time,
      });
    }
  }

  // 3. Market Structure: BOS and CHOCH
  let lastSwingHigh = candles[0].high;
  let lastSwingLow = candles[0].low;
  let currentTrend: 'BULLISH' | 'BEARISH' = 'BULLISH';

  for (let i = 5; i < len; i++) {
    const c = candles[i];
    if (c.close > lastSwingHigh) {
      if (currentTrend === 'BEARISH') {
        choch.push({ price: Number(lastSwingHigh.toFixed(2)), type: 'BULLISH', time: c.time });
        currentTrend = 'BULLISH';
      } else {
        bos.push({ price: Number(lastSwingHigh.toFixed(2)), type: 'BULLISH', time: c.time });
      }
      lastSwingHigh = c.high;
    } else if (c.close < lastSwingLow) {
      if (currentTrend === 'BULLISH') {
        choch.push({ price: Number(lastSwingLow.toFixed(2)), type: 'BEARISH', time: c.time });
        currentTrend = 'BEARISH';
      } else {
        bos.push({ price: Number(lastSwingLow.toFixed(2)), type: 'BEARISH', time: c.time });
      }
      lastSwingLow = c.low;
    }
  }

  // 4. Liquidity Pools (Lookback 60 candles)
  const lookback = Math.min(60, len);
  const slice = candles.slice(-lookback);
  let bsl = -Infinity;
  let ssl = Infinity;
  for (const c of slice) {
    if (c.high > bsl) bsl = c.high;
    if (c.low < ssl) ssl = c.low;
  }

  return {
    marketBias: currentTrend === 'BULLISH' ? 'BULLISH' : 'BEARISH',
    bos: bos.slice(-4),
    choch: choch.slice(-4),
    fairValueGaps: fvgs.slice(-6),
    orderBlocks: orderBlocks.slice(-6),
    liquidityPools: {
      buySideLiquidity: Number(bsl.toFixed(2)),
      sellSideLiquidity: Number(ssl.toFixed(2)),
    },
  };
}

export function performTechnicalAnalysis(
  symbol: string,
  timeframe: string,
  candles: Candle[]
): TechnicalAnalysisResult {
  const closes = candles.map((c) => c.close);
  const currentPrice = closes[closes.length - 1] || 0;

  const ema9Series = calculateEMA(closes, 9);
  const ema21Series = calculateEMA(closes, 21);
  const ema50Series = calculateEMA(closes, 50);
  const ema200Series = calculateEMA(closes, 200);

  const ema9 = Number(ema9Series[ema9Series.length - 1].toFixed(2));
  const ema21 = Number(ema21Series[ema21Series.length - 1].toFixed(2));
  const ema50 = Number(ema50Series[ema50Series.length - 1].toFixed(2));
  const ema200 = Number(ema200Series[ema200Series.length - 1].toFixed(2));

  let emaTrend: 'STRONG_BULLISH' | 'BULLISH' | 'BEARISH' | 'STRONG_BEARISH' | 'NEUTRAL' = 'NEUTRAL';
  if (currentPrice > ema9 && ema9 > ema21 && ema21 > ema50 && ema50 > ema200) {
    emaTrend = 'STRONG_BULLISH';
  } else if (currentPrice > ema21 && ema21 > ema50) {
    emaTrend = 'BULLISH';
  } else if (currentPrice < ema9 && ema9 < ema21 && ema21 < ema50 && ema50 < ema200) {
    emaTrend = 'STRONG_BEARISH';
  } else if (currentPrice < ema21 && ema21 < ema50) {
    emaTrend = 'BEARISH';
  }

  const prev50 = ema50Series[ema50Series.length - 2] ?? ema50;
  const prev200 = ema200Series[ema200Series.length - 2] ?? ema200;
  const goldenCross = prev50 <= prev200 && ema50 > ema200;
  const deathCross = prev50 >= prev200 && ema50 < ema200;

  const ema: IndicatorEMA = {
    ema9,
    ema21,
    ema50,
    ema200,
    trend: emaTrend,
    goldenCross,
    deathCross,
  };

  const rsi = calculateRSI(closes, 14);
  const macd = calculateMACD(closes);
  const supportResistance = calculateSupportResistance(candles);
  const fibonacci = calculateFibonacci(candles);
  const smc = calculateSMC(candles);

  // Calculate composite score (0 to 100)
  let score = 50;

  // Trend contribution
  if (emaTrend === 'STRONG_BULLISH') score += 20;
  else if (emaTrend === 'BULLISH') score += 10;
  else if (emaTrend === 'BEARISH') score -= 10;
  else if (emaTrend === 'STRONG_BEARISH') score -= 20;

  // Golden / Death cross
  if (goldenCross) score += 15;
  if (deathCross) score -= 15;

  // RSI contribution
  if (rsi.rsi14 < 30) score += 12; // Oversold bounce potential
  else if (rsi.rsi14 > 70) score -= 12; // Overbought exhaustion
  else if (rsi.rsi14 > 50) score += 5;
  else score -= 5;

  // MACD contribution
  if (macd.crossover === 'BULLISH_CROSS') score += 15;
  else if (macd.crossover === 'BEARISH_CROSS') score -= 15;
  else if (macd.histogram > 0) score += 5;
  else if (macd.histogram < 0) score -= 5;

  // SMC bias
  if (smc.marketBias === 'BULLISH') score += 8;
  else if (smc.marketBias === 'BEARISH') score -= 8;

  score = Math.max(5, Math.min(95, score));

  let recommendation: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL' = 'NEUTRAL';
  if (score >= 75) recommendation = 'STRONG_BUY';
  else if (score >= 60) recommendation = 'BUY';
  else if (score <= 25) recommendation = 'STRONG_SELL';
  else if (score <= 40) recommendation = 'SELL';

  let riskLabel: 'HIGH_RISK' | 'MODERATE_RISK' | 'LOW_RISK' = 'MODERATE_RISK';
  if (rsi.rsi14 > 75 || rsi.rsi14 < 25 || deathCross || goldenCross) {
    riskLabel = 'HIGH_RISK';
  } else if (score >= 45 && score <= 55) {
    riskLabel = 'MODERATE_RISK';
  }

  return {
    symbol,
    timeframe,
    currentPrice,
    timestamp: Date.now(),
    ema,
    rsi,
    macd,
    supportResistance,
    fibonacci,
    smc,
    compositeScore: score,
    recommendation,
    riskLabel,
  };
}
