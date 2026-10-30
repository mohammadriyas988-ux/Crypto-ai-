import { GoogleGenAI } from '@google/genai';
import { TechnicalAnalysisResult, Ticker24h } from './types.js';

const apiKey = process.env.GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export function isGeminiConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

export async function chatWithCryptoPilot(params: {
  message: string;
  history?: Array<{ role: 'user' | 'model'; text: string }>;
  marketContext?: {
    symbol?: string;
    tickers?: Ticker24h[];
    technicals?: TechnicalAnalysisResult | null;
  };
}): Promise<string> {
  if (!ai) {
    return generateLocalRuleBasedChatResponse(params.message, params.marketContext);
  }

  try {
    const symbol = params.marketContext?.symbol || 'BTCUSDT';
    const ticker = params.marketContext?.tickers?.find((t) => t.symbol === symbol);
    const tech = params.marketContext?.technicals;

    let contextSnippet = `CURRENT MARKET CONTEXT:\n`;
    if (ticker) {
      contextSnippet += `- Symbol: ${ticker.symbol} (${ticker.name})\n- Live Price: $${ticker.lastPrice} (24h Change: ${ticker.priceChangePercent > 0 ? '+' : ''}${ticker.priceChangePercent}%)\n- 24h High: $${ticker.highPrice} | 24h Low: $${ticker.lowPrice}\n- 24h Volume: ${ticker.volume24h.toLocaleString()}\n`;
    }
    if (tech) {
      contextSnippet += `- Trend Bias: ${tech.ema.trend}\n- EMA 9: $${tech.ema.ema9} | EMA 21: $${tech.ema.ema21} | EMA 50: $${tech.ema.ema50} | EMA 200: $${tech.ema.ema200}\n- RSI (14): ${tech.rsi.rsi14} (${tech.rsi.condition})\n- MACD Histogram: ${tech.macd.histogram} (Crossover: ${tech.macd.crossover})\n- Nearest Support: $${tech.supportResistance.nearestSupport} | Nearest Resistance: $${tech.supportResistance.nearestResistance}\n- SMC Structure: ${tech.smc.marketBias} | Buy-Side Liquidity: $${tech.smc.liquidityPools.buySideLiquidity} | Sell-Side Liquidity: $${tech.smc.liquidityPools.sellSideLiquidity}\n- Active Fair Value Gaps: ${tech.smc.fairValueGaps.length} detected\n- Active Order Blocks: ${tech.smc.orderBlocks.length} detected\n- Algorithmic Score: ${tech.compositeScore}/100 (${tech.recommendation})\n`;
    }

    const systemInstruction = `You are CryptoPilot AI, an elite, professional cryptocurrency market analyst and trading research assistant.
You specialize in technical analysis, price action, exponential moving averages (EMA), RSI, MACD, Fibonacci retracements, and ICT (Inner Circle Trader) / Smart Money Concepts (Order Blocks, Fair Value Gaps, Liquidity Sweeps, Break of Structure BOS, and Change of Character CHOCH).

CRITICAL OPERATING RULES:
1. Always maintain a disciplined, probabilistic mindset. NEVER guarantee future prices or claim 100% certainty. All trade setups must have clear invalidation points (Stop-Loss).
2. Emphasize capital preservation and risk management (1% to 2% max portfolio risk per setup, minimum 1:2 Risk/Reward ratio).
3. When analyzing the current asset, actively utilize the provided real-time market metrics and technical indicator context.
4. If asked about live execution, remind the user that CryptoPilot operates in a simulated Paper Trading research environment with zero real money risk.
5. Provide clear, crisp markdown formatting with bullet points and bold levels for easy readability.`;

    // Construct conversation contents
    const contents: any[] = [];
    if (params.history && params.history.length > 0) {
      for (const item of params.history.slice(-6)) {
        contents.push({
          role: item.role === 'model' ? 'model' : 'user',
          parts: [{ text: item.text }],
        });
      }
    }

    contents.push({
      role: 'user',
      parts: [
        {
          text: `${contextSnippet}\nUSER INQUIRY: ${params.message}`,
        },
      ],
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AI_TIMEOUT_EXCEEDED')), 3500)
    );

    const response = await Promise.race([
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction,
        },
      }),
      timeoutPromise,
    ]);

    return response.text || 'No response generated from CryptoPilot AI.';
  } catch (err: any) {
    console.error('Gemini chat error, falling back to local analysis generator:', err?.message || err);
    return generateLocalRuleBasedChatResponse(params.message, params.marketContext);
  }
}

