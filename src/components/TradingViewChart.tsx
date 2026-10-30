import React, { useEffect, useRef, useState } from 'react';
import {
  ExternalLink,
  Maximize2,
  Minimize2,
  RefreshCw,
  Sparkles,
  Sliders,
  Expand,
} from 'lucide-react';

interface Props {
  symbol: string; // e.g. "BTCUSDT"
  interval?: string; // "1m", "5m", "15m", "1h", "4h", "1d"
  theme?: 'dark' | 'light';
  height?: number | string;
  defaultHeight?: number;
}

type HeightPreset = 'compact' | 'standard' | 'tall' | 'cinema';

export const TradingViewChart: React.FC<Props> = ({
  symbol,
  interval = '1h',
  theme = 'dark',
  defaultHeight = 740,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const outerWrapperRef = useRef<HTMLDivElement>(null);
  const [key, setKey] = useState(0);
  const [heightPreset, setHeightPreset] = useState<HeightPreset>('standard');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Compute container height based on preset
  const getContainerHeight = () => {
    if (isFullscreen) return 'calc(100vh - 56px)';
    switch (heightPreset) {
      case 'compact':
        return '620px';
      case 'standard':
        return '750px';
      case 'tall':
        return '900px';
      case 'cinema':
        return 'calc(100vh - 140px)';
      default:
        return '750px';
    }
  };

  // Map timeframe to TradingView format
  const getTvInterval = (tf: string) => {
    switch (tf) {
      case '1m':
        return '1';
      case '5m':
        return '5';
      case '15m':
        return '15';
      case '1h':
        return '60';
      case '4h':
        return '240';
      case '1d':
        return 'D';
      case '1w':
        return 'W';
      default:
        return '60';
    }
  };

  const toggleFullscreen = () => {
    if (!outerWrapperRef.current) return;
    if (!document.fullscreenElement) {
      outerWrapperRef.current.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {
        // Fallback to cinema
        setHeightPreset('cinema');
      });
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clean previous widget elements
    containerRef.current.innerHTML = '';

    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container__widget';
    widgetContainer.style.height = '100%';
    widgetContainer.style.width = '100%';
    containerRef.current.appendChild(widgetContainer);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;

    // Convert symbol to BINANCE:SYMBOL
    const cleanSym = symbol.replace(/[^A-Za-z0-9]/g, '');
    const tvSymbol = `BINANCE:${cleanSym}`;
    const tvInterval = getTvInterval(interval);

    // CRITICAL: We only attach 'STD;EMA' on the main price series and DO NOT attach sub-pane
    // indicators (like RSI or MACD) by default. This guarantees the candlestick chart receives
    // 100% of the vertical space so candles are tall, vivid, and price movements are ultra clear!
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: tvSymbol,
      interval: tvInterval,
      timezone: 'Etc/UTC',
      theme: theme,
      style: '1', // Classical Japanese Candlesticks
      locale: 'en',
      enable_publishing: false,
      allow_symbol_change: true,
      calendar: false,
      hide_side_toolbar: false,
      withdateranges: true,
      save_image: true,
      show_popup_button: true,
      popup_width: '1000',
      popup_height: '650',
      support_host: 'https://www.tradingview.com',
      studies: [
        'STD;EMA', // Moving average overlaid on price
      ],
      overrides: {
        'mainSeriesProperties.candleStyle.upColor': '#10b981',
        'mainSeriesProperties.candleStyle.downColor': '#f43f5e',
        'mainSeriesProperties.candleStyle.drawWick': true,
        'mainSeriesProperties.candleStyle.drawBorder': true,
        'mainSeriesProperties.candleStyle.borderColor': '#374151',
        'mainSeriesProperties.candleStyle.borderUpColor': '#10b981',
        'mainSeriesProperties.candleStyle.borderDownColor': '#f43f5e',
        'mainSeriesProperties.candleStyle.wickUpColor': '#10b981',
        'mainSeriesProperties.candleStyle.wickDownColor': '#f43f5e',
        'paneProperties.background': '#090d16',
        'paneProperties.vertGridProperties.color': 'rgba(30, 41, 59, 0.4)',
        'paneProperties.horzGridProperties.color': 'rgba(30, 41, 59, 0.4)',
        'scalesProperties.textColor': '#94a3b8',
        'scalesProperties.fontSize': 12,
      },
    });

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [symbol, interval, theme, key, heightPreset, isFullscreen]);

  return (
    <div
      ref={outerWrapperRef}
      className={`relative w-full rounded-2xl overflow-hidden border border-slate-800 bg-[#090d16] shadow-2xl flex flex-col ${
        isFullscreen ? 'p-2 bg-slate-950' : ''
      }`}
    >
      {/* Top Professional Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-950/90 border-b border-slate-800 text-xs font-mono">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50" />
          <span className="font-extrabold text-white tracking-wide">TRADINGVIEW ADVANCED TERMINAL</span>
          <span className="text-[11px] font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30">
            BINANCE:{symbol}
          </span>
          <span className="text-slate-400 text-[11px] hidden md:inline">
            100% Height Candlestick View &bull; High Resolution Tick Feed
          </span>
        </div>

        {/* Height Controls & Tools */}
        <div className="flex items-center gap-2">
          {/* Height Presets */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-[11px]">
            <span className="text-slate-500 px-1.5 flex items-center gap-1">
              <Sliders className="w-3 h-3" /> Height:
            </span>
            <button
              onClick={() => setHeightPreset('compact')}
              className={`px-2 py-0.5 rounded transition ${
                heightPreset === 'compact'
                  ? 'bg-slate-800 text-emerald-400 font-bold border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              620px
            </button>
            <button
              onClick={() => setHeightPreset('standard')}
              className={`px-2 py-0.5 rounded transition ${
                heightPreset === 'standard'
                  ? 'bg-slate-800 text-emerald-400 font-bold border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              750px (Pro)
            </button>
            <button
              onClick={() => setHeightPreset('tall')}
              className={`px-2 py-0.5 rounded transition ${
                heightPreset === 'tall'
                  ? 'bg-slate-800 text-emerald-400 font-bold border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              900px (Tall)
            </button>
            <button
              onClick={() => setHeightPreset('cinema')}
              className={`px-2 py-0.5 rounded transition ${
                heightPreset === 'cinema'
                  ? 'bg-slate-800 text-emerald-400 font-bold border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Cinema (Full)
            </button>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition flex items-center gap-1"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-amber-400" /> : <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />}
            <span className="text-[11px] hidden lg:inline">{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
          </button>

          {/* Reload Button */}
          <button
            onClick={() => setKey((k) => k + 1)}
            title="Reload Chart"
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* TradingView Widget Container with Tall Dynamic Viewport */}
      <div
        className="tradingview-widget-container w-full transition-all duration-300"
        style={{
          height: getContainerHeight(),
          minHeight: '600px',
        }}
        ref={containerRef}
      />
    </div>
  );
};
