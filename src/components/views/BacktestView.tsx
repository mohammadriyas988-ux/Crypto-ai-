import React, { useState } from 'react';
import {
  History,
  TrendingUp,
  TrendingDown,
  Play,
  RotateCcw,
  ShieldAlert,
  Percent,
  DollarSign,
  Activity,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { BacktestResult, Ticker24h } from '../../types/crypto';
import { runBacktest } from '../../services/api';

interface Props {
  selectedSymbol: string;
  tickers: Ticker24h[];
}

export const BacktestView: React.FC<Props> = ({ selectedSymbol, tickers }) => {
  const [strategy, setStrategy] = useState<string>('EMA_CROSSOVER');
  const [symbol, setSymbol] = useState<string>(selectedSymbol || 'BTCUSDT');
  const [timeframe, setTimeframe] = useState<string>('1h');
  const [candleCount, setCandleCount] = useState<number>(200);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRun = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await runBacktest({
        strategyName: strategy,
        symbol,
        timeframe,
        limit: candleCount,
      });
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Backtest failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Transparency Notice */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-emerald-400" />
          <h2 className="text-xl font-bold text-white">Historical Strategy Backtesting Lab</h2>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Evaluate trading strategies strictly on historical OHLCV candle data with simulated execution fees (0.05%) and slippage (0.03%).
        </p>
        <div className="text-[11px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg">
          <strong>Transparency Notice:</strong> No machine learning model is claimed to be trained without empirical verification. Past performance does not guarantee future results.
        </div>
      </div>

      {/* 2. Setup Controls */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          {/* Strategy */}
          <div>
            <label className="block text-slate-400 mb-1.5 font-bold">ALGORITHMIC STRATEGY</label>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 outline-none"
            >
              <option value="EMA_CROSSOVER">EMA 9/21 Trend Crossover (with 50 EMA filter)</option>
              <option value="RSI_MEAN_REVERSION">RSI Extremes (Oversold &lt;30 / Overbought &gt;70)</option>
              <option value="MACD_MOMENTUM">MACD Impulse & SMC Retest</option>
            </select>
          </div>

          {/* Symbol */}
          <div>
            <label className="block text-slate-400 mb-1.5 font-bold">ASSET PAIR</label>
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 outline-none"
            >
              {tickers.map((t) => (
                <option key={t.symbol} value={t.symbol}>
                  {t.baseAsset}/USDT - {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Timeframe */}
          <div>
            <label className="block text-slate-400 mb-1.5 font-bold">CANDLE TIMEFRAME</label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 outline-none"
            >
              <option value="15m">15 Minutes</option>
              <option value="1h">1 Hour</option>
              <option value="4h">4 Hours</option>
              <option value="1d">1 Day</option>
            </select>
          </div>

          {/* Sample Size */}
          <div>
            <label className="block text-slate-400 mb-1.5 font-bold">HISTORICAL SAMPLE SIZE</label>
            <select
              value={candleCount}
              onChange={(e) => setCandleCount(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 outline-none"
            >
              <option value={100}>100 Candles</option>
              <option value={180}>180 Candles</option>
              <option value={250}>250 Candles</option>
              <option value={300}>300 Candles (Max)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <span className="text-xs font-mono text-slate-400">
            Simulates 2% risk sizing, 1:2.2 R:R targets, and exchange taker fees.
          </span>
          <button
            onClick={handleRun}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition shadow-lg shadow-emerald-500/20"
          >
            <Play className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Simulating Historical Trades...' : 'Run Backtest Engine'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs font-mono text-rose-300">
          {error}
        </div>
      )}

      {/* 3. Results Dashboard */}
      {result && (
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-slate-400 text-[11px]">NET PROFIT</span>
              <div
                className={`text-xl font-bold mt-1 ${
                  result.netProfitUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {result.netProfitUsd >= 0 ? '+' : ''}${result.netProfitUsd.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-400">
                ({result.netProfitPercent >= 0 ? '+' : ''}{result.netProfitPercent}%)
              </span>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-slate-400 text-[11px]">WIN RATE</span>
              <div className="text-xl font-bold text-emerald-400 mt-1">
                {result.winRatePercent}%
              </div>
              <span className="text-[10px] text-slate-400">
                {result.winningTrades}W / {result.losingTrades}L
              </span>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-slate-400 text-[11px]">PROFIT FACTOR</span>
              <div className="text-xl font-bold text-sky-400 mt-1">
                {result.profitFactor}
              </div>
              <span className="text-[10px] text-slate-400">Gains / Losses</span>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-slate-400 text-[11px]">MAX DRAWDOWN</span>
              <div className="text-xl font-bold text-rose-400 mt-1">
                -{result.maxDrawdownPercent}%
              </div>
              <span className="text-[10px] text-slate-400">Peak to trough</span>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-slate-400 text-[11px]">TOTAL TRADES</span>
              <div className="text-xl font-bold text-white mt-1">
                {result.totalTrades}
              </div>
              <span className="text-[10px] text-slate-400">Execution sample</span>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-slate-400 text-[11px]">FINAL EQUITY</span>
              <div className="text-xl font-bold text-slate-100 mt-1">
                ${result.finalBalance.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-400">From ${result.initialBalance.toLocaleString()}</span>
            </div>
          </div>

          {/* Equity Curve SVG Chart */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-mono">
              <span className="font-bold text-white">SIMULATED PORTFOLIO EQUITY CURVE (USD)</span>
              <span className="text-slate-400">Includes Fees & Slippage Deductions</span>
            </div>

            <div className="w-full h-48 flex items-end relative pt-6 pb-2">
              {result.equityCurve.length > 1 ? (
                <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 200">
                  <defs>
                    <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Draw Polyline */}
                  {(() => {
                    const equities = result.equityCurve.map((e) => e.equity);
                    const minEq = Math.min(...equities) * 0.98;
                    const maxEq = Math.max(...equities) * 1.02;
                    const range = maxEq - minEq || 1;

                    const points = result.equityCurve.map((pt, idx) => {
                      const x = (idx / (result.equityCurve.length - 1)) * 1000;
                      const y = 200 - ((pt.equity - minEq) / range) * 180 - 10;
                      return `${x},${y}`;
                    }).join(' ');

                    const areaPoints = `0,200 ${points} 1000,200`;

                    return (
                      <>
                        <polygon points={areaPoints} fill="url(#equityGrad)" />
                        <polyline
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={points}
                        />
                      </>
                    );
                  })()}
                </svg>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 font-mono">
                  No trade equity variance detected in sample.
                </div>
              )}
            </div>

            <div className="flex justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-800">
              <span>Start: ${result.initialBalance.toLocaleString()} ({result.startDate})</span>
              <span>End: ${result.finalBalance.toLocaleString()} ({result.endDate})</span>
            </div>
          </div>

          {/* Trade Execution Log */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <h3 className="font-bold text-white text-sm">Simulated Trade Log ({result.trades.length} Executions)</h3>
              <span className="text-xs font-mono text-slate-400">Sorted chronologically</span>
            </div>

            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 uppercase sticky top-0 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-2.5">Side</th>
                    <th className="px-4 py-2.5">Entry Price</th>
                    <th className="px-4 py-2.5">Exit Price</th>
                    <th className="px-4 py-2.5">PnL (%)</th>
                    <th className="px-4 py-2.5">Net PnL ($)</th>
                    <th className="px-4 py-2.5">Exit Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {result.trades.map((tr, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="px-4 py-2.5 font-bold">
                        <span className={tr.side === 'LONG' ? 'text-emerald-400' : 'text-rose-400'}>
                          {tr.side}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-200">${tr.entryPrice.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-slate-200">${tr.exitPrice.toLocaleString()}</td>
                      <td className="px-4 py-2.5 font-bold">
                        <span className={tr.pnlPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {tr.pnlPercent >= 0 ? '+' : ''}{tr.pnlPercent}%
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-bold">
                        <span className={tr.pnlUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {tr.pnlUsd >= 0 ? '+' : ''}${tr.pnlUsd.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-400">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[11px]">
                          {tr.reason}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
