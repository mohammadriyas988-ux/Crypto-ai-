import React, { useState, useEffect, useCallback } from 'react';
import { Navbar, TabId } from './components/Navbar';
import { OverviewView } from './components/views/OverviewView';
import { ChatView } from './components/views/ChatView';
import { MarketChartsView } from './components/views/MarketChartsView';
import { AnalysisView } from './components/views/AnalysisView';
import { PredictionsView } from './components/views/PredictionsView';
import { RiskCalculatorView } from './components/views/RiskCalculatorView';
import { BacktestView } from './components/views/BacktestView';
import { PaperTradingView } from './components/views/PaperTradingView';
import { SettingsView } from './components/views/SettingsView';
import { OrderModal } from './components/OrderModal';
import { NewPredictionModal } from './components/NewPredictionModal';
import {
  fetchStatus,
  fetchTickers,
  fetchCandles,
  fetchAnalysis,
  fetchPredictions,
  fetchPaperAccount,
  fetchSettings,
} from './services/api';
import {
  Ticker24h,
  Candle,
  TechnicalAnalysisResult,
  Prediction,
  PaperAccount,
  AppSettings,
} from './types/crypto';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTCUSDT');
  const [selectedInterval, setSelectedInterval] = useState<string>('1h');

  // Application State
  const [tickers, setTickers] = useState<Ticker24h[]>([]);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [candleDelayed, setCandleDelayed] = useState(false);
  const [candleSource, setCandleSource] = useState('BINANCE_REST_API');
  const [technicals, setTechnicals] = useState<TechnicalAnalysisResult | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [paperAccount, setPaperAccount] = useState<PaperAccount | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [serverStatus, setServerStatus] = useState<any>(null);

  // Modals state
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderModalParams, setOrderModalParams] = useState<any>(null);
  const [isPredictionModalOpen, setIsPredictionModalOpen] = useState(false);

  // 1. Initial Load of System Status & Settings
  useEffect(() => {
    fetchStatus()
      .then(setServerStatus)
      .catch((err) => console.warn('Status error:', err));

    fetchSettings()
      .then(setSettings)
      .catch((err) => console.warn('Settings error:', err));
  }, []);

  // 2. Poll Tickers every 10 seconds
  const loadTickers = useCallback(async () => {
    try {
      const data = await fetchTickers();
      setTickers(data);
    } catch (err) {
      console.warn('Failed to load tickers:', err);
    }
  }, []);

  useEffect(() => {
    loadTickers();
    const interval = setInterval(loadTickers, 10000);
    return () => clearInterval(interval);
  }, [loadTickers]);

  // 3. Load Candles & Technicals for Selected Symbol & Timeframe
  const loadCandlesAndAnalysis = useCallback(async () => {
    try {
      const [candleData, analysisData] = await Promise.all([
        fetchCandles(selectedSymbol, selectedInterval, 180),
        fetchAnalysis(selectedSymbol, selectedInterval),
      ]);
      setCandles(candleData.candles);
      setCandleDelayed(candleData.isDelayed);
      setCandleSource(candleData.dataSource);
      setTechnicals(analysisData);
    } catch (err) {
      console.warn('Failed to load candles/analysis:', err);
    }
  }, [selectedSymbol, selectedInterval]);

  useEffect(() => {
    loadCandlesAndAnalysis();
  }, [loadCandlesAndAnalysis]);

  // 4. Load Predictions and Paper Portfolio
  const loadPredictions = useCallback(async () => {
    try {
      const preds = await fetchPredictions();
      setPredictions(preds);
    } catch (err) {
      console.warn('Failed to load predictions:', err);
    }
  }, []);

  const loadPaperAccount = useCallback(async () => {
    try {
      const acc = await fetchPaperAccount();
      setPaperAccount(acc);
    } catch (err) {
      console.warn('Failed to load paper account:', err);
    }
  }, []);

  useEffect(() => {
    loadPredictions();
    loadPaperAccount();
  }, [loadPredictions, loadPaperAccount]);

  const handleOpenOrderWithParams = (params: any) => {
    setOrderModalParams(params);
    setIsOrderModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        tickers={tickers}
        paperAccount={paperAccount}
        onOpenOrderModal={() => {
          setOrderModalParams(null);
          setIsOrderModalOpen(true);
        }}
        onOpenPredictionModal={() => setIsPredictionModalOpen(true)}
        geminiActive={serverStatus?.geminiConfigured ?? true}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <OverviewView
            tickers={tickers}
            predictions={predictions}
            paperAccount={paperAccount}
            technicals={technicals}
            selectedSymbol={selectedSymbol}
            onSelectSymbol={setSelectedSymbol}
            onNavigateTab={setActiveTab}
            onOpenOrderModal={() => {
              setOrderModalParams(null);
              setIsOrderModalOpen(true);
            }}
            onOpenPredictionModal={() => setIsPredictionModalOpen(true)}
          />
        )}

        {activeTab === 'chat' && (
          <ChatView
            selectedSymbol={selectedSymbol}
            onSelectSymbol={setSelectedSymbol}
            tickers={tickers}
            technicals={technicals}
            geminiActive={serverStatus?.geminiConfigured ?? true}
          />
        )}

        {activeTab === 'charts' && (
          <MarketChartsView
            selectedSymbol={selectedSymbol}
            onSelectSymbol={setSelectedSymbol}
            selectedInterval={selectedInterval}
            onSelectInterval={setSelectedInterval}
            candles={candles}
            tickers={tickers}
            technicals={technicals}
            isDelayed={candleDelayed}
            dataSource={candleSource}
            onRefreshCandles={loadCandlesAndAnalysis}
            onOpenOrderModal={() => {
              setOrderModalParams(null);
              setIsOrderModalOpen(true);
            }}
            onOpenPredictionModal={() => setIsPredictionModalOpen(true)}
          />
        )}

        {activeTab === 'analysis' && (
          <AnalysisView
            selectedSymbol={selectedSymbol}
            onSelectSymbol={setSelectedSymbol}
            selectedInterval={selectedInterval}
            onSelectInterval={setSelectedInterval}
            technicals={technicals}
            tickers={tickers}
            onOpenOrderModal={() => {
              setOrderModalParams(null);
              setIsOrderModalOpen(true);
            }}
            onOpenPredictionModal={() => setIsPredictionModalOpen(true)}
          />
        )}

        {activeTab === 'predictions' && (
          <PredictionsView
            predictions={predictions}
            tickers={tickers}
            selectedSymbol={selectedSymbol}
            technicals={technicals}
            onRefreshPredictions={loadPredictions}
            onOpenNewPredictionModal={() => setIsPredictionModalOpen(true)}
          />
        )}

        {activeTab === 'calculator' && (
          <RiskCalculatorView
            selectedSymbol={selectedSymbol}
            tickers={tickers}
            paperAccount={paperAccount}
            onOpenOrderModalWithParams={handleOpenOrderWithParams}
          />
        )}

        {activeTab === 'backtest' && (
          <BacktestView
            selectedSymbol={selectedSymbol}
            tickers={tickers}
          />
        )}

        {activeTab === 'paper' && (
          <PaperTradingView
            paperAccount={paperAccount}
            tickers={tickers}
            selectedSymbol={selectedSymbol}
            onRefreshAccount={loadPaperAccount}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            serverStatus={serverStatus}
            onRefreshSettings={() => {
              fetchSettings().then(setSettings);
            }}
          />
        )}
      </main>

      {/* Global Modals */}
      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        tickers={tickers}
        initialSymbol={selectedSymbol}
        initialParams={orderModalParams}
        onOrderCompleted={loadPaperAccount}
      />

      <NewPredictionModal
        isOpen={isPredictionModalOpen}
        onClose={() => setIsPredictionModalOpen(false)}
        tickers={tickers}
        initialSymbol={selectedSymbol}
        onPredictionCreated={loadPredictions}
      />

      {/* Global Security & Regulatory Disclaimer Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-4 sm:px-6 lg:px-8 text-center text-xs font-mono text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            <strong>CryptoPilot AI</strong> &bull; Quantitative Market Intelligence & Trading Research
          </span>
          <span className="text-[11px] text-slate-400">
            Rule 6 & 8: All forecasts are probabilistic hypotheses. Live execution disabled. Virtual simulation only.
          </span>
        </div>
      </footer>
    </div>
  );
}
