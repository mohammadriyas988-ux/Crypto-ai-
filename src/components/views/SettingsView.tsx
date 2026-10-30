import React, { useState, useEffect } from 'react';
import {
  Settings,
  ShieldCheck,
  Server,
  Database,
  Lock,
  Save,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Layers,
} from 'lucide-react';
import { AppSettings } from '../../types/crypto';
import { updateSettings } from '../../services/api';

interface Props {
  settings: AppSettings | null;
  serverStatus: any;
  onRefreshSettings: () => void;
}

export const SettingsView: React.FC<Props> = ({
  settings,
  serverStatus,
  onRefreshSettings,
}) => {
  const [formData, setFormData] = useState<AppSettings>({
    initialPaperBalance: settings?.initialPaperBalance || 50000,
    makerFeePercent: settings?.makerFeePercent || 0.02,
    takerFeePercent: settings?.takerFeePercent || 0.05,
    simulatedSlippagePercent: settings?.simulatedSlippagePercent || 0.03,
    defaultRiskPercentage: settings?.defaultRiskPercentage || 1.5,
    currency: 'USDT',
    refreshIntervalSeconds: settings?.refreshIntervalSeconds || 10,
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (settings) setFormData(settings);
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    try {
      await updateSettings(formData);
      setSuccess(true);
      onRefreshSettings();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update settings:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 1. Header */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-emerald-400" />
          <h2 className="text-xl font-bold text-white">System Architecture & Configuration</h2>
        </div>
        <p className="text-xs text-slate-400">
          Rule 9: Security credentials and API connections remain strictly on the server. Configure simulation parameters and inspect decoupled service layers.
        </p>
      </div>

      {/* 2. Security & Subsystem Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs font-mono">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span>AI COPILOT</span>
            <Cpu className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-base font-bold text-white flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Gemini 3.8 Flash
          </div>
          <span className="text-[11px] text-slate-400 block">Server-Side Proxy active</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span>MARKET DATA</span>
            <Server className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-base font-bold text-white flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Binance Live REST
          </div>
          <span className="text-[11px] text-slate-400 block">High-res OHLCV candles</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span>PERSISTENT DB</span>
            <Database className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-base font-bold text-white flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            JSON Storage
          </div>
          <span className="text-[11px] text-slate-400 block">Atomic write disk persistence</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span>LIVE EXECUTION</span>
            <Lock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-base font-bold text-amber-400 flex items-center gap-1.5">
            Disabled
          </div>
          <span className="text-[11px] text-slate-400 block">Paper Trading Sandbox Only</span>
        </div>
      </div>

      {/* 3. Simulation Parameters Form */}
      <form onSubmit={handleSave} className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-5">
        <h3 className="font-bold text-white text-base pb-2 border-b border-slate-800 flex items-center justify-between">
          <span>Simulation Parameters</span>
          {success && (
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Settings Saved!
            </span>
          )}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div>
            <label className="block text-slate-400 mb-1 font-bold">INITIAL PAPER BALANCE (USDT)</label>
            <input
              type="number"
              value={formData.initialPaperBalance}
              onChange={(e) => setFormData({ ...formData, initialPaperBalance: Number(e.target.value) || 0 })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-bold">DEFAULT RISK PER TRADE (%)</label>
            <input
              type="number"
              step="0.1"
              value={formData.defaultRiskPercentage}
              onChange={(e) => setFormData({ ...formData, defaultRiskPercentage: Number(e.target.value) || 0 })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-bold">SIMULATED TAKER FEE (%)</label>
            <input
              type="number"
              step="0.01"
              value={formData.takerFeePercent}
              onChange={(e) => setFormData({ ...formData, takerFeePercent: Number(e.target.value) || 0 })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 outline-none"
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">Standard institutional taker is 0.05%</span>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-bold">SIMULATED SLIPPAGE (%)</label>
            <input
              type="number"
              step="0.01"
              value={formData.simulatedSlippagePercent}
              onChange={(e) => setFormData({ ...formData, simulatedSlippagePercent: Number(e.target.value) || 0 })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 outline-none"
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">Applied to market order fill price</span>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition shadow-md shadow-emerald-500/20"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>

      {/* 4. Modular Architecture & Future Exchange Integrations Notice */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-sky-400" />
          <h3 className="font-bold text-white text-sm">Separated Architecture & Extensibility Plan</h3>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          CryptoPilot AI is constructed with clean architectural separation across four distinct server layers:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80">
            <span className="font-bold text-emerald-400">1. Market Data Service (`server/marketDataService.ts`)</span>
            <p className="text-slate-400 mt-1 font-sans">
              Connects to live exchanges and feeds typed OHLCV candles with explicit timestamp and delay flags.
            </p>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80">
            <span className="font-bold text-sky-400">2. Technical Analysis Engine (`server/analysisEngine.ts`)</span>
            <p className="text-slate-400 mt-1 font-sans">
              Pure mathematical library computing EMAs, RSI, MACD, Pivot S/R, Fibonacci, and Smart Money Concepts.
            </p>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80">
            <span className="font-bold text-purple-400">3. AI Intelligence Service (`server/geminiService.ts`)</span>
            <p className="text-slate-400 mt-1 font-sans">
              Google Gemini 3.8 Flash SDK server integration generating probabilistic research notes and forecasts.
            </p>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80">
            <span className="font-bold text-amber-400">4. Storage & Evaluation Engine (`server/storage.ts`)</span>
            <p className="text-slate-400 mt-1 font-sans">
              Maintains atomic persistence of predictions, paper positions, backtests, and delayed horizon evaluation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
