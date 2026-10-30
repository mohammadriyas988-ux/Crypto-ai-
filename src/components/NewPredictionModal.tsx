import React, { useState, useEffect } from 'react';
import { X, Target, Sparkles, TrendingUp, TrendingDown, Clock, ShieldAlert } from 'lucide-react';
import { Ticker24h } from '../types/crypto';
import { createPrediction, generateAiPrediction } from '../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tickers: Ticker24h[];
  initialSymbol?: string;
  onPredictionCreated: () => void;
}

export const NewPredictionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  tickers,
  initialSymbol = 'BTCUSDT',
  onPredictionCreated,
}) => {
  const [symbol, setSymbol] = useState(initialSymbol);
  const [direction, setDirection] = useState<'BULLISH' | 'BEARISH'>('BULLISH');
  const [entryPrice, setEntryPrice] = useState<number>(87450);
  const [targetPrice, setTargetPrice] = useState<number>(91500);
  const [invalidationPrice, setInvalidationPrice] = useState<number>(85200);
  const [horizonHours, setHorizonHours] = useState<number>(24);
  const [confidencePercent, setConfidencePercent] = useState<number>(75);
  const [rationale, setRationale] = useState<string>('');
  const [keyFactors, setKeyFactors] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentTicker = tickers.find((t) => t.symbol === symbol);

  useEffect(() => {
    if (currentTicker) {
      const p = currentTicker.lastPrice;
      setEntryPrice(p);
      if (direction === 'BULLISH') {
        setTargetPrice(Number((p * 1.05).toFixed(2)));
        setInvalidationPrice(Number((p * 0.975).toFixed(2)));
      } else {
        setTargetPrice(Number((p * 0.95).toFixed(2)));
        setInvalidationPrice(Number((p * 1.025).toFixed(2)));
      }
    }
  }, [symbol, direction]);

  if (!isOpen) return null;

  const handleAiAutoFill = async () => {
    setGeneratingAi(true);
    setError(null);
    try {
      const forecast = await generateAiPrediction(symbol, '1h');
      setDirection(forecast.direction);
      setTargetPrice(forecast.targetPrice);
      setInvalidationPrice(forecast.invalidationPrice);
      setHorizonHours(forecast.horizonHours || 24);
      setConfidencePercent(forecast.confidencePercent || 70);
      setRationale(forecast.rationale || '');
      setKeyFactors(forecast.keyFactors ? forecast.keyFactors.join(', ') : '');
    } catch (err: any) {
      setError(`AI Auto-Fill error: ${err.message}`);
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const factorsArray = keyFactors
        .split(',')
        .map((f) => f.trim())
        .filter(Boolean);

      await createPrediction({
        symbol,
        direction,
        entryPrice,
        targetPrice,
        invalidationPrice,
        horizonHours,
        confidencePercent,
        rationale: rationale || `Technical confluence forecast on ${symbol}.`,
        keyFactors: factorsArray.length > 0 ? factorsArray : ['EMA alignment', 'SMC liquidity'],
        isAiGenerated: false,
      });

      onPredictionCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save prediction.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Log Research Forecast</h3>
              <span className="text-[10px] text-slate-400 font-mono">
                Evaluated only after horizon elapses
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAiAutoFill}
              disabled={generatingAi}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{generatingAi ? 'Generating...' : 'AI Suggest'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border-b border-rose-500/30 text-rose-300 text-xs font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs font-mono max-h-[80vh] overflow-y-auto">
          {/* Symbol */}
          <div>
            <label className="block text-slate-400 mb-1 font-bold">ASSET PAIR</label>
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

          {/* Direction */}
          <div>
            <label className="block text-slate-400 mb-1 font-bold">PREDICTED DIRECTION</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDirection('BULLISH')}
                className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition ${
                  direction === 'BULLISH'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" /> BULLISH (Upward)
              </button>
              <button
                type="button"
                onClick={() => setDirection('BEARISH')}
                className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition ${
                  direction === 'BEARISH'
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5" /> BEARISH (Downward)
              </button>
            </div>
          </div>

          {/* Entry, Target, Invalidation */}
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-slate-400 mb-1 font-bold">ENTRY</label>
              <input
                type="number"
                step="any"
                value={entryPrice}
                onChange={(e) => setEntryPrice(Number(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-emerald-400 mb-1 font-bold">TARGET</label>
              <input
                type="number"
                step="any"
                value={targetPrice}
                onChange={(e) => setTargetPrice(Number(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-emerald-300 outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-rose-400 mb-1 font-bold">INVALIDATION</label>
              <input
                type="number"
                step="any"
                value={invalidationPrice}
                onChange={(e) => setInvalidationPrice(Number(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-rose-300 outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Horizon Hours */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-400 font-bold">EVALUATION HORIZON (HOURS)</span>
              <span className="text-emerald-400 font-bold">{horizonHours}h</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 font-mono text-xs">
              {[4, 12, 24, 48].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setHorizonHours(h)}
                  className={`py-1.5 rounded transition ${
                    horizonHours === h
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {h} Hours
                </button>
              ))}
            </div>
          </div>

          {/* Confidence Slider */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-400 font-bold">CONFIDENCE LEVEL</span>
              <span className="text-emerald-400 font-bold">{confidencePercent}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="90"
              step="5"
              value={confidencePercent}
              onChange={(e) => setConfidencePercent(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Rationale */}
          <div>
            <label className="block text-slate-400 mb-1 font-bold">TECHNICAL THESIS / RATIONALE</label>
            <textarea
              rows={2}
              placeholder="e.g., Daily 200 EMA dynamic support bounce with 4H Bullish Order Block confluence..."
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-emerald-500 font-sans"
            />
          </div>

          {/* Key factors */}
          <div>
            <label className="block text-slate-400 mb-1 font-bold">KEY CONFLUENCE FACTORS (Comma separated)</label>
            <input
              type="text"
              placeholder="e.g. 1H FVG mitigation, RSI oversold, BSL target"
              value={keyFactors}
              onChange={(e) => setKeyFactors(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none focus:border-emerald-500 font-sans"
            />
          </div>

          <div className="text-[11px] text-slate-400 p-2.5 rounded bg-slate-950 border border-slate-800 leading-relaxed">
            Rule 5: The engine records the current timestamp and locks this forecast. It will only be evaluated once {horizonHours} hours have passed.
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition shadow-lg shadow-emerald-500/20"
          >
            {submitting ? 'Recording Forecast...' : 'Log Forecast to Audit Engine'}
          </button>
        </form>
      </div>
    </div>
  );
};
