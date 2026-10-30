import React, { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, Lock, DollarSign } from 'lucide-react';
import { Ticker24h } from '../types/crypto';
import { openPaperOrder } from '../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tickers: Ticker24h[];
  initialSymbol?: string;
  initialParams?: {
    symbol?: string;
    side?: 'LONG' | 'SHORT';
    amountUsd?: number;
    stopLoss?: number;
    takeProfit?: number;
    leverage?: number;
  } | null;
  onOrderCompleted: () => void;
}

export const OrderModal: React.FC<Props> = ({
  isOpen,
  onClose,
  tickers,
  initialSymbol = 'BTCUSDT',
  initialParams,
  onOrderCompleted,
}) => {
  const [symbol, setSymbol] = useState(initialSymbol);
  const [side, setSide] = useState<'LONG' | 'SHORT'>('LONG');
  const [amountUsd, setAmountUsd] = useState<number>(1000);
  const [leverage, setLeverage] = useState<number>(3);
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialParams) {
      if (initialParams.symbol) setSymbol(initialParams.symbol);
      if (initialParams.side) setSide(initialParams.side);
      if (initialParams.amountUsd) setAmountUsd(initialParams.amountUsd);
      if (initialParams.leverage) setLeverage(initialParams.leverage);
      if (initialParams.stopLoss) setStopLoss(initialParams.stopLoss.toString());
      if (initialParams.takeProfit) setTakeProfit(initialParams.takeProfit.toString());
    } else {
      setSymbol(initialSymbol);
    }
  }, [initialParams, initialSymbol, isOpen]);

  if (!isOpen) return null;

  const currentTicker = tickers.find((t) => t.symbol === symbol);
  const currentPrice = currentTicker?.lastPrice || 87450;
  const marginRequired = amountUsd / leverage;
  const estimatedFee = (amountUsd * 0.05) / 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await openPaperOrder({
        symbol,
        side,
        amountUsd,
        currentPrice,
        leverage,
        stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
        takeProfit: takeProfit ? parseFloat(takeProfit) : undefined,
      });

      if (res.success) {
        onOrderCompleted();
        onClose();
      } else {
        setError(res.error || 'Failed to place order.');
      }
    } catch (err: any) {
      setError(err.message || 'Error executing order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Paper Trade Order Ticket</h3>
              <span className="text-[10px] text-slate-400 font-mono">SIMULATION ONLY - ZERO RISK</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border-b border-rose-500/30 text-rose-300 text-xs font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs font-mono">
          {/* Symbol */}
          <div>
            <label className="block text-slate-400 mb-1 font-bold">ASSET</label>
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 outline-none"
            >
              {tickers.map((t) => (
                <option key={t.symbol} value={t.symbol}>
                  {t.baseAsset}/USDT (${t.lastPrice.toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          {/* Side */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSide('LONG')}
              className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition ${
                side === 'LONG'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" /> LONG (Buy)
            </button>
            <button
              type="button"
              onClick={() => setSide('SHORT')}
              className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition ${
                side === 'SHORT'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" /> SHORT (Sell)
            </button>
          </div>

          {/* Amount */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-400 font-bold">ORDER SIZE (USDT)</span>
              <span className="text-slate-400">Margin: ${marginRequired.toFixed(2)}</span>
            </div>
            <input
              type="number"
              min="10"
              step="50"
              value={amountUsd}
              onChange={(e) => setAmountUsd(Number(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 outline-none font-bold"
            />
          </div>

          {/* Leverage */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-400 font-bold">LEVERAGE</span>
              <span className="text-emerald-400 font-bold">{leverage}x</span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              step="1"
              value={leverage}
              onChange={(e) => setLeverage(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Take Profit & Stop Loss */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-emerald-400 mb-1 font-bold">TAKE PROFIT</label>
              <input
                type="number"
                step="any"
                placeholder="Optional"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:border-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-rose-400 mb-1 font-bold">STOP LOSS</label>
              <input
                type="number"
                step="any"
                placeholder="Optional"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:border-rose-500 outline-none"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Market Execution:</span>
              <span className="text-slate-200">${currentPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Simulated Fee (0.05%):</span>
              <span className="text-slate-200">${estimatedFee.toFixed(2)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-3 rounded-xl font-bold text-sm transition shadow-lg ${
              side === 'LONG'
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                : 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
            }`}
          >
            {submitting ? 'Executing...' : `Execute Simulated ${side}`}
          </button>
        </form>
      </div>
    </div>
  );
};
