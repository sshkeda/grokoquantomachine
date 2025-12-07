# testStrategy.py

import backtrader as bt
import pandas as pd
from pydantic import BaseModel


class StrategyResult(BaseModel):
    starting_value: float
    final_value: float
    return_pct: float
    buy_hold_final_value: float
    buy_hold_return_pct: float


def run_strategy(
    strategy_class: type[bt.Strategy],
    prices: pd.DataFrame,
    initial_cash: float = 100000.0,
    commission: float = 0.001,
    **strategy_params,
) -> StrategyResult:
    """
    Run a Backtrader strategy and compare against buy-and-hold.
    The agent only needs to define a strategy class; this handles all the boilerplate.

    Args:
        strategy_class: A bt.Strategy subclass with your trading logic
        prices: DataFrame from get_prices() with OHLCV columns
        initial_cash: Starting portfolio value (default: 100000.0)
        commission: Commission rate as decimal (default: 0.001 = 0.1%)
        **strategy_params: Additional parameters to pass to the strategy

    Returns:
        StrategyResult with portfolio values and returns for both strategies

    Example:
        from datetime import date
        from getPrices import get_prices

        prices = get_prices("NVDA", date(2024, 1, 1), date(2024, 12, 1))

        class TweetBuyStrategy(bt.Strategy):
            params = (('buy_dates', []),)

            def __init__(self):
                self.buy_dates = self.params.buy_dates

            def next(self):
                dt_str = self.datas[0].datetime.date(0).strftime('%Y-%m-%d')
                if dt_str in self.buy_dates and not self.position:
                    self.buy(size=100)

        result = run_strategy(
            TweetBuyStrategy,
            prices,
            buy_dates=["2024-01-15", "2024-03-20"]
        )
    """
    # Normalize column names to lowercase for Backtrader
    df_data = prices.copy()
    df_data.columns = [c.lower() for c in df_data.columns]

    # Setup main strategy cerebro
    cerebro = bt.Cerebro()
    data = bt.feeds.PandasData(dataname=df_data)  # type: ignore[call-arg]
    cerebro.adddata(data)
    cerebro.addstrategy(strategy_class, **strategy_params)
    cerebro.broker.setcash(initial_cash)
    cerebro.broker.setcommission(commission=commission)

    print(f"Starting Portfolio Value: ${cerebro.broker.getvalue():.2f}")
    cerebro.run()
    final_value = cerebro.broker.getvalue()
    print(f"Final Portfolio Value: ${final_value:.2f}")

    return_pct = ((final_value - initial_cash) / initial_cash) * 100
    print(f"Strategy Return: {return_pct:.2f}%")

    # Buy and hold comparison
    class BuyAndHoldStrategy(bt.Strategy):
        def __init__(self):
            self.bought = False

        def next(self):
            if not self.bought:
                size = int(self.broker.getcash() / self.datas[0].close[0])
                if size > 0:
                    self.buy(size=size)
                    self.bought = True

    cerebro_bh = bt.Cerebro()
    data_bh = bt.feeds.PandasData(dataname=df_data)  # type: ignore[call-arg]
    cerebro_bh.adddata(data_bh)
    cerebro_bh.broker.setcash(initial_cash)
    cerebro_bh.broker.setcommission(commission=commission)
    cerebro_bh.addstrategy(BuyAndHoldStrategy)
    cerebro_bh.run()
    bh_final_value = cerebro_bh.broker.getvalue()
    bh_return_pct = ((bh_final_value - initial_cash) / initial_cash) * 100

    print(f"\nBuy & Hold Final Value: ${bh_final_value:.2f}")
    print(f"Buy & Hold Return: {bh_return_pct:.2f}%")
    print(f"\nStrategy vs Buy & Hold: {return_pct - bh_return_pct:+.2f}%")

    return StrategyResult(
        starting_value=initial_cash,
        final_value=final_value,
        return_pct=return_pct,
        buy_hold_final_value=bh_final_value,
        buy_hold_return_pct=bh_return_pct,
    )
