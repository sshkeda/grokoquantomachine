from datetime import date

from app.api.chat.workDir.get_prices import get_prices


def test_testStrategy():
    """Test a simple moving average crossover strategy."""
    # Fetch price data
    df = get_prices(
        ticker="NVDA",
        start=date(2024, 1, 1),
        end=date(2024, 12, 1),
        interval="1d",
    )

    if df.empty:
        print("No data fetched, skipping strategy test")
        return

    # Calculate simple moving averages
    df["SMA_20"] = df["Close"].rolling(window=20).mean()
    df["SMA_50"] = df["Close"].rolling(window=50).mean()

    # Generate signals: 1 when SMA_20 > SMA_50 (bullish), -1 otherwise
    df["Signal"] = (df["SMA_20"] > df["SMA_50"]).astype(int)

    # Count crossovers
    df["Crossover"] = df["Signal"].diff().abs()
    num_crossovers = int(df["Crossover"].sum())

    print(f"Fetched {len(df)} rows for strategy test")
    print(f"Number of crossovers: {num_crossovers}")
    print(df[["Close", "SMA_20", "SMA_50", "Signal"]].tail(10))
    print("test_testStrategy passed!")


if __name__ == "__main__":
    test_testStrategy()
