# getPrices.py

from datetime import date
from typing import Literal
import pandas as pd
import yfinance as yf
from pydantic import BaseModel


class PriceQuery(BaseModel):
    ticker: str
    start: date
    end: date
    interval: Literal["1m", "5m", "15m", "30m", "1h", "1d", "1wk", "1mo"] = "1d"


def get_prices(
    ticker: str,
    start: date,
    end: date,
    interval: Literal["1m", "5m", "15m", "30m", "1h", "1d", "1wk", "1mo"] = "1d",
) -> pd.DataFrame:
    """
    Fetch historical price data for a ticker using yfinance.
    Designed for single-pass scripts inside the sandbox: call it once per experiment, then explain results in chat.

    When you describe the outputs to the user, follow the active persona from the system prompt:
    - In "Stock Noob" mode, keep explanations short, concrete, and free of jargon.
    - In "Quant Pro" / "Quant Pro Heavy" modes, feel free to reference returns, volatility, drawdowns, and other metrics.

    Args:
        ticker: Stock symbol (e.g., "NVDA", "AAPL", "TSLA")
        start: Start date
        end: End date
        interval: Data interval (1m, 5m, 15m, 30m, 1h, 1d, 1wk, 1mo)

    Returns:
        DataFrame with timestamp index and OHLCV columns (Open, High, Low, Close, Volume)
    """
    query = PriceQuery(ticker=ticker, start=start, end=end, interval=interval)

    df: pd.DataFrame = yf.download(
        query.ticker,
        start=query.start.isoformat(),
        end=query.end.isoformat(),
        interval=query.interval,
        progress=False,
        auto_adjust=True,
    )

    if df.empty:
        return df

    # Handle MultiIndex columns from yfinance
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)

    return df
