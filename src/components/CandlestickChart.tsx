import React, { useEffect, useRef, useState } from 'react';
import {
  createChart,
  ColorType,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  LineStyle,
  IChartApi,
  ISeriesApi,
} from 'lightweight-charts';
import { Candle, TechnicalAnalysisResult } from '../types/crypto';
import { Eye, EyeOff, Layers, Activity, Maximize2, RefreshCw } from 'lucide-react';

interface Props {
  candles: Candle[];
  technicals?: TechnicalAnalysisResult | null;
  symbol: string;
  interval: string;
  isDelayed?: boolean;
  dataSource?: string;
  onRefresh?: () => void;
}

export const CandlestickChart: React.FC<Props> = ({
  candles,
  technicals,
  symbol,
  interval,
  isDelayed,
  dataSource,
  onRefresh,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const rsiContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<IChartApi | null>(null);
  const rsiChartInstanceRef = useRef<IChartApi | null>(null);

  // Indicators toggles
  const [showEMA9, setShowEMA9] = useState(true);
  const [showEMA21, setShowEMA21] = useState(true);
  const [showEMA50, setShowEMA50] = useState(false);
  const [showEMA200, setShowEMA200] = useState(false);
  const [showVolume, setShowVolume] = useState(true);
  const [showSR, setShowSR] = useState(true);
  const [showFib, setShowFib] = useState(false);
  const [showRSI, setShowRSI] = useState(true);
  const [chartHeight, setChartHeight] = useState<number>(680);

  // Hover state
  const [hoverData, setHoverData] = useState<{
    time?: number;
    open?: number;
    high?: number;
    low?: number;
    close?: number;
    changePct?: number;
  } | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current || candles.length === 0) return;

    // Clean previous chart
    if (chartInstanceRef.current) {
      chartInstanceRef.current.remove();
      chartInstanceRef.current = null;
    }

    const container = chartContainerRef.current;
    const chart = createChart(container, {
      width: container.clientWidth,
      height: chartHeight,
      layout: {
        background: { type: ColorType.Solid, color: '#090d16' },
        textColor: '#94a3b8',
        fontSize: 12,
        fontFamily: "'JetBrains Mono', monospace",
      },
      grid: {
        vertLines: { color: 'rgba(30, 41, 59, 0.45)' },
        horzLines: { color: 'rgba(30, 41, 59, 0.45)' },
      },
      crosshair: {
        mode: 1, // Magnet
        vertLine: {
          color: '#64748b',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#1e293b',
        },
        horzLine: {
          color: '#64748b',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#1e293b',
        },
      },
      timeScale: {
        borderColor: '#1e293b',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: '#1e293b',
        scaleMargins: {
          top: 0.1,
          bottom: showVolume ? 0.2 : 0.1,
        },
      },
    });

    chartInstanceRef.current = chart;

    // 1. Candlestick Series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#f43f5e',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#f43f5e',
    });

    const formattedCandles = candles.map((c) => ({
      time: c.time as any,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));
    candleSeries.setData(formattedCandles);

    // 2. Volume Histogram
    if (showVolume) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: 'volume' },
        priceScaleId: '', // overlay
      });

      volumeSeries.priceScale().applyOptions({
        scaleMargins: { top: 0.82, bottom: 0 },
      });

      const volumeData = candles.map((c) => ({
        time: c.time as any,
        value: c.volume,
        color: c.close >= c.open ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)',
      }));
      volumeSeries.setData(volumeData);
    }

    // Helper to calculate EMA on client data
    const calculateClientEMA = (period: number) => {
      const k = 2 / (period + 1);
      let ema = candles[0].close;
      const res: Array<{ time: any; value: number }> = [];
      for (let i = 0; i < candles.length; i++) {
        ema = candles[i].close * k + ema * (1 - k);
        if (i >= period - 1) {
          res.push({ time: candles[i].time as any, value: Number(ema.toFixed(2)) });
        }
      }
      return res;
    };

    // 3. EMAs
    if (showEMA9) {
      const ema9Series = chart.addSeries(LineSeries, {
        color: '#38bdf8',
        lineWidth: 2,
        priceLineVisible: false,
        title: 'EMA 9',
      });
      ema9Series.setData(calculateClientEMA(9));
    }

    if (showEMA21) {
      const ema21Series = chart.addSeries(LineSeries, {
        color: '#fbbf24',
        lineWidth: 2,
        priceLineVisible: false,
        title: 'EMA 21',
      });
      ema21Series.setData(calculateClientEMA(21));
    }

    if (showEMA50) {
      const ema50Series = chart.addSeries(LineSeries, {
        color: '#a855f7',
        lineWidth: 2,
        priceLineVisible: false,
        title: 'EMA 50',
      });
      ema50Series.setData(calculateClientEMA(50));
    }

    if (showEMA200) {
      const ema200Series = chart.addSeries(LineSeries, {
        color: '#f43f5e',
        lineWidth: 2,
        priceLineVisible: false,
        title: 'EMA 200',
      });
      ema200Series.setData(calculateClientEMA(200));
    }

    // 4. Support and Resistance Lines
    if (showSR && technicals?.supportResistance) {
      const { nearestSupport, nearestResistance, supports, resistances } = technicals.supportResistance;

      if (nearestSupport) {
        candleSeries.createPriceLine({
          price: nearestSupport,
          color: '#10b981',
          lineWidth: 2,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: 'SUP (Key)',
        });
      }

      if (nearestResistance) {
        candleSeries.createPriceLine({
          price: nearestResistance,
          color: '#f43f5e',
          lineWidth: 2,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: 'RES (Key)',
        });
      }

      // Secondary lines
      supports.slice(0, 2).forEach((sup, idx) => {
        if (sup !== nearestSupport) {
          candleSeries.createPriceLine({
            price: sup,
            color: 'rgba(16, 185, 129, 0.4)',
            lineWidth: 1,
            lineStyle: LineStyle.Dotted,
            axisLabelVisible: false,
            title: `S${idx + 1}`,
          });
        }
      });

      resistances.slice(0, 2).forEach((res, idx) => {
        if (res !== nearestResistance) {
          candleSeries.createPriceLine({
            price: res,
            color: 'rgba(244, 63, 94, 0.4)',
            lineWidth: 1,
            lineStyle: LineStyle.Dotted,
            axisLabelVisible: false,
            title: `R${idx + 1}`,
          });
        }
      });
    }

    // 5. Fibonacci Retracement Levels
    if (showFib && technicals?.fibonacci) {
      const { fib236, fib382, fib500, fib618, fib786 } = technicals.fibonacci;
      const fibLevels = [
        { price: fib236, title: 'Fib 0.236', color: '#64748b' },
        { price: fib382, title: 'Fib 0.382', color: '#94a3b8' },
        { price: fib500, title: 'Fib 0.500 (Mid)', color: '#38bdf8' },
        { price: fib618, title: 'Fib 0.618 (Golden Pocket)', color: '#fbbf24' },
        { price: fib786, title: 'Fib 0.786', color: '#c084fc' },
      ];
      fibLevels.forEach((fl) => {
        candleSeries.createPriceLine({
          price: fl.price,
          color: fl.color,
          lineWidth: fl.title.includes('Golden') ? 2 : 1,
          lineStyle: LineStyle.LargeDashed,
          axisLabelVisible: true,
          title: fl.title,
        });
      });
    }

    // Crosshair move handler
    chart.subscribeCrosshairMove((param) => {
      if (!param || !param.time || !param.seriesData) {
        setHoverData(null);
        return;
      }
      const data = param.seriesData.get(candleSeries) as any;
      if (data) {
        const changePct = ((data.close - data.open) / data.open) * 100;
        setHoverData({
          time: Number(param.time),
          open: data.open,
          high: data.high,
          low: data.low,
          close: data.close,
          changePct: Number(changePct.toFixed(2)),
        });
      }
    });

    chart.timeScale().fitContent();

    // Resize observer
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartInstanceRef.current = null;
    };
  }, [candles, showEMA9, showEMA21, showEMA50, showEMA200, showVolume, showSR, showFib, technicals, chartHeight]);

  // RSI Sub-chart
  useEffect(() => {
    if (!showRSI || !rsiContainerRef.current || candles.length < 15) return;

    if (rsiChartInstanceRef.current) {
      rsiChartInstanceRef.current.remove();
      rsiChartInstanceRef.current = null;
    }

    const container = rsiContainerRef.current;
    const rsiChart = createChart(container, {
      width: container.clientWidth,
      height: 120,
      layout: {
        background: { type: ColorType.Solid, color: '#090d16' },
        textColor: '#94a3b8',
        fontSize: 11,
        fontFamily: "'JetBrains Mono', monospace",
      },
      grid: {
        vertLines: { color: 'rgba(30, 41, 59, 0.3)' },
        horzLines: { color: 'rgba(30, 41, 59, 0.3)' },
      },
      rightPriceScale: {
        borderColor: '#1e293b',
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: '#1e293b',
        visible: false, // share time perspective with main chart
      },
    });

    rsiChartInstanceRef.current = rsiChart;

    const rsiSeries = rsiChart.addSeries(LineSeries, {
      color: '#c084fc',
      lineWidth: 2,
      priceLineVisible: false,
      title: 'RSI 14',
    });

    // Compute RSI series
    const rsiData: Array<{ time: any; value: number }> = [];
    const closes = candles.map((c) => c.close);
    const period = 14;

    let gains = 0;
    let losses = 0;
    for (let i = 1; i <= period; i++) {
      const diff = closes[i] - closes[i - 1];
      if (diff >= 0) gains += diff;
      else losses += Math.abs(diff);
    }
    let avgG = gains / period;
    let avgL = losses / period;

    for (let i = period + 1; i < candles.length; i++) {
      const diff = closes[i] - closes[i - 1];
      if (diff >= 0) {
        avgG = (avgG * (period - 1) + diff) / period;
        avgL = (avgL * (period - 1)) / period;
      } else {
        avgG = (avgG * (period - 1)) / period;
        avgL = (avgL * (period - 1) + Math.abs(diff)) / period;
      }
      const rs = avgL === 0 ? 100 : avgG / avgL;
      const rsi = 100 - 100 / (1 + rs);
      rsiData.push({ time: candles[i].time as any, value: Number(rsi.toFixed(2)) });
    }

    rsiSeries.setData(rsiData);

    // 70 and 30 Overbought/Oversold guide lines
    rsiSeries.createPriceLine({
      price: 70,
      color: 'rgba(244, 63, 94, 0.6)',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: '70 OB',
    });
    rsiSeries.createPriceLine({
      price: 30,
      color: 'rgba(16, 185, 129, 0.6)',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: '30 OS',
    });
    rsiSeries.createPriceLine({
      price: 50,
      color: 'rgba(148, 163, 184, 0.3)',
      lineWidth: 1,
      lineStyle: LineStyle.Dotted,
      axisLabelVisible: false,
      title: '50',
    });

    rsiChart.timeScale().fitContent();

    const handleResize = () => {
      if (rsiContainerRef.current) {
        rsiChart.applyOptions({ width: rsiContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      rsiChart.remove();
      rsiChartInstanceRef.current = null;
    };
  }, [showRSI, candles]);

  const latestCandle = candles[candles.length - 1];
  const activePrice = hoverData?.close || latestCandle?.close || 0;
  const activeChange = hoverData?.changePct !== undefined
    ? hoverData.changePct
    : latestCandle
    ? Number((((latestCandle.close - latestCandle.open) / latestCandle.open) * 100).toFixed(2))
    : 0;

  return (
    <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Top Chart Header / Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-800 bg-slate-950/70">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg text-white tracking-wide">{symbol}</span>
            <span className="text-xs px-2 py-0.5 rounded font-mono bg-slate-800 text-slate-300">
              {interval.toUpperCase()}
            </span>
          </div>

          <div className="flex items-baseline gap-2 font-mono">
            <span className="text-xl font-bold text-slate-100">
              ${activePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            </span>
            <span
              className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                activeChange >= 0
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-rose-500/15 text-rose-400'
              }`}
            >
              {activeChange >= 0 ? '+' : ''}{activeChange}%
            </span>
          </div>

          {/* OHLC readout */}
          {hoverData && (
            <div className="hidden lg:flex items-center gap-3 text-xs font-mono text-slate-400">
              <span>O: <span className="text-slate-200">${hoverData.open}</span></span>
              <span>H: <span className="text-slate-200">${hoverData.high}</span></span>
              <span>L: <span className="text-slate-200">${hoverData.low}</span></span>
              <span>C: <span className="text-slate-200">${hoverData.close}</span></span>
            </div>
          )}
        </div>

        {/* Indicator Toggles */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
          <button
            onClick={() => setShowEMA9(!showEMA9)}
            className={`px-2 py-1 rounded transition border ${
              showEMA9
                ? 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                : 'bg-slate-800/60 text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            EMA 9
          </button>
          <button
            onClick={() => setShowEMA21(!showEMA21)}
            className={`px-2 py-1 rounded transition border ${
              showEMA21
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : 'bg-slate-800/60 text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            EMA 21
          </button>
          <button
            onClick={() => setShowEMA50(!showEMA50)}
            className={`px-2 py-1 rounded transition border ${
              showEMA50
                ? 'bg-purple-500/20 text-purple-400 border-purple-500/40'
                : 'bg-slate-800/60 text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            EMA 50
          </button>
          <button
            onClick={() => setShowEMA200(!showEMA200)}
            className={`px-2 py-1 rounded transition border ${
              showEMA200
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                : 'bg-slate-800/60 text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            EMA 200
          </button>
          <button
            onClick={() => setShowSR(!showSR)}
            className={`px-2 py-1 rounded transition border ${
              showSR
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-slate-800/60 text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            S/R Levels
          </button>
          <button
            onClick={() => setShowFib(!showFib)}
            className={`px-2 py-1 rounded transition border ${
              showFib
                ? 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                : 'bg-slate-800/60 text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            Fibonacci
          </button>
          <button
            onClick={() => setShowRSI(!showRSI)}
            className={`px-2 py-1 rounded transition border ${
              showRSI
                ? 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/40'
                : 'bg-slate-800/60 text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            RSI (14)
          </button>

          {/* Height Selector */}
          <div className="flex items-center gap-1 border-l border-slate-800 pl-1.5 ml-1">
            <span className="text-[10px] text-slate-500">Height:</span>
            {[580, 680, 800].map((h) => (
              <button
                key={h}
                onClick={() => setChartHeight(h)}
                className={`px-1.5 py-0.5 rounded text-[10px] transition ${
                  chartHeight === h
                    ? 'bg-slate-700 text-emerald-400 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {h}px
              </button>
            ))}
          </div>

          {onRefresh && (
            <button
              onClick={onRefresh}
              title="Refresh Candles"
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition ml-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Chart Canvas with Expanded Height */}
      <div className="relative w-full transition-all duration-200" style={{ height: `${chartHeight}px` }}>
        <div ref={chartContainerRef} className="w-full h-full" />

        {/* Data Source & Delay Indicator (Fulfills Rule 4) */}
        <div className="absolute bottom-2 left-3 z-10 flex items-center gap-2 pointer-events-none bg-slate-950/80 backdrop-blur px-2.5 py-1 rounded-md border border-slate-800 text-[11px] font-mono">
          <div
            className={`w-2 h-2 rounded-full ${
              isDelayed ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
            }`}
          />
          <span className="text-slate-300">
            {isDelayed ? 'DATA DELAYED / CACHED' : 'LIVE MARKET DATA'}
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">{dataSource || 'BINANCE_REST_API'}</span>
        </div>
      </div>

      {/* RSI Sub-Chart Panel */}
      {showRSI && (
        <div className="border-t border-slate-800 bg-slate-950/90 relative">
          <div className="flex items-center justify-between px-3 py-1 bg-slate-900/60 border-b border-slate-800/60 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5 text-fuchsia-300 font-semibold">
              <Activity className="w-3 h-3" /> RSI (14)
            </span>
            <span className="text-slate-400">
              Value: <strong className="text-slate-200">{technicals?.rsi.rsi14 ?? '50'}</strong> ({technicals?.rsi.condition ?? 'NEUTRAL'})
            </span>
          </div>
          <div ref={rsiContainerRef} className="w-full h-[120px]" />
        </div>
      )}
    </div>
  );
};
