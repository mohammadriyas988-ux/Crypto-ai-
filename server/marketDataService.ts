import { Candle, Ticker24h } from './types.js';

export interface SymbolMeta {
  name: string;
  baseAsset: string;
  quoteAsset: string;
  category: 'MAJORS' | 'LAYER1' | 'LAYER2' | 'DEFI' | 'AI_DATA' | 'MEMES' | 'INFRA';
}

export const TRACKED_SYMBOLS: Record<string, SymbolMeta> = {
  // MAJORS
  BTCUSDT: { name: 'Bitcoin', baseAsset: 'BTC', quoteAsset: 'USDT', category: 'MAJORS' },
  ETHUSDT: { name: 'Ethereum', baseAsset: 'ETH', quoteAsset: 'USDT', category: 'MAJORS' },
  SOLUSDT: { name: 'Solana', baseAsset: 'SOL', quoteAsset: 'USDT', category: 'MAJORS' },
  BNBUSDT: { name: 'BNB', baseAsset: 'BNB', quoteAsset: 'USDT', category: 'MAJORS' },
  XRPUSDT: { name: 'XRP (Ripple)', baseAsset: 'XRP', quoteAsset: 'USDT', category: 'MAJORS' },
  ADAUSDT: { name: 'Cardano', baseAsset: 'ADA', quoteAsset: 'USDT', category: 'MAJORS' },
  DOGEUSDT: { name: 'Dogecoin', baseAsset: 'DOGE', quoteAsset: 'USDT', category: 'MAJORS' },
  AVAXUSDT: { name: 'Avalanche', baseAsset: 'AVAX', quoteAsset: 'USDT', category: 'MAJORS' },
  TRXUSDT: { name: 'TRON', baseAsset: 'TRX', quoteAsset: 'USDT', category: 'MAJORS' },
  DOTUSDT: { name: 'Polkadot', baseAsset: 'DOT', quoteAsset: 'USDT', category: 'MAJORS' },
  TONUSDT: { name: 'Toncoin', baseAsset: 'TON', quoteAsset: 'USDT', category: 'MAJORS' },

  // LAYER 1
  SUIUSDT: { name: 'Sui', baseAsset: 'SUI', quoteAsset: 'USDT', category: 'LAYER1' },
  NEARUSDT: { name: 'NEAR Protocol', baseAsset: 'NEAR', quoteAsset: 'USDT', category: 'LAYER1' },
  APTUSDT: { name: 'Aptos', baseAsset: 'APT', quoteAsset: 'USDT', category: 'LAYER1' },
  KASUSDT: { name: 'Kaspa', baseAsset: 'KAS', quoteAsset: 'USDT', category: 'LAYER1' },
  INJUSDT: { name: 'Injective', baseAsset: 'INJ', quoteAsset: 'USDT', category: 'LAYER1' },
  SEIUSDT: { name: 'Sei', baseAsset: 'SEI', quoteAsset: 'USDT', category: 'LAYER1' },
  ATOMUSDT: { name: 'Cosmos', baseAsset: 'ATOM', quoteAsset: 'USDT', category: 'LAYER1' },
  HBARUSDT: { name: 'Hedera', baseAsset: 'HBAR', quoteAsset: 'USDT', category: 'LAYER1' },
  ICPUSDT: { name: 'Internet Computer', baseAsset: 'ICP', quoteAsset: 'USDT', category: 'LAYER1' },
  TIAUSDT: { name: 'Celestia', baseAsset: 'TIA', quoteAsset: 'USDT', category: 'LAYER1' },
  ALGOUSDT: { name: 'Algorand', baseAsset: 'ALGO', quoteAsset: 'USDT', category: 'LAYER1' },
  FTMUSDT: { name: 'Fantom', baseAsset: 'FTM', quoteAsset: 'USDT', category: 'LAYER1' },

  // LAYER 2
  ARBUSDT: { name: 'Arbitrum', baseAsset: 'ARB', quoteAsset: 'USDT', category: 'LAYER2' },
  OPUSDT: { name: 'Optimism', baseAsset: 'OP', quoteAsset: 'USDT', category: 'LAYER2' },
  POLUSDT: { name: 'Polygon', baseAsset: 'POL', quoteAsset: 'USDT', category: 'LAYER2' },
  STRKUSDT: { name: 'Starknet', baseAsset: 'STRK', quoteAsset: 'USDT', category: 'LAYER2' },
  IMXUSDT: { name: 'Immutable', baseAsset: 'IMX', quoteAsset: 'USDT', category: 'LAYER2' },
  MANTAUSDT: { name: 'Manta Network', baseAsset: 'MANTA', quoteAsset: 'USDT', category: 'LAYER2' },

  // DEFI
  LINKUSDT: { name: 'Chainlink', baseAsset: 'LINK', quoteAsset: 'USDT', category: 'DEFI' },
  UNIUSDT: { name: 'Uniswap', baseAsset: 'UNI', quoteAsset: 'USDT', category: 'DEFI' },
  AAVEUSDT: { name: 'Aave', baseAsset: 'AAVE', quoteAsset: 'USDT', category: 'DEFI' },
  MKRUSDT: { name: 'Maker', baseAsset: 'MKR', quoteAsset: 'USDT', category: 'DEFI' },
  JUPUSDT: { name: 'Jupiter', baseAsset: 'JUP', quoteAsset: 'USDT', category: 'DEFI' },
  PENDLEUSDT: { name: 'Pendle', baseAsset: 'PENDLE', quoteAsset: 'USDT', category: 'DEFI' },
  RUNEUSDT: { name: 'THORChain', baseAsset: 'RUNE', quoteAsset: 'USDT', category: 'DEFI' },
  CRVUSDT: { name: 'Curve DAO', baseAsset: 'CRV', quoteAsset: 'USDT', category: 'DEFI' },
  LDOUSDT: { name: 'Lido DAO', baseAsset: 'LDO', quoteAsset: 'USDT', category: 'DEFI' },
  ENAUSDT: { name: 'Ethena', baseAsset: 'ENA', quoteAsset: 'USDT', category: 'DEFI' },
  ONDOUSDT: { name: 'Ondo Finance', baseAsset: 'ONDO', quoteAsset: 'USDT', category: 'DEFI' },

  // AI & BIG DATA
  TAOUSDT: { name: 'Bittensor', baseAsset: 'TAO', quoteAsset: 'USDT', category: 'AI_DATA' },
  RENDERUSDT: { name: 'Render', baseAsset: 'RENDER', quoteAsset: 'USDT', category: 'AI_DATA' },
  FETUSDT: { name: 'Artificial Superintelligence', baseAsset: 'FET', quoteAsset: 'USDT', category: 'AI_DATA' },
  GRTUSDT: { name: 'The Graph', baseAsset: 'GRT', quoteAsset: 'USDT', category: 'AI_DATA' },
  WLDUSDT: { name: 'Worldcoin', baseAsset: 'WLD', quoteAsset: 'USDT', category: 'AI_DATA' },
  ARUSDT: { name: 'Arweave', baseAsset: 'AR', quoteAsset: 'USDT', category: 'AI_DATA' },
  AKTUSDT: { name: 'Akash Network', baseAsset: 'AKT', quoteAsset: 'USDT', category: 'AI_DATA' },

  // MEME COINS
  SHIBUSDT: { name: 'Shiba Inu', baseAsset: 'SHIB', quoteAsset: 'USDT', category: 'MEMES' },
  PEPEUSDT: { name: 'Pepe', baseAsset: 'PEPE', quoteAsset: 'USDT', category: 'MEMES' },
  WIFUSDT: { name: 'dogwifhat', baseAsset: 'WIF', quoteAsset: 'USDT', category: 'MEMES' },
  BONKUSDT: { name: 'Bonk', baseAsset: 'BONK', quoteAsset: 'USDT', category: 'MEMES' },
  FLOKIUSDT: { name: 'Floki', baseAsset: 'FLOKI', quoteAsset: 'USDT', category: 'MEMES' },
  BRETTUSDT: { name: 'Brett', baseAsset: 'BRETT', quoteAsset: 'USDT', category: 'MEMES' },
  POPCATUSDT: { name: 'Popcat', baseAsset: 'POPCAT', quoteAsset: 'USDT', category: 'MEMES' },
  BOMEUSDT: { name: 'BOOK OF MEME', baseAsset: 'BOME', quoteAsset: 'USDT', category: 'MEMES' },

  // INFRASTRUCTURE & RWA
  FILUSDT: { name: 'Filecoin', baseAsset: 'FIL', quoteAsset: 'USDT', category: 'INFRA' },
  STXUSDT: { name: 'Stacks', baseAsset: 'STX', quoteAsset: 'USDT', category: 'INFRA' },
  PYTHUSDT: { name: 'Pyth Network', baseAsset: 'PYTH', quoteAsset: 'USDT', category: 'INFRA' },
  THETAUSDT: { name: 'Theta Network', baseAsset: 'THETA', quoteAsset: 'USDT', category: 'INFRA' },
  JASMYUSDT: { name: 'JasmyCoin', baseAsset: 'JASMY', quoteAsset: 'USDT', category: 'INFRA' },
};

