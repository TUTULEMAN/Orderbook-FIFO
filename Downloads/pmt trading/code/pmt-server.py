"""
PMT Trading — Local Data Server
================================
Serves yfinance data to the frontend via a local Flask API.

SETUP (run once):
    pip install yfinance flask flask-cors requests_cache requests_ratelimiter

RUN:
    python pmt-server.py

Then open pmt-trading.html and pmt-backtest.html in your browser.
Server runs on http://localhost:5000
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import yfinance as yf
import requests_cache
from requests_ratelimiter import LimiterSession
from datetime import datetime, timedelta
import pandas as pd
import traceback
import time
import threading

app = Flask(__name__)
CORS(app)

# ─────────────────────────────────────────────
#  RATE-LIMITED + CACHED SESSION
#  - Caches responses to disk for 15 minutes
#  - Limits to 2 requests/second to Yahoo
# ─────────────────────────────────────────────
cache_session = requests_cache.CachedSession(
    cache_name   = ".pmt_cache",
    backend      = "sqlite",
    expire_after = timedelta(minutes=15),
)
rate_session = LimiterSession(per_second=2, session=cache_session)

# Patch yfinance to use our session
def make_ticker(symbol):
    t = yf.Ticker(symbol)
    t.session = rate_session
    return t

# ─────────────────────────────────────────────
#  IN-MEMORY CANDLE CACHE
#  key: (symbol, interval, from_dt_str, to_dt_str)
# ─────────────────────────────────────────────
_candle_cache = {}
_candle_lock  = threading.Lock()
CANDLE_TTL    = 60 * 10  # 10 minutes for intraday, 60 min for daily+

INTERVAL_MAP = {
    "1":  "1m",
    "5":  "5m",
    "15": "15m",
    "30": "30m",
    "60": "1h",
    "D":  "1d",
    "W":  "1wk",
    "M":  "1mo",
}

INTRADAY_MAX_DAYS = {
    "1m":  7,
    "5m":  60,
    "15m": 60,
    "30m": 60,
    "1h":  729,
}

INTRADAY_RES = {"1m", "5m", "15m", "30m", "1h"}


# ─────────────────────────────────────────────
#  RETRY HELPER
# ─────────────────────────────────────────────
def fetch_with_retry(fn, retries=3, delay=2):
    """Call fn(), retry on YFRateLimitError with backoff."""
    for attempt in range(retries):
        try:
            return fn()
        except Exception as e:
            name = type(e).__name__
            if "RateLimit" in name or "TooMany" in str(e) or "429" in str(e):
                wait = delay * (attempt + 1)
                print(f"  [rate limit] waiting {wait}s then retrying… (attempt {attempt+1}/{retries})")
                time.sleep(wait)
            else:
                raise
    raise RuntimeError("Rate limited after all retries. Wait a minute and try again.")


# ─────────────────────────────────────────────
#  CANDLES  GET /api/candle
# ─────────────────────────────────────────────
@app.route("/api/candle")
def candle():
    symbol     = request.args.get("symbol", "AAPL").upper()
    resolution = request.args.get("resolution", "D")
    from_ts    = request.args.get("from", type=int)
    to_ts      = request.args.get("to",   type=int)

    interval = INTERVAL_MAP.get(resolution, "1d")

    try:
        from_dt = datetime.utcfromtimestamp(from_ts) if from_ts else datetime.utcnow() - timedelta(days=365)
        to_dt   = datetime.utcfromtimestamp(to_ts)   if to_ts   else datetime.utcnow()

        # Clamp intraday lookback to what Yahoo allows
        if interval in INTRADAY_MAX_DAYS:
            min_from = datetime.utcnow() - timedelta(days=INTRADAY_MAX_DAYS[interval])
            if from_dt < min_from:
                from_dt = min_from

        from_str = from_dt.strftime("%Y-%m-%d")
        to_str   = (to_dt + timedelta(days=1)).strftime("%Y-%m-%d")  # inclusive end

        # Check memory cache
        ttl = CANDLE_TTL if interval in INTRADAY_RES else CANDLE_TTL * 6
        cache_key = (symbol, interval, from_str, to_str)
        with _candle_lock:
            if cache_key in _candle_cache:
                ts_cached, payload = _candle_cache[cache_key]
                if time.time() - ts_cached < ttl:
                    print(f"  [cache hit] {symbol} {interval}")
                    return jsonify(payload)

        print(f"  [fetch] {symbol} {interval} {from_str} → {to_str}")

        def do_fetch():
            t = make_ticker(symbol)
            return t.history(
                start=from_str,
                end=to_str,
                interval=interval,
                auto_adjust=True,
                raise_errors=True,
            )

        df = fetch_with_retry(do_fetch)

        if df is None or df.empty:
            return jsonify({"s": "no_data", "t": [], "o": [], "h": [], "l": [], "c": [], "v": []})

        df = df.dropna(subset=["Close"])
        df = df[~df.index.duplicated(keep="last")]
        df = df.sort_index()

        # Normalise timezone → UTC unix
        idx = df.index
        if hasattr(idx, "tz") and idx.tz is not None:
            idx = idx.tz_convert("UTC").tz_localize(None)
        unix_times = [int(pd.Timestamp(t).timestamp()) for t in idx]

        payload = {
            "s": "ok",
            "t": unix_times,
            "o": [round(float(x), 6) for x in df["Open"]],
            "h": [round(float(x), 6) for x in df["High"]],
            "l": [round(float(x), 6) for x in df["Low"]],
            "c": [round(float(x), 6) for x in df["Close"]],
            "v": [int(x) for x in df["Volume"]],
        }

        with _candle_lock:
            _candle_cache[cache_key] = (time.time(), payload)

        return jsonify(payload)

    except Exception as e:
        traceback.print_exc()
        msg = str(e)
        if "RateLimit" in type(e).__name__ or "429" in msg:
            msg = "Yahoo Finance rate limited. Wait 30–60 seconds and try again."
        return jsonify({"s": "error", "errmsg": msg}), 500


# ─────────────────────────────────────────────
#  SEARCH  GET /api/search?q=apple
# ─────────────────────────────────────────────

# Static fallback list for common tickers (avoids a network call for search)
COMMON_TICKERS = [
    ("AAPL",    "Apple Inc",                   "NMS"),
    ("MSFT",    "Microsoft Corporation",        "NMS"),
    ("NVDA",    "NVIDIA Corporation",           "NMS"),
    ("TSLA",    "Tesla Inc",                    "NMS"),
    ("GOOGL",   "Alphabet Inc",                 "NMS"),
    ("META",    "Meta Platforms Inc",           "NMS"),
    ("AMZN",    "Amazon.com Inc",               "NMS"),
    ("SPY",     "SPDR S&P 500 ETF",             "PCX"),
    ("QQQ",     "Invesco QQQ Trust",            "NMS"),
    ("BTC-USD", "Bitcoin USD",                  "CCC"),
    ("ETH-USD", "Ethereum USD",                 "CCC"),
    ("SOL-USD", "Solana USD",                   "CCC"),
    ("EURUSD=X","EUR/USD",                      "CCY"),
    ("GBPUSD=X","GBP/USD",                      "CCY"),
    ("^SPX",    "S&P 500 Index",                "SNP"),
    ("^IXIC",   "NASDAQ Composite",             "NIM"),
    ("GLD",     "SPDR Gold Shares ETF",         "PCX"),
    ("JPM",     "JPMorgan Chase & Co",          "NYQ"),
    ("BAC",     "Bank of America Corp",         "NYQ"),
    ("AMD",     "Advanced Micro Devices Inc",   "NMS"),
]

_search_cache = {}
_search_lock  = threading.Lock()
SEARCH_TTL    = 60 * 30  # 30 minutes


@app.route("/api/search")
def search():
    q = request.args.get("q", "").strip().upper()
    if not q:
        return jsonify({"result": []})

    # Check memory cache
    with _search_lock:
        if q in _search_cache:
            ts, result = _search_cache[q]
            if time.time() - ts < SEARCH_TTL:
                return jsonify({"result": result})

    # First: fast local match from common tickers
    local = [
        {"symbol": sym, "description": name, "exchange": exch, "type": ""}
        for sym, name, exch in COMMON_TICKERS
        if q in sym or q.lower() in name.lower()
    ]

    # Then try live search (with fallback)
    live = []
    try:
        def do_search():
            return yf.Search(q, max_results=8, session=rate_session)

        res = fetch_with_retry(do_search, retries=2, delay=1)
        quotes = getattr(res, "quotes", []) or []
        for r in quotes:
            sym = r.get("symbol", "")
            if sym and not any(x["symbol"] == sym for x in local):
                live.append({
                    "symbol":      sym,
                    "description": r.get("longname") or r.get("shortname") or "",
                    "type":        r.get("quoteType", ""),
                    "exchange":    r.get("exchange", ""),
                })
    except Exception:
        pass  # Live search failed — local results still work

    result = (local + live)[:8]

    with _search_lock:
        _search_cache[q] = (time.time(), result)

    return jsonify({"result": result})


# ─────────────────────────────────────────────
#  QUOTE  GET /api/quote?symbol=AAPL
# ─────────────────────────────────────────────
@app.route("/api/quote")
def quote():
    symbol = request.args.get("symbol", "AAPL").upper()
    try:
        def do_quote():
            return make_ticker(symbol).fast_info

        info = fetch_with_retry(do_quote, retries=2, delay=1)
        return jsonify({
            "c":  round(float(info.last_price        or 0), 4),
            "pc": round(float(info.previous_close    or 0), 4),
            "h":  round(float(info.day_high          or 0), 4),
            "l":  round(float(info.day_low           or 0), 4),
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# ─────────────────────────────────────────────
#  NEWS  GET /api/news?category=general
# ─────────────────────────────────────────────
NEWS_PROXIES = {
    "general": ["SPY", "AAPL", "MSFT"],
    "crypto":  ["BTC-USD", "ETH-USD"],
    "forex":   ["EURUSD=X", "GBPUSD=X"],
    "merger":  ["SPY"],
}

_news_cache = {}
_news_lock  = threading.Lock()
NEWS_TTL    = 60 * 5  # 5 minutes


@app.route("/api/news")
def news():
    symbol   = request.args.get("symbol", "").upper()
    category = request.args.get("category", "general")
    cache_key = symbol or category

    with _news_lock:
        if cache_key in _news_cache:
            ts, items = _news_cache[cache_key]
            if time.time() - ts < NEWS_TTL:
                return jsonify(items)

    proxies = [symbol] if symbol else NEWS_PROXIES.get(category, ["SPY"])
    result  = []
    seen    = set()

    for proxy in proxies:
        try:
            def do_news(p=proxy):
                return make_ticker(p).news or []

            items = fetch_with_retry(do_news, retries=2, delay=1)
            for item in items:
                content = item.get("content", {}) or {}
                title   = content.get("title") or item.get("title", "")
                url     = (content.get("canonicalUrl") or {}).get("url") or item.get("link", "")
                source  = (content.get("provider") or {}).get("displayName") or "Yahoo Finance"
                pub_ts  = content.get("pubDate") or item.get("providerPublishTime", 0)

                if isinstance(pub_ts, str):
                    try:
                        from dateutil import parser as dp
                        pub_ts = int(dp.parse(pub_ts).timestamp())
                    except Exception:
                        pub_ts = 0
                else:
                    pub_ts = int(pub_ts or 0)

                uid = hash(url) & 0x7FFFFFFF
                if title and url and uid not in seen:
                    seen.add(uid)
                    result.append({
                        "id":       uid,
                        "headline": title,
                        "url":      url,
                        "source":   source,
                        "datetime": pub_ts,
                        "category": category,
                        "related":  proxy,
                    })
        except Exception:
            pass

    result.sort(key=lambda x: x["datetime"], reverse=True)

    with _news_lock:
        _news_cache[cache_key] = (time.time(), result)

    return jsonify(result)


# ─────────────────────────────────────────────
#  PING  GET /api/ping
# ─────────────────────────────────────────────
@app.route("/api/ping")
def ping():
    return jsonify({"status": "ok", "message": "PMT Trading server running"})


if __name__ == "__main__":
    print("\n" + "="*52)
    print("  PMT Trading — Data Server")
    print("  Running on http://localhost:5000")
    print("  Caching enabled — rate limits handled")
    print("  Press Ctrl+C to stop")
    print("="*52 + "\n")
    app.run(host="0.0.0.0", port=5000, debug=False, threaded=True)