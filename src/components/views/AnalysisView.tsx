import React, { useState } from 'react';
import {
  TechnicalAnalysisResult,
  Ticker24h,
} from '../../types/crypto';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Layers,
  Sparkles,
  Bot,
  ShieldCheck,
  Zap,
  Target,
  ArrowRight,
} from 'lucide-react';
import { generateAiAnalysis } from '../../services/api';
import { CryptoSelector } from '../CryptoSelector';

interface Props {
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  selectedInterval: string;
  onSelectInterval: (interval: string) => void;
  technicals?: TechnicalAnalysisResult | null;
  tickers: Ticker24h[];
  onOpenOrderModal: () => void;
  onOpenPredictionModal: () => void;
}

export const AnalysisView: React.FC<Props> = ({
  selectedSymbol,
  onSelectSymbol,
  selectedInterval,
  onSelectInterval,
  technicals,
  tickers,
  onOpenOrderModal,
  onOpenPredictionModal,
}) => {
  const currentTicker = tickers.find((t) => t.symbol === selectedSymbol);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const handleGenerateReport = async () => {
    setLoadingAi(true);
    try {
      const data = await generateAiAnalysis(selectedSymbol, selectedInterval);
      setAiReport(data.report);
    } catch (err: any) {
      setAiReport(`Failed to generate AI analysis: ${err.message}`);
    } finally {
      setLoadingAi(false);
    }
  };

  if (!technicals) {
    return (
      <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl">
        <Activity className="w-8 h-8 text-emerald-400 mx-auto animate-spin mb-3" />
        <p className="text-slate-300 font-mono text-sm">Computing technical indicators & SMC matrices...</p>
      </div>
    );
  }

  const { ema, rsi, macd, supportResistance, fibonacci, smc, compositeScore, recommendation, riskLabel } = technicals;

  return (
    <div className="space-y-6">
      {/* 1. Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-white font-mono">
            {selectedSymbol.substring(0, 3)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-wide">{selectedSymbol}</h2>
              <span className="text-xs px-2 py-0.5 rounded font-mono bg-slate-800 text-slate-300">
                {selectedInterval.toUpperCase()} TIMEFRAME
              </span>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Live Price: <strong className="text-white">${technicals.currentPrice.toLocaleString()}</strong> | 24h Change:{' '}
              <span className={currentTicker && currentTicker.priceChangePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {currentTicker ? `${currentTicker.priceChangePercent > 0 ? '+' : ''}${currentTicker.priceChangePercent}%` : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Universal Crypto Search & Selector */}
        <CryptoSelector
          selectedSymbol={selectedSymbol}
          onSelectSymbol={onSelectSymbol}
          tickers={tickers}
        />

        <button
          onClick={handleGenerateReport}
          disabled={loadingAi}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-md transition"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{loadingAi ? 'Synthesizing with Gemini...' : 'Generate AI Synthesis'}</span>
        </button>
      </div>

      {/* 2. Composite Rating Gauge Banner */}
      <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
            COMPOSITE ALGORITHMIC CONFLUENCE
          </span>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-extrabold font-mono text-white">{compositeScore}/100</span>
            <span
              className={`px-2.5 py-1 rounded-md text-xs font-bold font-mono tracking-wide ${
                compositeScore >= 65
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : compositeScore <= 35
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              }`}
            >
              {recommendation}
            </span>
            <span className="text-xs font-mono text-slate-400">
              Risk Profile: <strong className="text-slate-200">{riskLabel}</strong>
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Weighted calculation incorporating EMA multi-stack trend, 14-period RSI exhaustion, MACD momentum impulse, and ICT liquidity sweeps.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenPredictionModal}
            className="px-3.5 py-2 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            Record Forecast
          </button>
          <button
            onClick={onOpenOrderModal}
            className="px-3.5 py-2 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition"
          >
            Open Paper Trade
          </button>
        </div>
      </div>

      {/* 3. AI Generated Report (if available) */}
      {aiReport && (
        <div className="p-5 bg-slate-900 border border-emerald-500/30 rounded-xl space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-white text-base">Gemini AI Executive Thesis</h3>
            </div>
            <button
              onClick={() => setAiReport(null)}
              className="text-xs text-slate-400 hover:text-white font-mono"
            >
              Close
            </button>
          </div>
          <div className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed font-sans prose prose-invert max-w-none">
            {aiReport}
          </div>
        </div>
      )}

      {/* 4. Indicator Deep Dive Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Card 1: Exponential Moving Averages (EMA) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-400" />
              <h3 className="font-bold text-white text-sm">Moving Averages (EMA)</h3>
            </div>
            <span className="text-[11px] font-mono font-bold text-sky-400">{ema.trend}</span>
          </div>

          <div className="space-y-2.5 text-xs font-mono">
            <div className="flex justify-between items-center p-2 rounded bg-slate-950/60">
              <span className="text-sky-400">EMA 9 (Momentum):</span>
              <span className="font-bold text-white">${ema.ema9.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded bg-slate-950/60">
              <span className="text-amber-400">EMA 21 (Dynamic Support):</span>
              <span className="font-bold text-white">${ema.ema21.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded bg-slate-950/60">
              <span className="text-purple-400">EMA 50 (Swing Baseline):</span>
              <span className="font-bold text-white">${ema.ema50.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded bg-slate-950/60">
              <span className="text-rose-400">EMA 200 (Macro Trend):</span>
              <span className="font-bold text-white">${ema.ema200.toLocaleString()}</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 font-mono pt-2 border-t border-slate-800">
            {ema.goldenCross && <span className="text-emerald-400 font-bold">★ Golden Cross Active (50 above 200)</span>}
            {ema.deathCross && <span className="text-rose-400 font-bold">⚠ Death Cross Active (50 below 200)</span>}
            {!ema.goldenCross && !ema.deathCross && 'Trend structure stable without recent major crosses.'}
          </div>
        </div>

        {/* Card 2: RSI 14 Momentum */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-fuchsia-400" />
              <h3 className="font-bold text-white text-sm">Relative Strength (RSI 14)</h3>
            </div>
            <span
              className={`text-[11px] font-mono font-bold ${
                rsi.condition === 'OVERSOLD'
                  ? 'text-emerald-400'
                  : rsi.condition === 'OVERBOUGHT'
                  ? 'text-rose-400'
                  : 'text-slate-300'
              }`}
            >
              {rsi.condition}
            </span>
          </div>

          <div className="text-center py-2">
            <div className="text-4xl font-extrabold font-mono text-white">{rsi.rsi14}</div>
            <span className="text-xs text-slate-400 font-mono mt-1 block">
              14-Period Classical Wilder RSI
            </span>
          </div>

          {/* Meter */}
          <div className="space-y-1.5">
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex">
              <div
                className={`h-full transition-all ${
                  rsi.rsi14 >= 70
                    ? 'bg-rose-500'
                    : rsi.rsi14 <= 30
                    ? 'bg-emerald-500'
                    : 'bg-fuchsia-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, rsi.rsi14))}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>0 (Oversold &lt;30)</span>
              <span>50 Mid</span>
              <span>100 (Overbought &gt;70)</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 font-mono pt-2 border-t border-slate-800">
            Signal: <strong className="text-slate-200">{rsi.signal}</strong>
          </div>
        </div>

        {/* Card 3: MACD Momentum */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-white text-sm">MACD (12, 26, 9)</h3>
            </div>
            <span className="text-[11px] font-mono font-bold text-slate-300">{macd.crossover}</span>
          </div>

          <div className="space-y-2.5 text-xs font-mono">
            <div className="flex justify-between items-center p-2 rounded bg-slate-950/60">
              <span className="text-slate-400">MACD Line:</span>
              <span className="font-bold text-white">{macd.macdLine}</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded bg-slate-950/60">
              <span className="text-slate-400">Signal Line:</span>
              <span className="font-bold text-white">{macd.signalLine}</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded bg-slate-950/60">
              <span className="text-slate-400">Histogram:</span>
              <span
                className={`font-bold ${
                  macd.histogram >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {macd.histogram >= 0 ? '+' : ''}{macd.histogram}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 font-mono pt-2 border-t border-slate-800">
            Momentum state: {macd.histogram > 0 ? 'Positive expansion' : 'Negative contraction'}
          </div>
        </div>

        {/* Card 4: Support & Resistance Pivot Matrix */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-white text-sm">Support & Resistance Pivots</h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Pivot High/Low</span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/20">
              <div className="text-[11px] text-rose-300 font-bold">KEY OVERHEAD RESISTANCE</div>
              <div className="text-lg font-bold text-white mt-0.5">
                ${supportResistance.nearestResistance.toLocaleString()}
              </div>
            </div>

            <div className="p-2.5 rounded bg-emerald-500/10 border border-emerald-500/20">
              <div className="text-[11px] text-emerald-300 font-bold">KEY STRUCTURAL SUPPORT</div>
              <div className="text-lg font-bold text-white mt-0.5">
                ${supportResistance.nearestSupport.toLocaleString()}
              </div>
            </div>

            <div className="text-[11px] text-slate-400 pt-1">
              Supports: {supportResistance.supports.map((s) => `$${s}`).join(', ') || 'N/A'}
            </div>
          </div>
        </div>

        {/* Card 5: Fibonacci Retracement Levels */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-amber-300" />
              <h3 className="font-bold text-white text-sm">Fibonacci Swings</h3>
            </div>
            <span className="text-[11px] font-mono text-amber-400 font-bold">Golden Pocket</span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span className="text-slate-400">0.236 Retrace:</span>
              <span className="text-slate-200">${fibonacci.fib236}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span className="text-slate-400">0.382 Retrace:</span>
              <span className="text-slate-200">${fibonacci.fib382}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span className="text-sky-400 font-bold">0.500 Equilibrium:</span>
              <span className="text-sky-300 font-bold">${fibonacci.fib500}</span>
            </div>
            <div className="flex justify-between items-center py-1 bg-amber-500/10 px-2 rounded border border-amber-500/20">
              <span className="text-amber-300 font-bold">0.618 Golden Pocket:</span>
              <span className="text-amber-300 font-bold">${fibonacci.fib618}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-t border-slate-800/60">
              <span className="text-purple-400">0.786 Deep Retrace:</span>
              <span className="text-purple-300">${fibonacci.fib786}</span>
            </div>
          </div>
        </div>

        {/* Card 6: Smart Money Concepts (ICT) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-white text-sm">Smart Money / ICT Concepts</h3>
            </div>
            <span className="text-[11px] font-mono font-bold text-emerald-400">{smc.marketBias}</span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="p-2 rounded bg-slate-950/60">
              <span className="text-slate-400 text-[11px]">BUY-SIDE LIQUIDITY (BSL):</span>
              <div className="text-sm font-bold text-slate-100">${smc.liquidityPools.buySideLiquidity}</div>
            </div>
            <div className="p-2 rounded bg-slate-950/60">
              <span className="text-slate-400 text-[11px]">SELL-SIDE LIQUIDITY (SSL):</span>
              <div className="text-sm font-bold text-slate-100">${smc.liquidityPools.sellSideLiquidity}</div>
            </div>
            <div className="p-2 rounded bg-slate-950/60">
              <span className="text-slate-400 text-[11px]">ORDER BLOCKS (OB):</span>
              <div className="text-sm font-bold text-slate-100">{smc.orderBlocks.length} institutional zones</div>
            </div>
            <div className="p-2 rounded bg-slate-950/60">
              <span className="text-slate-400 text-[11px]">FAIR VALUE GAPS (FVG):</span>
              <div className="text-sm font-bold text-slate-100">{smc.fairValueGaps.length} imbalance gaps</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
