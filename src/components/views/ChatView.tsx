import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  User,
  Sparkles,
  RefreshCw,
  HelpCircle,
  TrendingUp,
  AlertTriangle,
  Layers,
  Shield,
  Zap,
} from 'lucide-react';
import { sendChatMessage } from '../../services/api';
import { Ticker24h, TechnicalAnalysisResult } from '../../types/crypto';
import { CryptoSelector } from '../CryptoSelector';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

interface Props {
  selectedSymbol: string;
  onSelectSymbol?: (symbol: string) => void;
  tickers: Ticker24h[];
  technicals?: TechnicalAnalysisResult | null;
  geminiActive: boolean;
}

const DEFAULT_SUGGESTIONS = [
  'Analyze BTC 4H market structure & key levels',
  'Explain Fair Value Gaps (FVG) vs Order Blocks',
  'How do I calculate a 1% risk position on SOL?',
  'What is the difference between EMA 50 & 200?',
  'How do I spot liquidity sweeps and CHOCH?',
];

export const ChatView: React.FC<Props> = ({
  selectedSymbol,
  onSelectSymbol,
  tickers,
  technicals,
  geminiActive,
}) => {
  const currentTicker = tickers.find((t) => t.symbol === selectedSymbol);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `Hello! I am **CryptoPilot AI**, your cryptocurrency market analysis and trading research copilot.

I can assist you with:
- **Smart Money Concepts (ICT)**: Fair Value Gaps (FVG), Order Blocks, Liquidity Sweeps (BSL/SSL), and Break of Structure (BOS/CHOCH).
- **Technical Indicators**: EMAs (9, 21, 50, 200), RSI momentum, MACD histograms, and Fibonacci golden zones.
- **Risk Management**: Position sizing formulas, stop-loss invalidations, and risk/reward ratios.
- **Real-Time Analysis**: Evaluating the live setup for **${selectedSymbol}** or any tracked cryptocurrency.

*Note: All analyses and forecasts are probabilistic research models with inherent market uncertainty.*`,
      timestamp: Date.now(),
    },
  ]);

  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [injectContext, setInjectContext] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || inputValue).trim();
    if (!query || loading) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}-u`,
      role: 'user',
      text: query,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    try {
      const history = messages.slice(-6).map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const marketContext = injectContext
        ? {
            symbol: selectedSymbol,
            tickers,
            technicals,
          }
        : undefined;

      const reply = await sendChatMessage({
        message: query,
        history,
        marketContext,
      });

      const modelMsg: Message = {
        id: `msg-${Date.now()}-m`,
        role: 'model',
        text: reply,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, modelMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: `msg-${Date.now()}-err`,
        role: 'model',
        text: `Error connecting to AI service: ${err.message || 'Unable to process request.'}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-14rem)] min-h-[550px] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* 1. Chat Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-slate-950/80 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-slate-950 shadow-md shrink-0">
            <Bot className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">CryptoPilot AI Copilot</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                GEMINI 3.8 FLASH
              </span>
            </div>
            <div className="text-xs text-slate-400 font-mono flex items-center gap-2 mt-0.5">
              <span>Context:</span>
              {onSelectSymbol ? (
                <CryptoSelector
                  selectedSymbol={selectedSymbol}
                  onSelectSymbol={onSelectSymbol}
                  tickers={tickers}
                  showCategoryTabs={false}
                  className="scale-90 origin-left"
                />
              ) : (
                <strong className="text-slate-200">{selectedSymbol} (${currentTicker?.lastPrice ?? '87,450'})</strong>
              )}
            </div>
          </div>
        </div>

        {/* Context injection toggle */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-mono text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={injectContext}
              onChange={(e) => setInjectContext(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0 w-3.5 h-3.5"
            />
            <span className="hidden sm:inline">Inject Live Price & Indicators</span>
          </label>

          <button
            onClick={() => setMessages([messages[0]])}
            title="Reset Conversation"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${
                isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold ${
                  isUser
                    ? 'bg-slate-800 text-slate-200 border border-slate-700'
                    : 'bg-emerald-500 text-slate-950 font-black'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  isUser
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-100 rounded-tr-none'
                    : 'bg-slate-950/70 border border-slate-800/80 text-slate-200 rounded-tl-none prose prose-invert max-w-none'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>
                <div
                  className={`mt-1.5 text-[10px] font-mono ${
                    isUser ? 'text-emerald-400/60 text-right' : 'text-slate-500'
                  }`}
                >
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 max-w-xl mr-auto">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 font-black flex items-center justify-center">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="rounded-2xl px-4 py-3 bg-slate-950/70 border border-slate-800 text-sm text-slate-400 flex items-center gap-2 font-mono">
              <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>Analyzing live order flow & calculating confluences...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Prompt Suggestions Bar */}
      <div className="px-4 py-2 border-t border-slate-800/60 bg-slate-950/50 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[11px] font-mono text-slate-400 shrink-0 flex items-center gap-1">
          <Zap className="w-3 h-3 text-amber-400" /> Prompts:
        </span>
        {DEFAULT_SUGGESTIONS.map((sug, i) => (
          <button
            key={i}
            onClick={() => handleSend(sug)}
            className="text-xs font-mono text-slate-300 hover:text-white bg-slate-800/70 hover:bg-slate-800 px-2.5 py-1 rounded-full whitespace-nowrap transition border border-slate-700/60 shrink-0"
          >
            {sug}
          </button>
        ))}
      </div>

      {/* 4. Input Box */}
      <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask CryptoPilot about ${selectedSymbol}, indicators, SMC setups, or risk... (Press Enter to send)`}
            rows={1}
            className="flex-1 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 resize-none outline-none transition font-sans"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || loading}
            className="px-4 py-2.5 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
        <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Rule 6: All forecasts are probabilistic hypotheses and carry uncertainty.</span>
          <span>Paper simulation active</span>
        </div>
      </div>
    </div>
  );
};
