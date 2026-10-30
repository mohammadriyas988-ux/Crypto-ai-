import React from 'react';
import {
  Compass,
  Bot,
  CandlestickChart as ChartIcon,
  LineChart,
  Target,
  Calculator,
  History,
  Wallet,
  Settings,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import { Ticker24h, PaperAccount } from '../types/crypto';

export type TabId =
  | 'overview'
  | 'chat'
  | 'charts'
  | 'analysis'
  | 'predictions'
  | 'calculator'
  | 'backtest'
  | 'paper'
  | 'settings';

interface Props {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  tickers: Ticker24h[];
  paperAccount?: PaperAccount | null;
  onOpenOrderModal: () => void;
  onOpenPredictionModal: () => void;
  geminiActive: boolean;
}

export const Navbar: React.FC<Props> = ({
  activeTab,
  onSelectTab,
  tickers,
  paperAccount,
  onOpenOrderModal,
  onOpenPredictionModal,
  geminiActive,
}) => {
  const tabs = [
    { id: 'overview' as TabId, label: 'Overview', icon: Compass },
    { id: 'chat' as TabId, label: 'AI Chat', icon: Bot, badge: geminiActive ? 'AI' : undefined },
    { id: 'charts' as TabId, label: 'Market Charts', icon: ChartIcon },
    { id: 'analysis' as TabId, label: 'Analysis', icon: LineChart },
    { id: 'predictions' as TabId, label: 'Prediction History', icon: Target },
    { id: 'calculator' as TabId, label: 'Risk Calculator', icon: Calculator },
    { id: 'backtest' as TabId, label: 'Backtesting', icon: History },
    { id: 'paper' as TabId, label: 'Paper Trading', icon: Wallet },
    { id: 'settings' as TabId, label: 'Settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      {/* 1. Live Ticker Marquee Bar */}
      <div className="bg-slate-900/80 border-b border-slate-800/80 px-4 py-1.5 overflow-x-auto no-scrollbar flex items-center gap-6 text-xs font-mono">
        <div className="flex items-center gap-2 text-slate-400 shrink-0 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] uppercase tracking-wider text-slate-400">MARKETS LIVE</span>
        </div>

        <div className="flex items-center gap-5 shrink-0">
          {tickers.slice(0, 8).map((t) => {
            const isPos = t.priceChangePercent >= 0;
            return (
              <div key={t.symbol} className="flex items-center gap-2">
                <span className="text-slate-300 font-semibold">{t.baseAsset}</span>
                <span className="text-slate-100 font-mono">
                  ${t.lastPrice >= 1 ? t.lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : t.lastPrice}
                </span>
                <span
                  className={`text-[11px] font-semibold ${
                    isPos ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {isPos ? '+' : ''}{t.priceChangePercent}%
                </span>
              </div>
            );
          })}
        </div>

        {/* Paper Balance Quick Chip */}
        {paperAccount && (
          <div className="ml-auto flex items-center gap-2 shrink-0 pl-4 border-l border-slate-800">
            <span className="text-slate-400 text-[11px]">VIRTUAL EQUITY:</span>
            <span className="text-emerald-400 font-bold font-mono">
              ${paperAccount.equityUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        )}
      </div>

      {/* 2. Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-black text-xl">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-white tracking-tight">CryptoPilot</span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                AI Assistant
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Quantitative Market Intelligence & Research</p>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden xl:flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                      isActive ? 'bg-slate-950 text-emerald-300' : 'bg-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenPredictionModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <Target className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">New Prediction</span>
          </button>
          <button
            onClick={onOpenOrderModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-md shadow-emerald-500/25 transition"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Paper Trade</span>
          </button>
        </div>
      </div>

      {/* Mobile / Tablet Horizontal Scrolling Nav */}
      <div className="xl:hidden flex items-center gap-1 overflow-x-auto px-4 py-2 border-t border-slate-800/80 bg-slate-950 no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition shrink-0 ${
                isActive
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-300 hover:text-white bg-slate-900 border border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
