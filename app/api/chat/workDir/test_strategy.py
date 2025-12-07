# test_strategy.py

import json
from pathlib import Path

import backtrader as bt
import pandas as pd
from pydantic import BaseModel

CHART_DATA_PATH = Path("/tmp/strategy_chart_data.json")


class Trade(BaseModel):
    time: str
    price: float
    type: str  # "buy" or "sell"
    size: int


class StrategyResult(BaseModel):
    starting_value: float
    final_value: float
    return_pct: float
    buy_hold_final_value: float
    buy_hold_return_pct: float


# Global list to collect trades from the wrapped strategy
_recorded_trades: list[Trade] = []


def _create_trade_recording_strategy(
    base_class: type[bt.Strategy],
) -> type[bt.Strategy]:
    """Wrap a strategy class to record trades via notify_order."""

    class TradeRecordingStrategy(base_class):  # type: ignore[valid-type,misc]
        def notify_order(self, order: bt.Order):
            # Call parent's notify_order if it exists
            if hasattr(super(), "notify_order"):
                super().notify_order(order)

            if order.status != order.Completed:
                return

            trade_type = "buy" if order.isbuy() else "sell"
            # Use the order's execution datetime
            exec_dt = bt.num2date(order.executed.dt)
            trade = Trade(
                time=exec_dt.date().isoformat(),
                price=order.executed.price,
                type=trade_type,
                size=int(abs(order.executed.size)),
            )
            _recorded_trades.append(trade)

    return TradeRecordingStrategy


def _export_chart_data(
    prices: pd.DataFrame,
    trades: list[dict],
    result: StrategyResult,
    label: str | None = None,
) -> None:
    """Export OHLCV data and trades to JSON for chart rendering.

    Appends to existing chart data array to support multiple runs in a single execution.
    """
    df = prices.copy()
    df.columns = [c.lower() for c in df.columns]

    # Convert index to ISO date strings
    dates = [pd.Timestamp(d).strftime("%Y-%m-%d") for d in df.index]

    candlestick_data = [
        {
            "time": dates[i],
            "open": float(df["open"].iloc[i]),
            "high": float(df["high"].iloc[i]),
            "low": float(df["low"].iloc[i]),
            "close": float(df["close"].iloc[i]),
        }
        for i in range(len(df))
    ]

    chart_data = {
        "candlestick": candlestick_data,
        "trades": trades,
        "result": result.model_dump(),
        "label": label,
    }

    # Read existing chart data array or start fresh
    existing_charts: list[dict] = []
    if CHART_DATA_PATH.exists():
        try:
            existing_charts = json.loads(CHART_DATA_PATH.read_text())
        except (json.JSONDecodeError, TypeError):
            existing_charts = []

    existing_charts.append(chart_data)
    CHART_DATA_PATH.write_text(json.dumps(existing_charts))


def run_strategy(
    strategy_class: type[bt.Strategy],
    prices: pd.DataFrame,
    initial_cash: float = 100000.0,
    commission: float = 0.001,
    label: str | None = None,
    **strategy_params,
) -> StrategyResult:
    """
    Run a Backtrader strategy and compare against buy-and-hold.
    The agent only needs to define a strategy class; this handles all the boilerplate and chart data export.

    Explanation style in chat should follow the active persona from the system prompt:
    - In "Stock Noob" mode, keep it fun, upbeat, and very simple: talk mainly about how many dollars you made or lost, roughly how \"spicy\" the risk felt, and a single easy next step.
    - In "Quant Pro" / "Quant Pro Heavy" modes, report additional metrics (e.g., Sharpe-like ratios, drawdowns, or other diagnostics) when useful.

    Args:
        strategy_class: A bt.Strategy subclass with your trading logic
        prices: DataFrame from get_prices() with OHLCV columns
        initial_cash: Starting portfolio value (default: 100000.0)
        commission: Commission rate as decimal (default: 0.001 = 0.1%)
        label: Optional label to identify this run in the chart (e.g., strategy name)
        **strategy_params: Additional parameters to pass to the strategy

    Returns:
        StrategyResult with portfolio values and returns for both strategies

    Example:
        from datetime import date
        from get_prices import get_prices

        prices = get_prices("NVDA", date(2024, 1, 1), date(2024, 12, 1))

        class TweetBuyStrategy(bt.Strategy):
            params = (("buy_dates", []),)

            def __init__(self):
                self.buy_dates = self.params.buy_dates

            def next(self):
                dt_str = self.datas[0].datetime.date(0).strftime("%Y-%m-%d")
                if dt_str in self.buy_dates and not self.position:
                    self.buy(size=100)

        result = run_strategy(
            TweetBuyStrategy,
            prices,
            buy_dates=["2024-01-15", "2024-03-20"],
        )
    """
    # Normalize column names to lowercase for Backtrader
    df_data = prices.copy()
    df_data.columns = [c.lower() for c in df_data.columns]

    if "close" not in df_data.columns:
        raise ValueError("Price data missing 'close' column; cannot run strategy.")

    # Ensure chronological order and drop rows without close prices
    df_data = df_data.sort_index()
    df_data = df_data[df_data["close"].notna()]

    if df_data.empty:
        raise ValueError("Price data is empty after cleaning; cannot run strategy.")

    # Clear global trades list and wrap strategy to record trades
    _recorded_trades.clear()
    wrapped_strategy = _create_trade_recording_strategy(strategy_class)

    # Setup main strategy cerebro
    cerebro = bt.Cerebro()
    data = bt.feeds.PandasData(dataname=df_data)  # type: ignore[call-arg]
    cerebro.adddata(data)
    cerebro.addstrategy(wrapped_strategy, **strategy_params)
    cerebro.broker.setcash(initial_cash)
    cerebro.broker.setcommission(commission=commission)

    print(f"Starting Portfolio Value: ${cerebro.broker.getvalue():.2f}")
    cerebro.run()
    final_value = cerebro.broker.getvalue()
    print(f"Final Portfolio Value: ${final_value:.2f}")

    return_pct = ((final_value - initial_cash) / initial_cash) * 100
    print(f"Strategy Return: {return_pct:.2f}%")

    # Buy and hold comparison - calculate directly from price data
    # This avoids potential issues with running a second backtrader simulation
    first_close = float(df_data["close"].iloc[0])
    last_close = float(df_data["close"].iloc[-1])

    if first_close <= 0:
        raise ValueError("First close price must be positive to compute buy & hold.")
    bh_final_value = initial_cash * (last_close / first_close)
    bh_return_pct = ((bh_final_value - initial_cash) / initial_cash) * 100

    print(f"\nBuy & Hold Final Value: ${bh_final_value:.2f}")
    print(f"Buy & Hold Return: {bh_return_pct:.2f}%")
    print(f"\nStrategy vs Buy & Hold: {return_pct - bh_return_pct:+.2f}%")

    result = StrategyResult(
        starting_value=initial_cash,
        final_value=final_value,
        return_pct=return_pct,
        buy_hold_final_value=bh_final_value,
        buy_hold_return_pct=bh_return_pct,
    )

    # Export chart data for UI rendering
    trades = [t.model_dump() for t in _recorded_trades]
    print(f"Recorded {len(trades)} trades for chart")
    _export_chart_data(prices, trades, result, label)

    return result