export async function generateAIAnalysis(params: {
  symbol: string;
  ticker?: Ticker24h;
  technicals: TechnicalAnalysisResult;
}): Promise<string> {
  const { symbol, ticker, technicals } = params;

  if (!ai) {
    return generateLocalRuleBasedSummary(symbol, ticker, technicals);
  }

  try {
    const prompt = `Perform a comprehensive professional technical analysis and ICT/Smart Money breakdown for ${symbol}.
Current Price: $${technicals.currentPrice}
24h Change: ${ticker?.priceChangePercent ?? 0}%
EMA Status: ${technicals.ema.trend} (EMA 9: $${technicals.ema.ema9}, EMA 21: $${technicals.ema.ema21}, EMA 50: $${technicals.ema.ema50}, EMA 200: $${technicals.ema.ema200})
RSI (14): ${technicals.rsi.rsi14} (${technicals.rsi.condition})
MACD: Line ${technicals.macd.macdLine}, Signal ${technicals.macd.signalLine}, Histogram ${technicals.macd.histogram} (${technicals.macd.crossover})
Nearest Support: $${technicals.supportResistance.nearestSupport}
Nearest Resistance: $${technicals.supportResistance.nearestResistance}
Fibonacci 0.618 Golden Pocket: $${technicals.fibonacci.fib618}
Smart Money Bias: ${technicals.smc.marketBias}
Order Blocks Detected: ${technicals.smc.orderBlocks.map((ob) => `${ob.type} OB [$${ob.low} - $${ob.high}]`).join(', ') || 'None in immediate range'}
Fair Value Gaps: ${technicals.smc.fairValueGaps.map((fvg) => `${fvg.type} FVG [$${fvg.bottom} - $${fvg.top}]`).join(', ') || 'None unmitigated'}
Liquidity Pools: Buy-Side $${technicals.smc.liquidityPools.buySideLiquidity}, Sell-Side $${technicals.smc.liquidityPools.sellSideLiquidity}

Format your response in structured markdown:
### Executive Summary
### Technical & Trend Indicators (EMAs, RSI, MACD)
### Smart Money Concepts (FVGs, Order Blocks, Liquidity Sweeps)
### High Probability Trade Hypothesis (Bullish vs Bearish scenarios, recommended Entry zone, Invalidation Stop-Loss, and Target Take-Profit with Risk:Reward calculation).
Keep it analytical, concise, and professional.`;

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AI_TIMEOUT_EXCEEDED')), 3500)
    );

    const response = await Promise.race([
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are CryptoPilot AI, an elite institutional crypto quantitative researcher and price action technician.',
        },
      }),
      timeoutPromise,
    ]);

    return response.text || generateLocalRuleBasedSummary(symbol, ticker, technicals);
  } catch (err: any) {
    console.warn('Gemini analysis generation error:', err?.message);
    return generateLocalRuleBasedSummary(symbol, ticker, technicals);
  }
}

export async function generateAIPrediction(params: {
  symbol: string;
  ticker?: Ticker24h;
  technicals: TechnicalAnalysisResult;
}): Promise<{
  direction: 'BULLISH' | 'BEARISH';
  horizonHours: number;
  entryPrice: number;
  targetPrice: number;
  invalidationPrice: number;
  confidencePercent: number;
  rationale: string;
  keyFactors: string[];
}> {
  const currentPrice = params.technicals.currentPrice;
  const isBullish = params.technicals.compositeScore >= 50;

  if (!ai) {
    return generateLocalRuleBasedPrediction(params.symbol, currentPrice, params.technicals);
  }

  try {
    const prompt = `Given the following technical data for ${params.symbol}:
Current Price: ${currentPrice}
Composite Score: ${params.technicals.compositeScore}/100
EMA Trend: ${params.technicals.ema.trend}
RSI: ${params.technicals.rsi.rsi14}
MACD Histogram: ${params.technicals.macd.histogram}
Nearest Support: ${params.technicals.supportResistance.nearestSupport}
Nearest Resistance: ${params.technicals.supportResistance.nearestResistance}
Golden Pocket Fib 0.618: ${params.technicals.fibonacci.fib618}
SMC Bias: ${params.technicals.smc.marketBias}

Generate a high-probability research forecast in JSON format with exactly these fields:
{
  "direction": "BULLISH" or "BEARISH",
  "horizonHours": number (e.g. 12, 24, 48),
  "targetPrice": number,
  "invalidationPrice": number,
  "confidencePercent": number (between 55 and 85),
  "rationale": "one clear explanatory sentence describing the core technical thesis",
  "keyFactors": ["factor 1", "factor 2", "factor 3"]
}`;

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AI_TIMEOUT_EXCEEDED')), 3500)
    );

    const response = await Promise.race([
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      }),
      timeoutPromise,
    ]);

    const parsed = JSON.parse(response.text || '{}');
    if (parsed.direction && parsed.targetPrice && parsed.invalidationPrice) {
      return {
        direction: parsed.direction === 'BEARISH' ? 'BEARISH' : 'BULLISH',
        horizonHours: parsed.horizonHours || 24,
        entryPrice: currentPrice,
        targetPrice: Number(parsed.targetPrice),
        invalidationPrice: Number(parsed.invalidationPrice),
        confidencePercent: Math.min(90, Math.max(50, Number(parsed.confidencePercent) || 70)),
        rationale: parsed.rationale || `Market structure and momentum alignment on ${params.symbol}.`,
        keyFactors: Array.isArray(parsed.keyFactors) ? parsed.keyFactors.slice(0, 4) : ['EMA alignment', 'SMC liquidity sweep'],
      };
    }
  } catch (err) {
    console.warn('Failed to generate AI prediction via Gemini, fallback to quantitative model:', err);
  }

  return generateLocalRuleBasedPrediction(params.symbol, currentPrice, params.technicals);
}