class MarketDataService {
  private tickerCache: Map<string, Ticker24h> = new Map();
  private candleCache: Map<string, { timestamp: number; candles: Candle[] }> = new Map();
  private lastFetchTimestamp = 0;
  private readonly CACHE_TTL_MS = 6000; // 6s cache for fast live ticks
  private readonly CANDLE_CACHE_TTL_MS = 20000; // 20s for candles

  constructor() {
    this.initFallbackData();
  }

  private initFallbackData() {
    const now = Date.now();
    for (const [symbol, info] of Object.entries(TRACKED_SYMBOLS)) {
      this.tickerCache.set(symbol, {
        symbol,
        name: info.name,
        baseAsset: info.baseAsset,
        quoteAsset: info.quoteAsset,
        category: info.category,
        lastPrice: 100,
        priceChange: 0,
        priceChangePercent: 0,
        highPrice: 105,
        lowPrice: 95,
        volume24h: 1000,
        quoteVolume24h: 100000,
        timestamp: now,
        dataSource: 'BINANCE_FALLBACK',
        isDelayed: true,
      });
    }
  }

  public async getTickers(): Promise<Ticker24h[]> {
    const now = Date.now();
    if (now - this.lastFetchTimestamp < this.CACHE_TTL_MS && this.tickerCache.size > 0) {
      return Array.from(this.tickerCache.values());
    }

    try {
      const res = await fetch('https://api.binance.com/api/v3/ticker/24hr', {
        signal: AbortSignal.timeout(5000),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const binanceMap = new Map<string, any>();
          for (const item of data) {
            binanceMap.set(item.symbol, item);
          }

          // Populate tracked symbols
          for (const [sym, info] of Object.entries(TRACKED_SYMBOLS)) {
            const item = binanceMap.get(sym);
            if (item) {
              this.tickerCache.set(sym, {
                symbol: sym,
                name: info.name,
                baseAsset: info.baseAsset,
                quoteAsset: info.quoteAsset,
                category: info.category,
                lastPrice: parseFloat(item.lastPrice),
                priceChange: parseFloat(item.priceChange),
                priceChangePercent: parseFloat(item.priceChangePercent),
                highPrice: parseFloat(item.highPrice),
                lowPrice: parseFloat(item.lowPrice),
                volume24h: parseFloat(item.volume),
                quoteVolume24h: parseFloat(item.quoteVolume),
                timestamp: item.closeTime || now,
                dataSource: 'BINANCE_LIVE',
                isDelayed: false,
              });
            }
          }
          this.lastFetchTimestamp = now;
        }
      }
    } catch (err) {
      console.warn('Live ticker fetch fallback to cached data:', (err as Error).message);
      for (const ticker of this.tickerCache.values()) {
        ticker.isDelayed = true;
      }
    }

    return Array.from(this.tickerCache.values());
  }

