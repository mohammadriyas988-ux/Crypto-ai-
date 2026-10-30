import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  ShieldCheck,
  Bot,
  ArrowRight,
  Flame,
  Clock,
  Sparkles,
  Wallet,
  Search,
  Filter,
} from 'lucide-react';
import { Ticker24h, Prediction, PaperAccount, TechnicalAnalysisResult } from '../../types/crypto';

interface Props {
  tickers: Ticker24h[];
  predictions: Prediction[];
  paperAccount?: PaperAccount | null;
  technicals?: TechnicalAnalysisResult | null;
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  onNavigateTab: (tab: any) => void;
  onOpenOrderModal: () => void;
  onOpenPredictionModal: () => void;
}

const CATEGORIES = [
  { id: 'ALL', label: 'All Cryptos' },
  { id: 'MAJORS', label: 'Majors' },
  { id: 'LAYER1', label: 'Layer 1' },
  { id: 'LAYER2', label: 'Layer 2' },
  { id: 'DEFI', label: 'DeFi' },
  { id: 'AI_DATA', label: 'AI & Data' },
  { id: 'MEMES', label: 'Memes' },
  { id: 'INFRA', label: 'Infra / RWA' },
];

export const OverviewView: React.FC<Props> = ({
  tickers,
  predictions,
  paperAccount,
  technicals,
  selectedSymbol,
  onSelectSymbol,
  onNavigateTab,
  onOpenOrderModal,
  onOpenPredictionModal,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const btcTicker = tickers.find((t) => t.symbol === 'BTCUSDT');
  const evaluatedPreds = predictions.filter((p) => p.status !== 'PENDING');
  const winningPreds = evaluatedPreds.filter((p) => p.status === 'WIN');
  const pendingPreds = predictions.filter((p) => p.status === 'PENDING');
  const winRate = evaluatedPreds.length > 0 ? ((winningPreds.length / evaluatedPreds.length) * 100).toFixed(1) : '75.0';

  // Overall market momentum calculation
  const gainers = tickers.filter((t) => t.priceChangePercent > 0);
  const marketSentiment = gainers.length >= tickers.length * 0.6
    ? { text: 'Bullish Momentum', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' }
    : gainers.length <= tickers.length * 0.4
    ? { text: 'Bearish Pressure', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' }
    : { text: 'Consolidation / Mixed', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' };

  const filteredTickers = useMemo(() => {
    return tickers.filter((t) => {
      const matchesCategory = selectedCategory === 'ALL' || t.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        t.symbol.toLowerCase().includes(q) ||
        t.baseAsset.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [tickers, selectedCategory, searchQuery]);

  return (
    <div className="space-y-6">
      {/* 1. Hero Market Intelligence Bar */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 p-6 shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                CryptoPilot Core Live
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${marketSentiment.bg} ${marketSentiment.color}`}>
                {marketSentiment.text}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              AI Market Intelligence & Trading Research
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Real-time multi-timeframe analysis blending institutional Smart Money Concepts (SMC, FVGs, Order Blocks) with quantitative moving averages, algorithmic prediction validation, and zero-risk paper trading.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigateTab('chat')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition"
            >
              <Bot className="w-4 h-4" />
              <span>Ask AI Copilot</span>
            </button>
            <button
              onClick={() => onNavigateTab('charts')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 transition"
            >
              <span>Explore Charts</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Snapshot Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Benchmark BTC */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>BENCHMARK ASSET</span>
            <span className="text-emerald-400 font-bold">BTC/USDT</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-white">
              ${btcTicker ? btcTicker.lastPrice.toLocaleString() : '87,450.00'}
            </span>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded font-mono ${
                (btcTicker?.priceChangePercent || 0) >= 0
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-rose-500/15 text-rose-400'
              }`}
            >
              {(btcTicker?.priceChangePercent || 0) >= 0 ? '+' : ''}
              {btcTicker?.priceChangePercent ?? 2.34}%
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>24h High: ${btcTicker ? btcTicker.highPrice.toLocaleString() : '88,120'}</span>
            <span>Vol: {btcTicker ? `${(btcTicker.quoteVolume24h / 1e9).toFixed(2)}B` : '$2.8B'}</span>
          </div>
        </div>

        {/* Metric 2: Prediction Accuracy */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>PREDICTION WIN RATE</span>
            <Target className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-emerald-400">{winRate}%</span>
            <span className="text-xs text-slate-400 font-mono">
              {winningPreds.length}W - {evaluatedPreds.length - winningPreds.length}L
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Evaluated: {evaluatedPreds.length}</span>
            <span className="text-amber-400 font-medium">Pending: {pendingPreds.length}</span>
          </div>
        </div>

        {/* Metric 3: Virtual Paper Trading Balance */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>PAPER TRADING EQUITY</span>
            <Wallet className="w-4 h-4 text-teal-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-white">
              ${paperAccount?.equityUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '50,000.00'}
            </span>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded font-mono ${
                (paperAccount?.totalRealizedPnl || 0) >= 0
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-rose-500/15 text-rose-400'
              }`}
            >
              {(paperAccount?.totalRealizedPnl || 0) >= 0 ? '+' : ''}$
              {paperAccount?.totalRealizedPnl.toFixed(2) ?? '0.00'}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Open: {paperAccount?.openPositions.length ?? 0}</span>
            <span>Closed Trades: {paperAccount?.tradeHistory.length ?? 0}</span>
          </div>
        </div>

        {/* Metric 4: Risk Protocol Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>RISK ENGINE</span>
            <ShieldCheck className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-sky-400">1.5% Cap</span>
            <span className="text-xs text-slate-400 font-mono">Min 1:2 R:R</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Live Exec: <strong className="text-amber-400">Disabled</strong></span>
            <span className="text-emerald-400">Paper Safe</span>
          </div>
        </div>
      </div>

      {/* 3. Market Watchlist Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <h2 className="font-bold text-base text-white">All Cryptocurrencies Watchlist</h2>
            <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/25">
              {filteredTickers.length} Coins Listed
            </span>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search coin (e.g. BTC, SUI, PEPE)..."
              className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none font-mono"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="px-4 py-2 border-b border-slate-800/80 bg-slate-950/40 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs font-mono">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-md transition whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800/70 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left text-sm font-mono">
            <thead className="bg-slate-950/80 text-slate-400 text-xs uppercase border-b border-slate-800 sticky top-0 z-10 backdrop-blur">
              <tr>
                <th className="px-4 py-3">Asset</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">24h Change</th>
                <th className="px-4 py-3 hidden md:table-cell">24h High / Low</th>
                <th className="px-4 py-3 hidden lg:table-cell">24h Volume</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTickers.map((t) => {
                const isSelected = selectedSymbol === t.symbol;
                const isPos = t.priceChangePercent >= 0;
                return (
                  <tr
                    key={t.symbol}
                    onClick={() => onSelectSymbol(t.symbol)}
                    className={`cursor-pointer transition hover:bg-slate-800/50 ${
                      isSelected ? 'bg-emerald-500/5 border-l-2 border-emerald-500' : ''
                    }`}
                  >
                    <td className="px-4 py-3.5 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-white">
                        {t.baseAsset.substring(0, 3)}
                      </div>
                      <div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          {t.baseAsset}
                          <span className="text-[10px] text-slate-400 font-normal">/USDT</span>
                        </div>
                        <div className="text-[11px] text-slate-400">{t.name}</div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
                        {t.category || 'CRYPTO'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 font-bold text-slate-100">
                      ${t.lastPrice >= 1 ? t.lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : t.lastPrice}
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
                          isPos
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-rose-500/15 text-rose-400'
                        }`}
                      >
                        {isPos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {isPos ? '+' : ''}{t.priceChangePercent}%
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-xs text-slate-300 hidden md:table-cell">
                      <div>H: ${t.highPrice.toLocaleString()}</div>
                      <div className="text-slate-400">L: ${t.lowPrice.toLocaleString()}</div>
                    </td>

                    <td className="px-4 py-3.5 text-xs text-slate-300 hidden lg:table-cell">
                      ${(t.quoteVolume24h / 1e6).toFixed(1)}M
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectSymbol(t.symbol);
                            onNavigateTab('charts');
                          }}
                          className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                        >
                          Chart
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectSymbol(t.symbol);
                            onOpenOrderModal();
                          }}
                          className="px-2.5 py-1 text-xs rounded font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 transition"
                        >
                          Trade
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Predictions & Active Research Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Active Recorded Predictions */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-white">Active Research Forecasts</h3>
              </div>
              <button
                onClick={() => onNavigateTab('predictions')}
                className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-mono"
              >
                View All ({predictions.length}) <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3">
              {predictions.slice(0, 3).map((pred) => {
                const isPending = pred.status === 'PENDING';
                const isBullish = pred.direction === 'BULLISH';
                const timeLeftHours = Math.max(0, (pred.horizonTimestamp - Date.now()) / (3600 * 1000));

                return (
                  <div
                    key={pred.id}
                    className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs font-mono">{pred.symbol}</span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${
                            isBullish
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {pred.direction}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {pred.confidencePercent}% Conf
                        </span>
                      </div>

                      <span
                        className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                          pred.status === 'WIN'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : pred.status === 'LOSS' || pred.status === 'INVALIDATED'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        }`}
                      >
                        {pred.status}
                      </span>
                    </div>

                    <div className="mt-2 text-xs text-slate-300 line-clamp-1">
                      {pred.rationale}
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800/60">
                      <span>Entry: ${pred.entryPrice.toLocaleString()}</span>
                      <span>Target: ${pred.targetPrice.toLocaleString()}</span>
                      <span className="flex items-center gap-1 text-slate-300">
                        <Clock className="w-3 h-3 text-amber-400" />
                        {isPending ? `${timeLeftHours.toFixed(1)}h left` : 'Evaluated'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Rule 5: Evaluated only after horizon elapses.</span>
            <button
              onClick={onOpenPredictionModal}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition"
            >
              + Log New Forecast
            </button>
          </div>
        </div>

        {/* Right: Technical Snapshot of Selected Coin */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-sky-400" />
                <h3 className="font-bold text-white">Selected Asset: {selectedSymbol}</h3>
              </div>
              <button
                onClick={() => onNavigateTab('analysis')}
                className="text-xs text-sky-400 hover:underline flex items-center gap-1 font-mono"
              >
                Deep Analysis <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {technicals ? (
              <div className="space-y-4">
                {/* Composite score bar */}
                <div>
                  <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                    <span className="text-slate-400">Algorithmic Confluence Score</span>
                    <span className="font-bold text-white">
                      {technicals.compositeScore}/100 ({technicals.recommendation})
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex">
                    <div
                      className={`h-full transition-all duration-500 ${
                        technicals.compositeScore >= 60
                          ? 'bg-emerald-500'
                          : technicals.compositeScore <= 40
                          ? 'bg-rose-500'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${technicals.compositeScore}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                    <span className="text-slate-400 text-[11px]">EMA TREND</span>
                    <p className="font-bold text-slate-100 mt-0.5">{technicals.ema.trend}</p>
                    <span className="text-[10px] text-slate-400">EMA 21: ${technicals.ema.ema21}</span>
                  </div>
                  <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                    <span className="text-slate-400 text-[11px]">RSI (14)</span>
                    <p className="font-bold text-slate-100 mt-0.5">{technicals.rsi.rsi14}</p>
                    <span className="text-[10px] text-slate-400">{technicals.rsi.condition}</span>
                  </div>
                  <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                    <span className="text-slate-400 text-[11px]">MACD HISTOGRAM</span>
                    <p className={`font-bold mt-0.5 ${technicals.macd.histogram >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {technicals.macd.histogram}
                    </p>
                    <span className="text-[10px] text-slate-400">{technicals.macd.crossover}</span>
                  </div>
                  <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                    <span className="text-slate-400 text-[11px]">SMC MARKET BIAS</span>
                    <p className="font-bold text-slate-100 mt-0.5">{technicals.smc.marketBias}</p>
                    <span className="text-[10px] text-slate-400">{technicals.smc.fairValueGaps.length} FVGs detected</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-slate-400 font-mono">
                Loading quantitative indicators...
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">
              Key Support: ${technicals?.supportResistance.nearestSupport ?? 'N/A'}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Key Resistance: ${technicals?.supportResistance.nearestResistance ?? 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
