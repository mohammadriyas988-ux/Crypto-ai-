import React, { useState, useEffect } from 'react';
import {
  Calculator,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  CheckCircle2,
} from 'lucide-react';
import { Ticker24h, PaperAccount } from '../../types/crypto';

interface Props {
  selectedSymbol: string;
  tickers: Ticker24h[];
  paperAccount?: PaperAccount | null;
  onOpenOrderModalWithParams: (params: {
    symbol: string;
    side: 'LONG' | 'SHORT';
    amountUsd: number;
    stopLoss?: number;
    takeProfit?: number;
    leverage?: number;
  }) => void;
}

export const RiskCalculatorView: React.FC<Props> = ({
  selectedSymbol,
  tickers,
  paperAccount,
  onOpenOrderModalWithParams,
}) => {
  const currentTicker = tickers.find((t) => t.symbol === selectedSymbol);
  const livePrice = currentTicker?.lastPrice || 87450;

  const [accountBalance, setAccountBalance] = useState<number>(paperAccount?.equityUsd || 50000);
  const [riskPercent, setRiskPercent] = useState<number>(1.5);
  const [direction, setDirection] = useState<'LONG' | 'SHORT'>('LONG');
  const [entryPrice, setEntryPrice] = useState<number>(livePrice);
  const [stopLossPrice, setStopLossPrice] = useState<number>(
    direction === 'LONG' ? Number((livePrice * 0.975).toFixed(2)) : Number((livePrice * 1.025).toFixed(2))
  );
  const [takeProfitPrice, setTakeProfitPrice] = useState<number>(
    direction === 'LONG' ? Number((livePrice * 1.055).toFixed(2)) : Number((livePrice * 0.945).toFixed(2))
  );

  useEffect(() => {
    setEntryPrice(livePrice);
    if (direction === 'LONG') {
      setStopLossPrice(Number((livePrice * 0.975).toFixed(2)));
      setTakeProfitPrice(Number((livePrice * 1.055).toFixed(2)));
    } else {
      setStopLossPrice(Number((livePrice * 1.025).toFixed(2)));
      setTakeProfitPrice(Number((livePrice * 0.945).toFixed(2)));
    }
  }, [selectedSymbol]);

  // Calculations
  const dollarRisk = (accountBalance * riskPercent) / 100;

  const stopLossDistance = Math.abs(entryPrice - stopLossPrice);
  const stopLossPercent = entryPrice > 0 ? (stopLossDistance / entryPrice) * 100 : 0;

  const takeProfitDistance = Math.abs(takeProfitPrice - entryPrice);
  const takeProfitPercent = entryPrice > 0 ? (takeProfitDistance / entryPrice) * 100 : 0;

  // Position size in units = Dollar Risk / Stop Loss distance
  const positionSizeUnits = stopLossDistance > 0 ? dollarRisk / stopLossDistance : 0;
  const positionSizeUsd = positionSizeUnits * entryPrice;

  // Leverage recommended if position size > account balance
  const leverageRequired = accountBalance > 0 ? Math.ceil(positionSizeUsd / accountBalance) : 1;

  // Risk Reward Ratio
  const riskRewardRatio = stopLossDistance > 0 ? Number((takeProfitDistance / stopLossDistance).toFixed(2)) : 0;
  const potentialProfitUsd = positionSizeUnits * takeProfitDistance;
  const potentialLossUsd = dollarRisk;

  // Breakeven win rate needed: 1 / (1 + RR)
  const breakevenWinRate = riskRewardRatio > 0 ? ((1 / (1 + riskRewardRatio)) * 100).toFixed(1) : '50.0';

  const handleApplyToPaper = () => {
    onOpenOrderModalWithParams({
      symbol: selectedSymbol,
      side: direction,
      amountUsd: Number(positionSizeUsd.toFixed(2)),
      stopLoss: stopLossPrice,
      takeProfit: takeProfitPrice,
      leverage: Math.min(20, Math.max(1, leverageRequired)),
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Mandatory Uncertainty Label (Rule 6) */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-emerald-400" />
          <h2 className="text-xl font-bold text-white">Institutional Position Sizing & Risk Engine</h2>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Rule 6: Never size positions randomly. Calculate exact capital at risk before opening any trade.
        </p>

        {/* Uncertainty Alert Banner */}
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-3 mt-3">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-200 leading-relaxed font-sans">
            <strong className="font-bold text-amber-300">Mandatory Uncertainty Advisory:</strong> All market analyses, indicator readings, and AI models are probabilistic estimates, not guarantees. Price action carries variance. Always use a defined invalidation stop-loss and limit exposure to 1% - 2% of total equity.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Parameters */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="font-bold text-white text-base pb-2 border-b border-slate-800 flex items-center justify-between">
            <span>Trade Parameters</span>
            <span className="text-xs font-mono text-emerald-400 font-normal">Active: {selectedSymbol}</span>
          </h3>

          {/* Direction toggle */}
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1.5">TRADE DIRECTION</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setDirection('LONG');
                  setStopLossPrice(Number((entryPrice * 0.975).toFixed(2)));
                  setTakeProfitPrice(Number((entryPrice * 1.055).toFixed(2)));
                }}
                className={`py-2 px-4 rounded-lg font-bold text-xs font-mono flex items-center justify-center gap-1.5 transition ${
                  direction === 'LONG'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" /> LONG (Buy)
              </button>
              <button
                type="button"
                onClick={() => {
                  setDirection('SHORT');
                  setStopLossPrice(Number((entryPrice * 1.025).toFixed(2)));
                  setTakeProfitPrice(Number((entryPrice * 0.945).toFixed(2)));
                }}
                className={`py-2 px-4 rounded-lg font-bold text-xs font-mono flex items-center justify-center gap-1.5 transition ${
                  direction === 'SHORT'
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5" /> SHORT (Sell)
              </button>
            </div>
          </div>

          {/* Account Balance */}
          <div>
            <div className="flex justify-between items-center text-xs font-mono mb-1">
              <span className="text-slate-400">ACCOUNT EQUITY (USD)</span>
              {paperAccount && (
                <button
                  type="button"
                  onClick={() => setAccountBalance(paperAccount.equityUsd)}
                  className="text-emerald-400 hover:underline text-[11px]"
                >
                  Sync Virtual (${paperAccount.equityUsd.toLocaleString()})
                </button>
              )}
            </div>
            <div className="relative">
              <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="number"
                value={accountBalance}
                onChange={(e) => setAccountBalance(Number(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white font-mono focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Risk % Preset Buttons */}
          <div>
            <div className="flex justify-between items-center text-xs font-mono mb-1">
              <span className="text-slate-400">PORTFOLIO RISK %</span>
              <span className="text-emerald-400 font-bold">{riskPercent}% (${dollarRisk.toFixed(2)})</span>
            </div>
            <div className="grid grid-cols-4 gap-2 mb-2 font-mono text-xs">
              {[0.5, 1.0, 1.5, 2.0].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setRiskPercent(pct)}
                  className={`py-1.5 rounded transition ${
                    riskPercent === pct
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
            <input
              type="range"
              min="0.25"
              max="5"
              step="0.25"
              value={riskPercent}
              onChange={(e) => setRiskPercent(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Entry Price */}
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">ENTRY PRICE (USD)</label>
            <input
              type="number"
              step="any"
              value={entryPrice}
              onChange={(e) => setEntryPrice(Number(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-emerald-500 outline-none"
            />
          </div>

          {/* Stop-Loss Price */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-rose-400">STOP LOSS PRICE (INVALIDATION)</span>
              <span className="text-slate-400">{stopLossPercent.toFixed(2)}% distance</span>
            </div>
            <input
              type="number"
              step="any"
              value={stopLossPrice}
              onChange={(e) => setStopLossPrice(Number(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-rose-300 font-mono focus:border-rose-500 outline-none"
            />
          </div>

          {/* Take-Profit Price */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-emerald-400">TAKE PROFIT TARGET</span>
              <span className="text-slate-400">{takeProfitPercent.toFixed(2)}% distance</span>
            </div>
            <input
              type="number"
              step="any"
              value={takeProfitPrice}
              onChange={(e) => setTakeProfitPrice(Number(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-emerald-300 font-mono focus:border-emerald-500 outline-none"
            />
          </div>
        </div>

        {/* Right Column: Execution Calculations & Sizing Output */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-bold text-white text-base pb-2 border-b border-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Position Sizing & Risk/Reward Output</span>
            </h3>

            {/* R:R Visual Banner */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">RISK / REWARD RATIO</span>
                <span
                  className={`text-lg font-extrabold ${
                    riskRewardRatio >= 2 ? 'text-emerald-400' : riskRewardRatio >= 1.5 ? 'text-amber-400' : 'text-rose-400'
                  }`}
                >
                  1 : {riskRewardRatio}
                </span>
              </div>
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex font-mono text-[10px]">
                <div
                  className="bg-rose-500 h-full flex items-center justify-center text-white"
                  style={{ width: `${Math.min(50, Math.max(15, 100 / (1 + riskRewardRatio)))}%` }}
                >
                  Risk
                </div>
                <div className="bg-emerald-500 h-full flex-1 flex items-center justify-center text-slate-950 font-bold">
                  Reward
                </div>
              </div>
              <div className="text-[11px] text-slate-400 font-mono flex justify-between pt-1">
                <span>Breakeven Win Rate needed: <strong className="text-white">{breakevenWinRate}%</strong></span>
                <span>{riskRewardRatio >= 2 ? '✓ High Quality Setup' : '⚠ Suboptimal R:R (< 1:2)'}</span>
              </div>
            </div>

            {/* Calculated Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3.5 bg-slate-950/70 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[11px]">MAX DOLLAR RISK:</span>
                <div className="text-lg font-bold text-rose-400 mt-0.5">-${potentialLossUsd.toFixed(2)}</div>
                <span className="text-[10px] text-slate-400">{riskPercent}% of account</span>
              </div>

              <div className="p-3.5 bg-slate-950/70 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[11px]">POTENTIAL PROFIT:</span>
                <div className="text-lg font-bold text-emerald-400 mt-0.5">+${potentialProfitUsd.toFixed(2)}</div>
                <span className="text-[10px] text-slate-400">{takeProfitPercent.toFixed(2)}% gain</span>
              </div>

              <div className="p-3.5 bg-slate-950/70 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[11px]">POSITION SIZE (USD):</span>
                <div className="text-lg font-bold text-white mt-0.5">${positionSizeUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                <span className="text-[10px] text-slate-400">Total notional volume</span>
              </div>

              <div className="p-3.5 bg-slate-950/70 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[11px]">POSITION SIZE (UNITS):</span>
                <div className="text-lg font-bold text-white mt-0.5">{positionSizeUnits.toFixed(4)} {currentTicker?.baseAsset || 'COIN'}</div>
                <span className="text-[10px] text-slate-400">Base units</span>
              </div>
            </div>

            {/* Leverage Advice */}
            <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800 text-xs font-mono space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">RECOMMENDED LEVERAGE:</span>
                <span className="font-bold text-sky-400">{leverageRequired}x</span>
              </div>
              <p className="text-[11px] text-slate-400">
                {leverageRequired <= 1
                  ? 'Spot / 1x margin is sufficient for this position size.'
                  : `Requires ${leverageRequired}x leverage to control $${positionSizeUsd.toFixed(0)} with $${accountBalance.toFixed(0)} equity.`}
              </p>
            </div>
          </div>

          {/* Action button */}
          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={handleApplyToPaper}
              className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition"
            >
              <span>Apply to Paper Trading Ticket</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
