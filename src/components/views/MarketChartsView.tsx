import React, { useState } from 'react';
import {
  Ticker24h,
  Candle,
  TechnicalAnalysisResult,
} from '../../types/crypto';
import { CandlestickChart } from '../CandlestickChart';
import { TradingViewChart } from '../TradingViewChart';
import { CryptoSelector } from '../CryptoSelector';
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  Layers,
  Activity,
  Bot,
  Wallet,
  Target,
  Clock,
  RefreshCw,
  LineChart as LineChartIcon,
  Zap,
} from 'lucide-react';
import { generateAiAnalysis } from '../../services/api';

interface Props {
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  selectedInterval: string;
  onSelectInterval: (interval: string) => void;
  candles: Candle[];
  tickers: Ticker24h[];
  technicals?: TechnicalAnalysisResult | null;
  isDelayed?: boolean;
  dataSource?: string;
  onRefreshCandles: () => void;
  onOpenOrderModal: () => void;
  onOpenPredictionModal: () => void;
}

const TIMEFRAMES = [
  { label: '1m', value: '1m' },
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
  { label: '1h', value: '1h' },
  { label: '4h', value: '4h' },
  { label: '1d', value: '1d' },
];

export const MarketChartsView: React.FC<Props> = ({
  selectedSymbol,
  onSelectSymbol,
  selectedInterval,
  onSelectInterval,
  candles,
  tickers,
  technicals,
  isDelayed,
  dataSource,
  onRefreshCandles,
  onOpenOrderModal,
  onOpenPredictionModal,
}) => {
  const currentTicker = tickers.find((t) => t.symbol === selectedSymbol);
  const [chartMode, setChartMode] = useState<'TRADING_VIEW' | 'ALGOSMC'>('TRADING_VIEW');
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const handleGenerateAiReport = async () => {
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

  return (
    <div className="space-y-4">
      {/* 1. Header Toolbar with Universal Crypto Selector & Chart Mode Switch */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex flex-wrap items-center gap-3">
          {/* Universal Crypto Search & Selector */}
          <CryptoSelector
            selectedSymbol={selectedSymbol}
            onSelectSymbol={onSelectSymbol}
            tickers={tickers}
          />

          {/* Chart Engine Switch */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setChartMode('TRADING_VIEW')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-bold ${
                chartMode === 'TRADING_VIEW'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LineChartIcon className="w-3.5 h-3.5" />
              <span>TradingView Pro Live</span>
            </button>
            <button
              onClick={() => setChartMode('ALGOSMC')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-bold ${
                chartMode === 'ALGOSMC'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>CryptoPilot SMC/ICT</span>
            </button>
          </div>
        </div>

        {/* Timeframe Selectors & Quick Action */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.value}
                onClick={() => onSelectInterval(tf.value)}
                className={`px-2.5 py-1 text-xs font-mono font-semibold rounded transition ${
                  selectedInterval === tf.value
                    ? 'bg-slate-800 text-emerald-400 font-bold border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleGenerateAiReport}
            disabled={loadingAi}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-bold border border-emerald-500/30 transition text-xs font-mono"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{loadingAi ? 'Analyzing...' : 'AI Analysis'}</span>
          </button>
        </div>
      </div>

      {/* 2. Real-Time Market Ticker Stats Strip */}
      {currentTicker && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl font-mono text-xs">
          <div>
            <span className="text-slate-400 text-[11px]">PRICE (USD)</span>
            <div className="text-base font-bold text-white mt-0.5">
              ${currentTicker.lastPrice >= 1 ? currentTicker.lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : currentTicker.lastPrice}
            </div>
          </div>

          <div>
            <span className="text-slate-400 text-[11px]">24H CHANGE</span>
            <div
              className={`text-sm font-bold mt-0.5 flex items-center gap-1 ${
                currentTicker.priceChangePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {currentTicker.priceChangePercent >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {currentTicker.priceChangePercent >= 0 ? '+' : ''}{currentTicker.priceChangePercent}%
            </div>
          </div>

          <div>
            <span className="text-slate-400 text-[11px]">24H HIGH</span>
            <div className="text-sm font-semibold text-slate-200 mt-0.5">
              ${currentTicker.highPrice.toLocaleString()}
            </div>
          </div>

          <div>
            <span className="text-slate-400 text-[11px]">24H LOW</span>
            <div className="text-sm font-semibold text-slate-200 mt-0.5">
              ${currentTicker.lowPrice.toLocaleString()}
            </div>
          </div>

          <div>
            <span className="text-slate-400 text-[11px]">24H VOLUME</span>
            <div className="text-sm font-semibold text-slate-200 mt-0.5">
              ${(currentTicker.quoteVolume24h / 1e6).toFixed(1)}M
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 col-span-2 sm:col-span-1 lg:col-span-1">
            <button
              onClick={onOpenOrderModal}
              className="w-full py-1.5 px-3 rounded-lg font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition shadow-md shadow-emerald-500/20"
            >
              Paper Trade
            </button>
          </div>
        </div>
      )}

      {/* 3. Primary Chart Display (TradingView or Custom Algorithmic SMC) */}
      {chartMode === 'TRADING_VIEW' ? (
        <TradingViewChart
          symbol={selectedSymbol}
          interval={selectedInterval}
          height={540}
        />
      ) : (
        <CandlestickChart
          candles={candles}
          technicals={technicals}
          symbol={selectedSymbol}
          interval={selectedInterval}
          isDelayed={isDelayed}
          dataSource={dataSource}
          onRefresh={onRefreshCandles}
        />
      )}

      {/* 4. AI Deep Dive Report Drawer (if triggered) */}
      {aiReport && (
        <div className="p-5 bg-slate-900 border border-emerald-500/30 rounded-xl shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-white text-base">
                CryptoPilot AI Quantitative Intelligence: {selectedSymbol} ({selectedInterval.toUpperCase()})
              </h3>
            </div>
            <button
              onClick={() => setAiReport(null)}
              className="text-xs text-slate-400 hover:text-white font-mono"
            >
              Dismiss
            </button>
          </div>
          <div className="prose prose-invert max-w-none text-sm text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
            {aiReport}
          </div>
          <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <span className="text-slate-400">
              Evaluated with live EMA, Pivot S/R, and Smart Money Concepts.
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenPredictionModal}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold border border-slate-700 transition"
              >
                + Record Forecast From This Setup
              </button>
              <button
                onClick={onOpenOrderModal}
                className="px-3 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition"
              >
                Execute Paper Trade
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Chart Bottom Quick Confluence Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Support & Resistance Readout */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
            <span>PIVOT SUPPORT & RESISTANCE</span>
            <span className="text-emerald-400 font-bold">Pivots</span>
          </div>
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex justify-between items-center">
              <span className="text-rose-400">Key Resistance:</span>
              <span className="font-bold text-white">${technicals?.supportResistance.nearestResistance ?? 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-emerald-400">Key Support:</span>
              <span className="font-bold text-white">${technicals?.supportResistance.nearestSupport ?? 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-800 text-slate-400">
              <span>Fib 0.618 Pocket:</span>
              <span className="text-amber-400 font-bold">${technicals?.fibonacci.fib618 ?? 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Smart Money Concepts (SMC) Summary */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
            <span>SMART MONEY (ICT) STRUCTURE</span>
            <span className="text-sky-400 font-bold">Order Flow</span>
          </div>
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Market Bias:</span>
              <span className="font-bold text-emerald-400">{technicals?.smc.marketBias ?? 'BULLISH'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Fair Value Gaps:</span>
              <span className="font-bold text-white">{technicals?.smc.fairValueGaps.length ?? 0} active zones</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-800 text-slate-400">
              <span>Buy-Side Liquidity:</span>
              <span className="text-slate-200 font-bold">${technicals?.smc.liquidityPools.buySideLiquidity ?? 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Quantitative Composite Gauge */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
            <span>ALGORITHMIC SIGNAL</span>
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xl font-bold font-mono text-white">
                {technicals?.compositeScore ?? 65}/100
              </div>
              <span className="text-xs font-bold text-emerald-400">
                {technicals?.recommendation ?? 'BUY'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenOrderModal}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition"
              >
                Simulate Order
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
