# PMT Trading — Quick Start

## Prerequisites
Python 3.8+ must be installed.

## Step 1 — Install dependencies (run once)
```bash
pip install yfinance flask flask-cors requests_cache requests_ratelimiter
```

## Step 2 — Start the data server
```bash
python pmt-server.py
```
You should see:
```
==================================================
  PMT Trading — Data Server
  Running on http://localhost:5000
  Press Ctrl+C to stop
==================================================
```

## Step 3 — Open the app
Open `pmt-trading.html` in your browser.
The startup modal will confirm the server is connected (green dot).
No API key required — all chart data comes from Yahoo Finance.

> **Optional:** Enter a Finnhub API key (free at finnhub.io) in the
> startup modal to get a richer categorised news feed. Without it,
> news still works via Yahoo Finance.

## Files
| File | Purpose |
|---|---|
| `pmt-server.py` | Local Flask server — must be running |
| `pmt-trading.html` | Main terminal — charts, news, Bloomberg live |
| `pmt-backtest.html` | Backtest engine + analytics |

## Supported symbols
Any symbol supported by Yahoo Finance:
- **Stocks:** AAPL, TSLA, MSFT, NVDA…
- **Crypto:** BTC-USD, ETH-USD, SOL-USD…
- **Forex:** EURUSD=X, GBPUSD=X, USDJPY=X…
- **ETFs:** SPY, QQQ, IWM…
- **Indices:** ^SPX, ^IXIC, ^DJI…

## Troubleshooting
- **Red dot / server not found:** Make sure `pmt-server.py` is running first
- **No data for symbol:** Check the symbol format (crypto needs `-USD` suffix)
- **Intraday data limited:** Yahoo Finance limits intraday history (1m = 7 days, 15m/60m = 60 days)