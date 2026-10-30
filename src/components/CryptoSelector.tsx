import React, { useState, useMemo } from 'react';
import {
  Search,
  TrendingUp,
  TrendingDown,
  Sparkles,
  ChevronDown,
  X,
  Layers,
  Flame,
  Check,
} from 'lucide-react';
import { Ticker24h } from '../types/crypto';

interface Props {
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  tickers: Ticker24h[];
  className?: string;
  showCategoryTabs?: boolean;
}

const CATEGORIES = [
  { id: 'ALL', label: 'All Cryptos' },
  { id: 'MAJORS', label: 'Majors' },
  { id: 'LAYER1', label: 'Layer 1' },
  { id: 'LAYER2', label: 'Layer 2' },
  { id: 'DEFI', label: 'DeFi' },
  { id: 'AI_DATA', label: 'AI & Data' },
  { id: 'MEMES', label: 'Memes' },
  { id: 'INFRA', label: 'Infra / RWA' },
];

export const CryptoSelector: React.FC<Props> = ({
  selectedSymbol,
  onSelectSymbol,
  tickers,
  className = '',
  showCategoryTabs = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const currentTicker = tickers.find((t) => t.symbol === selectedSymbol);

  // Filter tickers
  const filteredTickers = useMemo(() => {
    return tickers.filter((t) => {
      const matchesCategory =
        selectedCategory === 'ALL' || t.category === selectedCategory;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        t.symbol.toLowerCase().includes(q) ||
        t.baseAsset.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [tickers, selectedCategory, searchQuery]);

  const handleSelect = (sym: string) => {
    onSelectSymbol(sym);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleCustomSymbolSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    let sym = searchQuery.trim().toUpperCase();
    if (!sym.endsWith('USDT')) sym = `${sym}USDT`;
    handleSelect(sym);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-left transition shadow-md group"
      >
        <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-extrabold text-xs flex items-center justify-center font-mono border border-emerald-500/30">
          {currentTicker?.baseAsset?.substring(0, 3) || selectedSymbol.substring(0, 3)}
        </div>
        <div>
          <div className="flex items-center gap-1.5 font-bold text-white text-xs font-mono">
            <span>{currentTicker?.baseAsset || selectedSymbol.replace('USDT', '')}</span>
            <span className="text-[10px] text-slate-400 font-normal">/USDT</span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            {currentTicker?.lastPrice !== undefined
              ? `$${currentTicker.lastPrice >= 1 ? currentTicker.lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : currentTicker.lastPrice}`
              : '---'}
          </div>
        </div>
      </button>

      {/* Dropdown Modal Panel */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 z-50 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Search Input Bar */}
            <div className="p-3 border-b border-slate-800 bg-slate-950">
              <form onSubmit={handleCustomSymbolSubmit} className="relative flex items-center">
                <Search className="absolute left-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search coin (e.g. BTC, SUI, PEPE, RENDER)..."
                  className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 outline-none font-mono"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 p-0.5 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </form>
            </div>

            {/* Category Filter Pills */}
            {showCategoryTabs && (
              <div className="px-3 py-2 border-b border-slate-800/80 bg-slate-950/50 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11px] font-mono">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-2.5 py-1 rounded-md whitespace-nowrap transition ${
                      selectedCategory === cat.id
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'bg-slate-800/70 text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            )}

            {/* Tickers List */}
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/50">
              {filteredTickers.length === 0 ? (
                <div className="p-5 text-center text-xs font-mono text-slate-400">
                  <p>No coin found matching "{searchQuery}".</p>
                  <button
                    onClick={handleCustomSymbolSubmit}
                    className="mt-2 text-xs font-bold text-emerald-400 hover:underline"
                  >
                    Query Binance for "{searchQuery.toUpperCase()}USDT" &rarr;
                  </button>
                </div>
              ) : (
                filteredTickers.map((t) => {
                  const isSelected = t.symbol === selectedSymbol;
                  const isPos = t.priceChangePercent >= 0;

                  return (
                    <button
                      key={t.symbol}
                      onClick={() => handleSelect(t.symbol)}
                      className={`w-full px-3.5 py-2.5 flex items-center justify-between hover:bg-slate-800/60 transition text-left text-xs font-mono ${
                        isSelected ? 'bg-emerald-500/10 border-l-2 border-emerald-500' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-200 text-[11px]">
                          {t.baseAsset.substring(0, 3)}
                        </div>
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            {t.baseAsset}
                            <span className="text-[10px] text-slate-400 font-normal">/USDT</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                          </div>
                          <div className="text-[10px] text-slate-400 line-clamp-1">{t.name}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-slate-100">
                          ${t.lastPrice >= 1 ? t.lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : t.lastPrice}
                        </div>
                        <div
                          className={`text-[10px] font-semibold flex items-center justify-end gap-0.5 ${
                            isPos ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isPos ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                          {isPos ? '+' : ''}{t.priceChangePercent}%
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer Summary */}
            <div className="p-2.5 bg-slate-950 border-t border-slate-800 text-[10px] font-mono text-slate-400 flex justify-between items-center">
              <span>{filteredTickers.length} cryptocurrencies listed</span>
              <span className="text-emerald-400">All live on Binance & TV</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
