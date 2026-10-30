import React, { useState } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  XCircle,
  CheckCircle2,
  DollarSign,
  Percent,
  Sliders,
  History,
  Lock,
} from 'lucide-react';
import {
  PaperAccount,
  Ticker24h,
} from '../../types/crypto';
import { openPaperOrder, closePaperPosition, resetPaperAccount } from '../../services/api';

interface Props {
  paperAccount: PaperAccount | null;
  tickers: Ticker24h[];
  selectedSymbol: string;
  onRefreshAccount: () => void;
}

export const PaperTradingView: React.FC<Props> = ({
  paperAccount,
  tickers,
  selectedSymbol,
  onRefreshAccount,
}) => {
  const [symbol, setSymbol] = useState(selectedSymbol || 'BTCUSDT');
  const [side, setSide] = useState<'LONG' | 'SHORT'>('LONG');
  const [amountUsd, setAmountUsd] = useState<number>(2500);
  const [leverage, setLeverage] = useState<number>(3);
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [closingId, setClosingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const currentTicker = tickers.find((t) => t.symbol === symbol);
  const livePrice = currentTicker?.lastPrice || 87450;
  const balance = paperAccount?.balanceUsd || 50000;
  const equity = paperAccount?.equityUsd || 50000;

  // Margin calculation
  const marginRequired = amountUsd / leverage;
  const estimatedFee = (amountUsd * 0.05) / 100;

  const handleOpenOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!livePrice || amountUsd <= 0) return;

    setSubmitting(true);
    setActionMessage(null);

    try {
      const res = await openPaperOrder({
        symbol,
        side,
        amountUsd,
        currentPrice: livePrice,
        leverage,
        stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
        takeProfit: takeProfit ? parseFloat(takeProfit) : undefined,
      });

      if (res.success) {
        setActionMessage({
          type: 'success',
          text: `Simulated ${side} order executed for $${amountUsd.toLocaleString()} ${symbol} at $${res.position.entryPrice}.`,
        });
        setStopLoss('');
        setTakeProfit('');
        onRefreshAccount();
      } else {
        setActionMessage({ type: 'error', text: res.error || 'Failed to place order.' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Execution error.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = async (positionId: string, currentPosPrice: number) => {
    setClosingId(positionId);
    try {
      const res = await closePaperPosition(positionId, currentPosPrice);
      if (res.success) {
        setActionMessage({
          type: 'success',
          text: `Closed position with realized PnL of ${res.trade.realizedPnl >= 0 ? '+' : ''}$${res.trade.realizedPnl}.`,
        });
        onRefreshAccount();
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    } finally {
      setClosingId(null);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Reset simulated portfolio back to $50,000 USDT?')) {
      await resetPaperAccount(50000);
      onRefreshAccount();
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Safe Simulation Banner (Fulfills Rule 8) */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Paper Trading Sandbox</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                ZERO FINANCIAL RISK
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Live order execution is disabled. All orders, balances, fees, and margin are simulated in this safe sandbox.
            </p>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
        >
          Reset $50,000 Balance
        </button>
      </div>

      {actionMessage && (
        <div
          className={`p-3.5 rounded-xl text-xs font-mono border ${
            actionMessage.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
          }`}
        >
          {actionMessage.text}
        </div>
      )}

      {/* 2. Portfolio Balance & Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-slate-400 text-[11px]">VIRTUAL EQUITY</span>
          <div className="text-xl font-bold text-white mt-1">
            ${equity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-slate-400">Unrealized marked live</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-slate-400 text-[11px]">FREE BALANCE</span>
          <div className="text-xl font-bold text-emerald-400 mt-1">
            ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-slate-400">Available margin</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-slate-400 text-[11px]">REALIZED PNL</span>
          <div
            className={`text-xl font-bold mt-1 ${
              (paperAccount?.totalRealizedPnl || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {(paperAccount?.totalRealizedPnl || 0) >= 0 ? '+' : ''}$
            {paperAccount?.totalRealizedPnl.toFixed(2) ?? '0.00'}
          </div>
          <span className="text-[10px] text-slate-400">Closed positions</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-slate-400 text-[11px]">OPEN POSITIONS</span>
          <div className="text-xl font-bold text-sky-400 mt-1">
            {paperAccount?.openPositions.length ?? 0}
          </div>
          <span className="text-[10px] text-slate-400">Active market risk</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-slate-400 text-[11px]">SIMULATED FEES</span>
          <div className="text-xl font-bold text-slate-300 mt-1">
            ${paperAccount?.totalFeesPaid.toFixed(2) ?? '0.00'}
          </div>
          <span className="text-[10px] text-slate-400">0.05% taker deducted</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-slate-400 text-[11px]">MAX DRAWDOWN</span>
          <div className="text-xl font-bold text-rose-400 mt-1">
            -{paperAccount?.maxDrawdownPercent.toFixed(1) ?? '0.0'}%
          </div>
          <span className="text-[10px] text-slate-400">Account peak metric</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Simulated Order Ticket */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="font-bold text-white text-base pb-2 border-b border-slate-800 flex items-center justify-between">
            <span>Fast Order Ticket</span>
            <span className="text-xs font-mono text-emerald-400 font-normal">${livePrice.toLocaleString()}</span>
          </h3>

          <form onSubmit={handleOpenOrder} className="space-y-4 text-xs font-mono">
            {/* Asset Selection */}
            <div>
              <label className="block text-slate-400 mb-1.5 font-bold">ASSET PAIR</label>
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

            {/* Side Long / Short */}
            <div>
              <label className="block text-slate-400 mb-1.5 font-bold">POSITION SIDE</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSide('LONG')}
                  className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition ${
                    side === 'LONG'
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" /> LONG (Buy)
                </button>
                <button
                  type="button"
                  onClick={() => setSide('SHORT')}
                  className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition ${
                    side === 'SHORT'
                      ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <TrendingDown className="w-3.5 h-3.5" /> SHORT (Sell)
                </button>
              </div>
            </div>

            {/* Position Size (USDT) */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-400 font-bold">ORDER SIZE (USDT)</span>
                <span className="text-slate-400">Req Margin: ${marginRequired.toFixed(2)}</span>
              </div>
              <input
                type="number"
                min="10"
                step="50"
                value={amountUsd}
                onChange={(e) => setAmountUsd(Number(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 outline-none text-sm font-bold"
              />
              <div className="grid grid-cols-4 gap-1.5 mt-1.5 text-[11px]">
                {[0.1, 0.25, 0.5, 0.8].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setAmountUsd(Math.floor(balance * pct * leverage))}
                    className="py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    {pct * 100}%
                  </button>
                ))}
              </div>
            </div>

            {/* Leverage Slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-400 font-bold">LEVERAGE MULTIPLIER</span>
                <span className="text-emerald-400 font-bold">{leverage}x</span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                step="1"
                value={leverage}
                onChange={(e) => setLeverage(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>1x (Spot)</span>
                <span>5x</span>
                <span>10x</span>
                <span>20x (Max)</span>
              </div>
            </div>

            {/* Take Profit & Stop Loss */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-emerald-400 mb-1 font-bold">TAKE PROFIT (TP)</label>
                <input
                  type="number"
                  step="any"
                  placeholder="Optional target"
                  value={takeProfit}
                  onChange={(e) => setTakeProfit(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-rose-400 mb-1 font-bold">STOP LOSS (SL)</label>
                <input
                  type="number"
                  step="any"
                  placeholder="Optional stop"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:border-rose-500 outline-none"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Estimated Taker Fee:</span>
                <span className="text-slate-200">${estimatedFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Simulated Slippage:</span>
                <span className="text-slate-200">0.03%</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || marginRequired > balance}
              className={`w-full py-3 rounded-xl font-bold text-sm transition shadow-lg ${
                side === 'LONG'
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                  : 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
              } disabled:opacity-50`}
            >
              {submitting
                ? 'Executing Order...'
                : marginRequired > balance
                ? 'Insufficient Balance'
                : `Submit Simulated ${side} Order`}
            </button>
          </form>
        </div>

        {/* Right: Active Open Positions & History */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Positions Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow">
            <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-white text-sm">
                  Open Positions ({paperAccount?.openPositions.length ?? 0})
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">Live marked to ticker</span>
            </div>

            <div className="overflow-x-auto">
              {!paperAccount || paperAccount.openPositions.length === 0 ? (
                <div className="p-8 text-center text-xs font-mono text-slate-400">
                  No open positions. Use the order ticket on the left to execute a trade.
                </div>
              ) : (
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-2.5">Asset</th>
                      <th className="px-4 py-2.5">Entry / Current</th>
                      <th className="px-4 py-2.5">Size / Lev</th>
                      <th className="px-4 py-2.5">Unrealized PnL</th>
                      <th className="px-4 py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {paperAccount.openPositions.map((pos) => {
                      const isPos = pos.unrealizedPnl >= 0;
                      return (
                        <tr key={pos.id} className="hover:bg-slate-800/40">
                          <td className="px-4 py-3">
                            <div className="font-bold text-white flex items-center gap-1.5">
                              {pos.symbol}
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                  pos.side === 'LONG'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-rose-500/20 text-rose-400'
                                }`}
                              >
                                {pos.side}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              TP: {pos.takeProfit ? `$${pos.takeProfit}` : '-'} | SL: {pos.stopLoss ? `$${pos.stopLoss}` : '-'}
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <div className="text-slate-200">${pos.entryPrice.toLocaleString()}</div>
                            <div className="text-slate-400 text-[11px]">${pos.currentPrice.toLocaleString()}</div>
                          </td>

                          <td className="px-4 py-3">
                            <div className="text-slate-200">${pos.amountUsd.toLocaleString()}</div>
                            <div className="text-slate-400 text-[11px]">{pos.leverage}x Lev</div>
                          </td>

                          <td className="px-4 py-3 font-bold">
                            <div className={isPos ? 'text-emerald-400' : 'text-rose-400'}>
                              {isPos ? '+' : ''}${pos.unrealizedPnl.toFixed(2)}
                            </div>
                            <div className={`text-[10px] ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                              ({isPos ? '+' : ''}{pos.unrealizedPnlPercent}%)
                            </div>
                          </td>

                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleClose(pos.id, pos.currentPrice)}
                              disabled={closingId === pos.id}
                              className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-rose-400 border border-slate-700 transition"
                            >
                              {closingId === pos.id ? 'Closing...' : 'Close'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Closed Trades History */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow">
            <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-slate-400" />
                <h3 className="font-bold text-white text-sm">
                  Simulated Trade History ({paperAccount?.tradeHistory.length ?? 0})
                </h3>
              </div>
            </div>

            <div className="overflow-x-auto max-h-60">
              {!paperAccount || paperAccount.tradeHistory.length === 0 ? (
                <div className="p-6 text-center text-xs font-mono text-slate-400">
                  No trade history yet. Closed trades will appear here with fees and realized PnL.
                </div>
              ) : (
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950 text-slate-400 uppercase sticky top-0 border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-2">Asset / Side</th>
                      <th className="px-4 py-2">Entry &rarr; Exit</th>
                      <th className="px-4 py-2">Realized PnL</th>
                      <th className="px-4 py-2">Fee</th>
                      <th className="px-4 py-2">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {paperAccount.tradeHistory.map((tr) => (
                      <tr key={tr.id} className="hover:bg-slate-800/30">
                        <td className="px-4 py-2.5 font-bold">
                          <span className="text-white mr-1.5">{tr.symbol}</span>
                          <span className={tr.side === 'LONG' ? 'text-emerald-400' : 'text-rose-400'}>
                            {tr.side}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-300">
                          ${tr.entryPrice.toLocaleString()} &rarr; ${tr.exitPrice.toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 font-bold">
                          <span className={tr.realizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {tr.realizedPnl >= 0 ? '+' : ''}${tr.realizedPnl.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-400">-${tr.feeUsd.toFixed(2)}</td>
                        <td className="px-4 py-2.5">
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">
                            {tr.exitReason}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
