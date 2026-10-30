import {
  Ticker24h,
  Candle,
  TechnicalAnalysisResult,
  Prediction,
  PaperAccount,
  BacktestResult,
  AppSettings,
} from '../types/crypto';

export async function fetchStatus(): Promise<{
  status: string;
  appName: string;
  timestamp: number;
  geminiConfigured: boolean;
  features: Record<string, boolean>;
}> {
  const res = await fetch('/api/status');
  if (!res.ok) throw new Error('Failed to load server status');
  return res.json();
}

export async function fetchTickers(): Promise<Ticker24h[]> {
  const res = await fetch('/api/tickers');
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch market tickers');
  return data.tickers;
}

export async function fetchCandles(
  symbol: string,
  interval = '1h',
  limit = 150
): Promise<{ candles: Candle[]; isDelayed: boolean; dataSource: string; timestamp: number }> {
  const res = await fetch(`/api/candles?symbol=${encodeURIComponent(symbol)}&interval=${interval}&limit=${limit}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch candle data');
  return data;
}

export async function fetchAnalysis(
  symbol: string,
  interval = '1h'
): Promise<TechnicalAnalysisResult> {
  const res = await fetch(`/api/analysis?symbol=${encodeURIComponent(symbol)}&interval=${interval}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to calculate analysis');
  return data.analysis;
}

export async function sendChatMessage(params: {
  message: string;
  history?: Array<{ role: 'user' | 'model'; text: string }>;
  marketContext?: any;
}): Promise<string> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'AI Chat request failed');
  return data.reply;
}

export async function generateAiAnalysis(
  symbol: string,
  interval = '1h'
): Promise<{ report: string; technicals: TechnicalAnalysisResult }> {
  const res = await fetch('/api/ai-analysis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbol, interval }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to generate AI analysis');
  return data;
}

export async function generateAiPrediction(
  symbol: string,
  interval = '1h'
): Promise<any> {
  const res = await fetch('/api/ai-prediction', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbol, interval }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to generate AI prediction');
  return data.prediction;
}

export async function fetchPredictions(): Promise<Prediction[]> {
  const res = await fetch('/api/predictions');
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch predictions');
  return data.predictions;
}

export async function createPrediction(
  prediction: Partial<Prediction> & { symbol: string; horizonHours: number }
): Promise<Prediction> {
  const res = await fetch('/api/predictions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(prediction),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to save prediction');
  return data.prediction;
}

export async function evaluatePredictions(): Promise<{ evaluatedCount: number; predictions: Prediction[] }> {
  const res = await fetch('/api/predictions/evaluate', {
    method: 'POST',
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to evaluate predictions');
  return data;
}

export async function fetchPaperAccount(): Promise<PaperAccount> {
  const res = await fetch('/api/paper/account');
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch paper trading account');
  return data.account;
}

export async function openPaperOrder(params: {
  symbol: string;
  side: 'LONG' | 'SHORT';
  amountUsd: number;
  currentPrice: number;
  leverage?: number;
  stopLoss?: number;
  takeProfit?: number;
}): Promise<any> {
  const res = await fetch('/api/paper/order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to open paper position');
  return data;
}

export async function closePaperPosition(
  positionId: string,
  currentPrice: number
): Promise<any> {
  const res = await fetch('/api/paper/close', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ positionId, currentPrice }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to close paper position');
  return data;
}

export async function resetPaperAccount(initialBalance = 50000): Promise<PaperAccount> {
  const res = await fetch('/api/paper/reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initialBalance }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to reset paper account');
  return data.account;
}

export async function runBacktest(params: {
  strategyName: string;
  symbol: string;
  timeframe: string;
  limit?: number;
}): Promise<BacktestResult> {
  const res = await fetch('/api/backtest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to run backtest');
  return data.result;
}

export async function fetchBacktestHistory(): Promise<BacktestResult[]> {
  const res = await fetch('/api/backtest/history');
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch backtest history');
  return data.history;
}

export async function fetchSettings(): Promise<AppSettings> {
  const res = await fetch('/api/settings');
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch settings');
  return data.settings;
}

export async function updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
  const res = await fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to update settings');
  return data.settings;
}
