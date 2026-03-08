"""
utils/feature_engineering.py
-----------------------------
Data fetching and feature engineering utilities for stock price prediction.
"""

import numpy as np
import pandas as pd
import yfinance as yf


FEATURE_COLS = ["Close", "Volume", "SMA_5", "SMA_10", "SMA_20", "RSI", "Returns"]


# ---------------------------------------------------------------------------
# 1. Data Fetching
# ---------------------------------------------------------------------------

def fetch_stock_data(symbol: str) -> pd.DataFrame:
    """
    Download 2 years of daily OHLCV data for *symbol* via yfinance.

    Parameters
    ----------
    symbol : str  Ticker symbol (e.g. 'AAPL').

    Returns
    -------
    pd.DataFrame  Columns: Open, High, Low, Close, Volume.

    Raises
    ------
    ValueError  If the symbol is invalid or no data is returned.
    """
    df = yf.Ticker(symbol).history(period="2y")

    if df.empty:
        raise ValueError(f"No data found for symbol '{symbol}'. Check the ticker is valid.")

    df = df[["Open", "High", "Low", "Close", "Volume"]].copy()
    df.index = pd.to_datetime(df.index).tz_localize(None)
    df.sort_index(inplace=True)
    return df


# ---------------------------------------------------------------------------
# 2. Technical Indicators
# ---------------------------------------------------------------------------

def add_technical_indicators(df: pd.DataFrame) -> pd.DataFrame:
    """
    Append technical indicator columns to *df*.

    Indicators
    ----------
    SMA_5, SMA_10, SMA_20  : Simple moving averages of Close
    RSI                    : 14-period Relative Strength Index
    Returns                : Daily percentage return of Close

    NaN rows (from rolling warm-up) are dropped before returning.
    """
    df = df.copy()

    # Moving averages
    df["SMA_5"]  = df["Close"].rolling(window=5).mean()
    df["SMA_10"] = df["Close"].rolling(window=10).mean()
    df["SMA_20"] = df["Close"].rolling(window=20).mean()

    # Daily returns
    df["Returns"] = df["Close"].pct_change()

    # RSI (14-period)
    delta     = df["Close"].diff()
    gain      = delta.clip(lower=0)
    loss      = -delta.clip(upper=0)
    avg_gain  = gain.rolling(window=14).mean()
    avg_loss  = loss.rolling(window=14).mean()
    rs        = avg_gain / avg_loss.replace(0, np.nan)
    df["RSI"] = 100 - (100 / (1 + rs))

    df.dropna(inplace=True)
    return df


# ---------------------------------------------------------------------------
# 3. Dataset Preparation
# ---------------------------------------------------------------------------

def prepare_dataset(df: pd.DataFrame, sentiment_score: float = 0.0):

    df = df.copy()

    # Add sentiment feature
    df["Sentiment"] = sentiment_score

    # Create target column
    df["Target"] = df["Close"].shift(-1)

    # Drop rows with missing values
    df.dropna(inplace=True)

    # Explicitly define features
    feature_cols = [
        "Close",
        "Volume",
        "SMA_5",
        "SMA_10",
        "SMA_20",
        "RSI",
        "Returns",
        "Sentiment",
    ]

    X = df[feature_cols]
    y = df["Target"]

    return X, y