function generateLocalRuleBasedPrediction(symbol: string, currentPrice: number, tech: TechnicalAnalysisResult) {
  const isBullish = tech.compositeScore >= 50;
  const targetPct = isBullish ? 0.045 : -0.045;
  const stopPct = isBullish ? -0.022 : 0.022;

  const targetPrice = Number((currentPrice * (1 + targetPct)).toFixed(2));
  const invalidationPrice = Number((currentPrice * (1 + stopPct)).toFixed(2));

  return {
    direction: isBullish ? ('BULLISH' as const) : ('BEARISH' as const),
    horizonHours: 24,
    entryPrice: currentPrice,
    targetPrice,
    invalidationPrice,
    confidencePercent: Math.min(85, Math.max(58, tech.compositeScore)),
    rationale: isBullish
      ? `Price action defending support at $${tech.supportResistance.nearestSupport} with ${tech.ema.trend} moving average confluence.`
      : `Rejection at resistance near $${tech.supportResistance.nearestResistance} with overbought momentum exhaustion.`,
    keyFactors: [
      `EMA alignment: ${tech.ema.trend}`,
      `RSI 14 reading at ${tech.rsi.rsi14} (${tech.rsi.condition})`,
      `SMC Bias: ${tech.smc.marketBias}`,
      `Targeting ${isBullish ? 'Buy-side liquidity' : 'Sell-side liquidity'}`,
    ],
  };
}

function generateLocalRuleBasedSummary(symbol: string, ticker: Ticker24h | undefined, tech: TechnicalAnalysisResult): string {
  return `### Executive Summary for ${symbol}
${symbol} is trading at **$${tech.currentPrice}** with a composite quantitative rating of **${tech.compositeScore}/100 (${tech.recommendation})**. Current market regime displays **${tech.ema.trend}** trend velocity and **${tech.smc.marketBias}** Smart Money bias.

### Technical & Indicator Breakdown
- **Moving Averages (EMA)**: EMA 9 ($${tech.ema.ema9}) vs EMA 21 ($${tech.ema.ema21}) with EMA 200 long-term anchor at $${tech.ema.ema200}.
- **Relative Strength Index (RSI 14)**: Currently printed at **${tech.rsi.rsi14}**, classifying momentum as **${tech.rsi.condition}**.
- **MACD Oscillator**: Histogram sitting at **${tech.macd.histogram}** with **${tech.macd.crossover}** signal state.
- **Key Price Levels**: Nearest structural Support at **$${tech.supportResistance.nearestSupport}**, nearest overhead Resistance at **$${tech.supportResistance.nearestResistance}**.
- **Fibonacci Golden Pocket**: 0.618 level situated at **$${tech.fibonacci.fib618}**.

### Smart Money Concepts (ICT)
- **Market Bias**: ${tech.smc.marketBias}
- **Liquidity Pools**: Buy-Side Liquidity (BSL) target at **$${tech.smc.liquidityPools.buySideLiquidity}**; Sell-Side Liquidity (SSL) at **$${tech.smc.liquidityPools.sellSideLiquidity}**.
- **Fair Value Gaps**: ${tech.smc.fairValueGaps.length} imbalance zones tracked in recent price action.
- **Order Blocks**: Key institutional order blocks positioned at ${tech.smc.orderBlocks.map((ob) => `$${ob.low}-$${ob.high}`).join(', ') || 'immediate pivots'}.

### Risk Management Advisory
Forecasts carry statistical uncertainty. For any new swing or scalp position, limit exposure to **1% - 1.5%** of capital. Maintain an invalidation stop below $${tech.supportResistance.nearestSupport} for long setups or above $${tech.supportResistance.nearestResistance} for shorts.`;
}