  public async getTicker(symbol: string): Promise<Ticker24h | undefined> {
    const cached = this.tickerCache.get(symbol);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached;
    }

    // Try fetching single symbol directly from Binance if not in cache or expired
    try {
      const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${encodeURIComponent(symbol)}`, {
        signal: AbortSignal.timeout(3500),
      });
      if (res.ok) {
        const item = await res.json();
        const info = TRACKED_SYMBOLS[symbol] || {
          name: symbol.replace('USDT', ''),
          baseAsset: symbol.replace('USDT', ''),
          quoteAsset: 'USDT',
          category: 'MAJORS' as const,
        };
        const ticker: Ticker24h = {
          symbol,
          name: info.name,
          baseAsset: info.baseAsset,
          quoteAsset: info.quoteAsset,
          category: info.category,
          lastPrice: parseFloat(item.lastPrice),
          priceChange: parseFloat(item.priceChange),
          priceChangePercent: parseFloat(item.priceChangePercent),
          highPrice: parseFloat(item.highPrice),
          lowPrice: parseFloat(item.lowPrice),
          volume24h: parseFloat(item.volume),
          quoteVolume24h: parseFloat(item.quoteVolume),
          timestamp: item.closeTime || Date.now(),
          dataSource: 'BINANCE_LIVE',
          isDelayed: false,
        };
        this.tickerCache.set(symbol, ticker);
        return ticker;
      }
    } catch {
      // ignore
    }

    return cached;
  }

  public async getCandles(
    symbol: string,
    interval = '1h',
    limit = 150
  ): Promise<{ candles: Candle[]; isDelayed: boolean; dataSource: 'BINANCE_LIVE' | 'CACHED' }> {
    const key = `${symbol}_${interval}_${limit}`;
    const cached = this.candleCache.get(key);
    const now = Date.now();

    if (cached && now - cached.timestamp < this.CANDLE_CACHE_TTL_MS) {
      return { candles: cached.candles, isDelayed: false, dataSource: 'BINANCE_LIVE' };
    }

    try {
      const url = `https://api.binance.com/api/v3/klines?symbol=${encodeURIComponent(symbol)}&interval=${interval}&limit=${limit}`;
      const res = await fetch(url, {
        signal: AbortSignal.timeout(4500),
      });

      if (!res.ok) {
        throw new Error(`Candle fetch failed: ${res.statusText}`);
      }

      const raw = await res.json();
      if (!Array.isArray(raw)) throw new Error('Invalid candle data array');

      const candles: Candle[] = raw.map((item: any) => ({
        time: Math.floor(Number(item[0]) / 1000),
        open: parseFloat(item[1]),
        high: parseFloat(item[2]),
        low: parseFloat(item[3]),
        close: parseFloat(item[4]),
        volume: parseFloat(item[5]),
      }));

      this.candleCache.set(key, { timestamp: now, candles });
      return { candles, isDelayed: false, dataSource: 'BINANCE_LIVE' };
    } catch (err) {
      console.warn(`Candles fetch for ${symbol} failed:`, (err as Error).message);
      if (cached) {
        return { candles: cached.candles, isDelayed: true, dataSource: 'CACHED' };
      }

      const ticker = await this.getTicker(symbol);
      const basePrice = ticker?.lastPrice || 100;
      const syntheticCandles = this.generateHistoricalBaseCandles(basePrice, limit, interval);
      this.candleCache.set(key, { timestamp: now, candles: syntheticCandles });
      return { candles: syntheticCandles, isDelayed: true, dataSource: 'CACHED' };
    }
  }

  private generateHistoricalBaseCandles(currentPrice: number, count: number, interval: string): Candle[] {
    const candles: Candle[] = [];
    const intervalSecs =
      interval === '1m' ? 60 : interval === '5m' ? 300 : interval === '15m' ? 900 : interval === '4h' ? 14400 : interval === '1d' ? 86400 : 3600;
    const nowSecs = Math.floor(Date.now() / 1000);
    const startTime = nowSecs - count * intervalSecs;

    let price = currentPrice * 0.96;
    for (let i = 0; i < count; i++) {
      const t = startTime + i * intervalSecs;
      const change = (Math.sin(i / 5) + (Math.random() - 0.48)) * (currentPrice * 0.008);
      const open = price;
      const close = Math.max(0.000001, price + change);
      const high = Math.max(open, close) + Math.random() * (currentPrice * 0.004);
      const low = Math.min(open, close) - Math.random() * (currentPrice * 0.004);
      const volume = Math.floor(100 + Math.random() * 5000);

      candles.push({
        time: t,
        open: Number(open.toFixed(4)),
        high: Number(high.toFixed(4)),
        low: Number(low.toFixed(4)),
        close: Number(close.toFixed(4)),
        volume,
      });

      price = close;
    }
    if (candles.length > 0) {
      candles[candles.length - 1].close = currentPrice;
      candles[candles.length - 1].high = Math.max(candles[candles.length - 1].high, currentPrice);
      candles[candles.length - 1].low = Math.min(candles[candles.length - 1].low, currentPrice);
    }
    return candles;
  }
}

export const marketDataService = new MarketDataService();
