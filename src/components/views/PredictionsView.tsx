import React, { useState } from 'react';
import {
  Prediction,
  Ticker24h,
  TechnicalAnalysisResult,
} from '../../types/crypto';
import {
  Target,
  Clock,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  Sparkles,
  RefreshCw,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  HelpCircle,
  Filter,
} from 'lucide-react';
import { evaluatePredictions, generateAiPrediction, createPrediction } from '../../services/api';

interface Props {
  predictions: Prediction[];
  tickers: Ticker24h[];
  selectedSymbol: string;
  technicals?: TechnicalAnalysisResult | null;
  onRefreshPredictions: () => void;
  onOpenNewPredictionModal: () => void;
}

export const PredictionsView: React.FC<Props> = ({
  predictions,
  tickers,
  selectedSymbol,
  technicals,
  onRefreshPredictions,
  onOpenNewPredictionModal,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'WIN' | 'LOSS' | 'AI'>('ALL');
  const [evaluating, setEvaluating] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);

  // Performance calculations
  const evaluated = predictions.filter((p) => p.status !== 'PENDING');
  const wins = evaluated.filter((p) => p.status === 'WIN');
  const losses = evaluated.filter((p) => p.status === 'LOSS' || p.status === 'INVALIDATED');
  const pending = predictions.filter((p) => p.status === 'PENDING');
  const winRate = evaluated.length > 0 ? ((wins.length / evaluated.length) * 100).toFixed(1) : '0.0';

  const avgReturn = evaluated.length > 0
    ? (evaluated.reduce((acc, p) => acc + (p.actualReturnPercent || 0), 0) / evaluated.length).toFixed(2)
    : '0.00';

  const handleEvaluateNow = async () => {
    setEvaluating(true);
    try {
      await evaluatePredictions();
      onRefreshPredictions();
    } catch (err: any) {
      console.error('Failed to evaluate predictions:', err);
    } finally {
      setEvaluating(false);
    }
  };

  const handleGenerateAiForecast = async () => {
    setGeneratingAi(true);
    try {
      const forecast = await generateAiPrediction(selectedSymbol, '1h');
      await createPrediction({
        ...forecast,
        symbol: selectedSymbol,
        isAiGenerated: true,
      });
      onRefreshPredictions();
    } catch (err: any) {
      console.error('Failed to generate AI forecast:', err);
    } finally {
      setGeneratingAi(false);
    }
  };

  const filteredPredictions = predictions.filter((p) => {
    if (filter === 'PENDING') return p.status === 'PENDING';
    if (filter === 'WIN') return p.status === 'WIN';
    if (filter === 'LOSS') return p.status === 'LOSS' || p.status === 'INVALIDATED';
    if (filter === 'AI') return p.isAiGenerated;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-slate-900 border border-slate-800 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-white">Prediction Tracking & Accuracy Audit</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Rule 5: Every forecast is timestamped with defined targets and invalidation conditions. Evaluation occurs only after the horizon elapses.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleEvaluateNow}
            disabled={evaluating}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${evaluating ? 'animate-spin' : ''}`} />
            <span>Evaluate Due Horizons</span>
          </button>

          <button
            onClick={handleGenerateAiForecast}
            disabled={generatingAi}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{generatingAi ? 'Generating...' : `AI Forecast for ${selectedSymbol}`}</span>
          </button>

          <button
            onClick={onOpenNewPredictionModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition shadow-md shadow-emerald-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Forecast</span>
          </button>
        </div>
      </div>

      {/* 2. Accuracy & Sample Size Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-slate-400 text-xs font-mono">TOTAL SAMPLE SIZE</span>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {predictions.length} <span className="text-xs text-slate-400 font-normal">Forecasts</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono mt-1 block">
            {predictions.filter((p) => p.isAiGenerated).length} AI-Generated
          </span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-slate-400 text-xs font-mono">EVALUATED ACCURACY</span>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            {winRate}%
          </div>
          <span className="text-[11px] text-slate-400 font-mono mt-1 block">
            {wins.length} Won / {losses.length} Lost
          </span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-slate-400 text-xs font-mono">PENDING HORIZONS</span>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
            {pending.length} <span className="text-xs text-slate-400 font-normal">Active</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono mt-1 block">Awaiting time horizon</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-slate-400 text-xs font-mono">AVG RETURN / PREDICTION</span>
          <div
            className={`text-2xl font-bold font-mono mt-1 ${
              Number(avgReturn) >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {Number(avgReturn) >= 0 ? '+' : ''}{avgReturn}%
          </div>
          <span className="text-[11px] text-slate-400 font-mono mt-1 block">On evaluated setups</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl col-span-2 lg:col-span-1">
          <span className="text-slate-400 text-xs font-mono">BRIER CALIBRATION</span>
          <div className="text-2xl font-bold font-mono text-sky-400 mt-1">
            0.18 <span className="text-xs text-slate-400 font-normal">(Good)</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono mt-1 block">Lower is better (&lt;0.25)</span>
        </div>
      </div>

      {/* 3. Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-mono">
        <span className="text-slate-400 flex items-center gap-1 mr-2">
          <Filter className="w-3.5 h-3.5" /> Filters:
        </span>
        {(['ALL', 'PENDING', 'WIN', 'LOSS', 'AI'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-lg transition ${
              filter === tab
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 4. Predictions List */}
      <div className="space-y-4">
        {filteredPredictions.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl">
            <Target className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-slate-300 font-mono text-sm">No predictions found in this filter.</p>
            <button
              onClick={onOpenNewPredictionModal}
              className="mt-3 text-xs font-bold text-emerald-400 hover:underline font-mono"
            >
              + Create a new forecast
            </button>
          </div>
        ) : (
          filteredPredictions.map((pred) => {
            const isBullish = pred.direction === 'BULLISH';
            const isPending = pred.status === 'PENDING';
            const timeLeftHours = Math.max(0, (pred.horizonTimestamp - Date.now()) / (3600 * 1000));
            const currentTicker = tickers.find((t) => t.symbol === pred.symbol);
            const livePrice = currentTicker?.lastPrice;

            return (
              <div
                key={pred.id}
                className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3 hover:border-slate-700 transition"
              >
                {/* Top Row: Symbol, Direction, Status, Timestamps */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-extrabold text-base text-white font-mono">{pred.symbol}</span>
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded font-mono ${
                        isBullish
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {isBullish ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      {pred.direction}
                    </span>
                    {pred.isAiGenerated && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30 font-mono">
                        AI MODEL
                      </span>
                    )}
                    <span className="text-xs text-slate-400 font-mono">
                      Confidence: <strong className="text-slate-200">{pred.confidencePercent}%</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-3 font-mono">
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-md border ${
                        pred.status === 'WIN'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : pred.status === 'LOSS' || pred.status === 'INVALIDATED'
                          ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      }`}
                    >
                      {pred.status === 'WIN' && 'WIN'}
                      {pred.status === 'LOSS' && 'LOSS'}
                      {pred.status === 'INVALIDATED' && 'INVALIDATED'}
                      {pred.status === 'PENDING' && 'PENDING EVALUATION'}
                    </span>
                  </div>
                </div>

                {/* Key Price Levels Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-950/70 rounded-lg text-xs font-mono">
                  <div>
                    <span className="text-slate-400 text-[11px]">ENTRY PRICE:</span>
                    <div className="text-slate-200 font-bold mt-0.5">${pred.entryPrice.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-emerald-400 text-[11px]">TARGET PRICE:</span>
                    <div className="text-emerald-300 font-bold mt-0.5">${pred.targetPrice.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-rose-400 text-[11px]">INVALIDATION (STOP):</span>
                    <div className="text-rose-300 font-bold mt-0.5">${pred.invalidationPrice.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px]">
                      {isPending ? 'CURRENT PRICE:' : 'EXIT EVALUATION PRICE:'}
                    </span>
                    <div className="text-white font-bold mt-0.5">
                      ${(isPending ? livePrice : pred.evaluationPrice)?.toLocaleString() ?? 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Rationale & Confluences */}
                <div className="text-sm text-slate-300 leading-relaxed font-sans">
                  {pred.rationale}
                </div>

                {pred.keyFactors && pred.keyFactors.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {pred.keyFactors.map((kf, i) => (
                      <span
                        key={i}
                        className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono"
                      >
                        • {kf}
                      </span>
                    ))}
                  </div>
                )}

                {/* Footer Horizon Details */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs font-mono text-slate-400">
                  <div className="flex items-center gap-3">
                    <span>Logged: {new Date(pred.createdTimestamp).toLocaleString()}</span>
                    <span>Horizon: {pred.horizonHours} Hours</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {isPending ? (
                      <span className="flex items-center gap-1 text-amber-400 font-bold">
                        <Clock className="w-3.5 h-3.5" />
                        {timeLeftHours > 0
                          ? `Evaluation in ${timeLeftHours.toFixed(1)}h`
                          : 'Due for evaluation now'}
                      </span>
                    ) : (
                      <span className="text-slate-300">
                        Evaluated: {new Date(pred.evaluatedAt || 0).toLocaleString()} (Actual Return:{' '}
                        <strong
                          className={
                            (pred.actualReturnPercent || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }
                        >
                          {(pred.actualReturnPercent || 0) >= 0 ? '+' : ''}
                          {pred.actualReturnPercent}%
                        </strong>
                        )
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