function generateLocalRuleBasedChatResponse(message: string, context?: any): string {
  const symbol = context?.symbol || 'BTCUSDT';
  const ticker = context?.tickers?.find((t: any) => t.symbol === symbol);
  const tech = context?.technicals;
  const lower = message.toLowerCase();

  if (lower.includes('rsi')) {
    return `**RSI Analysis for ${symbol}**:\nThe current 14-period Relative Strength Index is **${tech?.rsi.rsi14 ?? 52}**, which sits in the **${tech?.rsi.condition ?? 'NEUTRAL'}** zone.\n\n*Rule of thumb*:\n- Below 30: Oversold territory where smart money looks for exhaustion selling into liquidity.\n- Above 70: Overbought region prone to profit-taking or mean reversion.\n- Centerline (50): Acts as dynamic bull/bear threshold.`;
  }

  if (lower.includes('ema') || lower.includes('moving average')) {
    return `**Exponential Moving Average (EMA) Matrix for ${symbol}**:\n- **EMA 9**: $${tech?.ema.ema9 ?? 'N/A'} (Short-term momentum trigger)\n- **EMA 21**: $${tech?.ema.ema21 ?? 'N/A'} (Medium-term dynamic support/resistance)\n- **EMA 50**: $${tech?.ema.ema50 ?? 'N/A'} (Institutional swing benchmark)\n- **EMA 200**: $${tech?.ema.ema200 ?? 'N/A'} (Macro trend line)\n\nCurrent structure indicates **${tech?.ema.trend ?? 'BULLISH'}** price positioning.`;
  }

  if (lower.includes('fvg') || lower.includes('fair value gap') || lower.includes('smc') || lower.includes('order block')) {
    return `**Smart Money Concepts (SMC) & ICT Overview for ${symbol}**:\n- **Market Structure Bias**: ${tech?.smc.marketBias ?? 'BULLISH'}\n- **Fair Value Gaps (FVG)**: 3-candle imbalance where aggressive market orders leave price gaps. We have **${tech?.smc.fairValueGaps?.length ?? 2}** active FVGs tracked.\n- **Order Blocks (OB)**: The last candle before significant institutional displacement. Price often re-tests these blocks before continuing trend.\n- **Liquidity Pools**: Buy-Side Liquidity (BSL) at **$${tech?.smc.liquidityPools.buySideLiquidity ?? 'N/A'}**, Sell-Side Liquidity (SSL) at **$${tech?.smc.liquidityPools.sellSideLiquidity ?? 'N/A'}**.`;
  }

  if (lower.includes('risk') || lower.includes('position size') || lower.includes('calculator')) {
    return `**Risk Management Principles**:\n1. **Fixed Fractional Risk**: Never risk more than 1% to 2% of total account equity on any single idea.\n2. **Formula**: \`Position Size = (Account Equity * Risk %) / (Entry Price - Stop Loss Price)\`\n3. **Risk / Reward**: Minimum 1:2 R:R ensures that even a 40% win rate produces positive expectancy.\n4. **Uncertainty**: All models and predictions carry variance. Never trade without a predefined invalidation level.`;
  }

  return `### CryptoPilot Market Intelligence on ${symbol}
- **Price**: $${ticker?.lastPrice ?? '87,450'} (${ticker?.priceChangePercent ?? '+2.3'}% 24h)
- **Technical Composite**: ${tech?.compositeScore ?? 68}/100 (${tech?.recommendation ?? 'BUY'})
- **Key Support**: $${tech?.supportResistance.nearestSupport ?? '85,200'}
- **Key Resistance**: $${tech?.supportResistance.nearestResistance ?? '88,500'}
- **Momentum**: RSI at ${tech?.rsi.rsi14 ?? '54.2'}, EMA trend ${tech?.ema.trend ?? 'BULLISH'}

Feel free to ask me about specific technical indicators (RSI, EMA, MACD), ICT/SMC concepts (FVGs, Order Blocks, Liquidity Sweeps), risk management sizing, or generating a new recorded forecast!`;
}
