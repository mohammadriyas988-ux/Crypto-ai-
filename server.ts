import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { marketDataService } from './server/marketDataService.js';
import { performTechnicalAnalysis } from './server/analysisEngine.js';
import {
  chatWithCryptoPilot,
  generateAIAnalysis,
  generateAIPrediction,
  isGeminiConfigured,
} from './server/geminiService.js';
import { storageService } from './server/storage.js';
import { runBacktest } from './server/backtestEngine.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '2mb' }));

// 1. Health & status check
app.get('/api/status', async (_req, res) => {
  res.json({
    status: 'online',
    appName: 'CryptoPilot AI',
    timestamp: Date.now(),
    geminiConfigured: isGeminiConfigured(),
    features: {
      aiChat: true,
      marketDashboard: true,
      technicalAnalysis: true,
      predictionTracking: true,
      paperTrading: true,
      backtesting: true,
      liveOrderExecution: false, // Explicitly disabled
    },
  });
});

// 2. Market Tickers (24h)
app.get('/api/tickers', async (_req, res) => {
  try {
    const tickers = await marketDataService.getTickers();
    // Evaluate pending predictions whenever tickers are refreshed
    storageService.evaluatePendingPredictions(tickers);
    res.json({ success: true, tickers });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Historical & Real-Time Candles
app.get('/api/candles', async (req, res) => {
  try {
    const symbol = (req.query.symbol as string) || 'BTCUSDT';
    const interval = (req.query.interval as string) || '1h';
    const limit = Math.min(300, parseInt((req.query.limit as string) || '150', 10));

    const { candles, isDelayed, dataSource } = await marketDataService.getCandles(symbol, interval, limit);
    res.json({
      success: true,
      symbol,
      interval,
      candles,
      isDelayed,
      dataSource,
      timestamp: Date.now(),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Algorithmic Technical Analysis & SMC
app.get('/api/analysis', async (req, res) => {
  try {
    const symbol = (req.query.symbol as string) || 'BTCUSDT';
    const interval = (req.query.interval as string) || '1h';
    const limit = Math.min(300, parseInt((req.query.limit as string) || '150', 10));

    const { candles } = await marketDataService.getCandles(symbol, interval, limit);
    const analysis = performTechnicalAnalysis(symbol, interval, candles);
    res.json({ success: true, analysis });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. AI Chat
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history, marketContext } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, error: 'A valid message string is required.' });
    }

    const reply = await chatWithCryptoPilot({
      message,
      history,
      marketContext,
    });

    res.json({ success: true, reply });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. AI Structured Deep Dive Analysis
app.post('/api/ai-analysis', async (req, res) => {
  try {
    const { symbol = 'BTCUSDT', interval = '1h' } = req.body;
    const { candles } = await marketDataService.getCandles(symbol, interval, 120);
    const ticker = await marketDataService.getTicker(symbol);
    const technicals = performTechnicalAnalysis(symbol, interval, candles);

    const report = await generateAIAnalysis({
      symbol,
      ticker,
      technicals,
    });

    res.json({ success: true, report, technicals });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. AI Prediction Generator
app.post('/api/ai-prediction', async (req, res) => {
  try {
    const { symbol = 'BTCUSDT', interval = '1h' } = req.body;
    const { candles } = await marketDataService.getCandles(symbol, interval, 120);
    const ticker = await marketDataService.getTicker(symbol);
    const technicals = performTechnicalAnalysis(symbol, interval, candles);

    const predictionData = await generateAIPrediction({
      symbol,
      ticker,
      technicals,
    });

    res.json({ success: true, prediction: predictionData });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Predictions Store & Evaluation
app.get('/api/predictions', async (_req, res) => {
  try {
    const tickers = await marketDataService.getTickers();
    storageService.evaluatePendingPredictions(tickers);
    const predictions = storageService.getPredictions();
    res.json({ success: true, predictions });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/predictions', async (req, res) => {
  try {
    const { symbol, horizonHours, direction, entryPrice, targetPrice, invalidationPrice, confidencePercent, rationale, keyFactors, isAiGenerated } = req.body;

    if (!symbol || !horizonHours || !direction || !entryPrice || !targetPrice || !invalidationPrice) {
      return res.status(400).json({ success: false, error: 'Missing required prediction fields.' });
    }

    const created = storageService.addPrediction({
      symbol,
      horizonHours: Number(horizonHours),
      direction,
      entryPrice: Number(entryPrice),
      targetPrice: Number(targetPrice),
      invalidationPrice: Number(invalidationPrice),
      confidencePercent: Number(confidencePercent) || 70,
      rationale: rationale || 'Quantitative and price action setup.',
      keyFactors: Array.isArray(keyFactors) ? keyFactors : [],
      isAiGenerated: !!isAiGenerated,
    });

    res.json({ success: true, prediction: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/predictions/evaluate', async (_req, res) => {
  try {
    const tickers = await marketDataService.getTickers();
    const result = storageService.evaluatePendingPredictions(tickers);
    res.json({ success: true, ...result, predictions: storageService.getPredictions() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Paper Trading Portfolio
app.get('/api/paper/account', async (_req, res) => {
  try {
    const tickers = await marketDataService.getTickers();
    const account = storageService.getPaperAccount(tickers);
    res.json({ success: true, account });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/paper/order', async (req, res) => {
  try {
    const { symbol, side, amountUsd, currentPrice, leverage, stopLoss, takeProfit } = req.body;

    if (!symbol || !side || !amountUsd || !currentPrice) {
      return res.status(400).json({ success: false, error: 'Missing required order parameters.' });
    }

    const result = storageService.openPaperPosition({
      symbol,
      side,
      amountUsd: Number(amountUsd),
      currentPrice: Number(currentPrice),
      leverage: Number(leverage) || 1,
      stopLoss: stopLoss ? Number(stopLoss) : undefined,
      takeProfit: takeProfit ? Number(takeProfit) : undefined,
    });

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    const tickers = await marketDataService.getTickers();
    const updatedAccount = storageService.getPaperAccount(tickers);
    res.json({ success: true, position: result.position, account: updatedAccount });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/paper/close', async (req, res) => {
  try {
    const { positionId, currentPrice } = req.body;
    if (!positionId || !currentPrice) {
      return res.status(400).json({ success: false, error: 'Position ID and current price required.' });
    }

    const result = storageService.closePaperPosition(positionId, Number(currentPrice));
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    const tickers = await marketDataService.getTickers();
    const updatedAccount = storageService.getPaperAccount(tickers);
    res.json({ success: true, trade: result.trade, account: updatedAccount });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/paper/reset', async (req, res) => {
  try {
    const initialBalance = Number(req.body.initialBalance) || 50000;
    const account = storageService.resetPaperAccount(initialBalance);
    res.json({ success: true, account });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. Backtesting
app.post('/api/backtest', async (req, res) => {
  try {
    const { strategyName = 'EMA_CROSSOVER', symbol = 'BTCUSDT', timeframe = '1h', limit = 200 } = req.body;
    const { candles } = await marketDataService.getCandles(symbol, timeframe, Number(limit));
    const settings = storageService.getSettings();

    const result = runBacktest({
      strategyName,
      symbol,
      timeframe,
      candles,
      settings,
      initialBalance: settings.initialPaperBalance,
    });

    storageService.saveBacktestResult(result);
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/backtest/history', async (_req, res) => {
  try {
    const history = storageService.getBacktestHistory();
    res.json({ success: true, history });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 11. Settings
app.get('/api/settings', async (_req, res) => {
  res.json({ success: true, settings: storageService.getSettings() });
});

app.post('/api/settings', async (req, res) => {
  try {
    const updated = storageService.updateSettings(req.body);
    res.json({ success: true, settings: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Vite dev server mounting or static production serving
async function setupServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 CryptoPilot AI server running on http://0.0.0.0:${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error('Failed to start server:', err);
});
