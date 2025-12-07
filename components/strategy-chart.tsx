"use client";

import {
  type CandlestickData,
  CandlestickSeries,
  createChart,
  createSeriesMarkers,
  type IChartApi,
  type ISeriesApi,
  type SeriesMarker,
} from "lightweight-charts";
import { useEffect, useRef } from "react";
import type { StrategyChartData } from "@/lib/types";

type Props = {
  data: StrategyChartData;
};

function getSharpeColor(sharpe: number | null | undefined): string {
  if (sharpe === null || sharpe === undefined) {
    return "text-neutral-500";
  }
  if (sharpe >= 1) {
    return "text-green-500";
  }
  if (sharpe >= 0) {
    return "text-yellow-500";
  }
  return "text-red-500";
}

function getDrawdownColor(drawdown: number | null | undefined): string {
  if (drawdown === null || drawdown === undefined) {
    return "text-neutral-500";
  }
  if (drawdown <= 10) {
    return "text-green-500";
  }
  if (drawdown <= 20) {
    return "text-yellow-500";
  }
  return "text-red-500";
}

function getWinRateColor(winRate: number | null | undefined): string {
  if (winRate === null || winRate === undefined) {
    return "text-neutral-500";
  }
  return winRate >= 50 ? "text-green-500" : "text-red-500";
}

function getProfitFactorColor(pf: number | null | undefined): string {
  if (pf === null || pf === undefined) {
    return "text-neutral-500";
  }
  if (pf >= 2) {
    return "text-green-500";
  }
  if (pf >= 1) {
    return "text-yellow-500";
  }
  return "text-red-500";
}

export function StrategyChart({ data }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    // Create chart
    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: "#0a0a0a" },
        textColor: "#d1d5db",
      },
      grid: {
        vertLines: { color: "#1f2937" },
        horzLines: { color: "#1f2937" },
      },
      width: containerRef.current.clientWidth,
      height: 400,
      crosshair: {
        vertLine: { color: "#6b7280", labelBackgroundColor: "#374151" },
        horzLine: { color: "#6b7280", labelBackgroundColor: "#374151" },
      },
      timeScale: {
        borderColor: "#374151",
        timeVisible: true,
      },
      rightPriceScale: {
        borderColor: "#374151",
      },
    });
    chartRef.current = chart;

    // Add candlestick series
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });
    seriesRef.current = candlestickSeries;

    // Set candlestick data - lightweight-charts accepts 'YYYY-MM-DD' strings for time
    const candlestickData: CandlestickData[] = data.candlestick.map((d) => ({
      time: d.time,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));
    candlestickSeries.setData(candlestickData);

    // Add trade markers using v5 API
    if (data.trades.length > 0) {
      const markers: SeriesMarker<string>[] = data.trades.map((trade) => ({
        time: trade.time,
        position: trade.type === "buy" ? "belowBar" : "aboveBar",
        color: trade.type === "buy" ? "#22c55e" : "#ef4444",
        shape: trade.type === "buy" ? "arrowUp" : "arrowDown",
        text: `${trade.type.toUpperCase()} ${trade.size}`,
      }));
      createSeriesMarkers(candlestickSeries, markers);
    }

    // Fit content
    chart.timeScale().fitContent();

    // Handle resize
    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
        });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [data]);

  const { result } = data;
  const isPositive = result.return_pct >= 0;
  const beatsBuyHold = result.return_pct > result.buy_hold_return_pct;

  return (
    <div className="my-4 overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950">
      <div className="border-neutral-800 border-b p-3">
        <h3 className="font-medium text-neutral-200 text-sm">
          {data.label
            ? `${data.label} — Backtest Results`
            : "Strategy Backtest Results"}
        </h3>
      </div>
      <div className="w-full" ref={containerRef} />
      <div className="grid grid-cols-2 gap-4 border-neutral-800 border-t p-4 text-sm md:grid-cols-4">
        <div>
          <div className="text-neutral-500">Starting Value</div>
          <div className="font-medium text-neutral-200">
            ${result.starting_value.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-neutral-500">Final Value</div>
          <div className="font-medium text-neutral-200">
            $
            {result.final_value.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}
          </div>
        </div>
        <div>
          <div className="text-neutral-500">Strategy Return</div>
          <div
            className={`font-medium ${isPositive ? "text-green-500" : "text-red-500"}`}
          >
            {isPositive ? "+" : ""}
            {result.return_pct.toFixed(2)}%
          </div>
        </div>
        <div>
          <div className="text-neutral-500">vs Buy & Hold</div>
          <div
            className={`font-medium ${beatsBuyHold ? "text-green-500" : "text-red-500"}`}
          >
            {beatsBuyHold ? "+" : ""}
            {(result.return_pct - result.buy_hold_return_pct).toFixed(2)}%
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 border-neutral-800 border-t p-4 text-sm md:grid-cols-4">
        <div>
          <div className="text-neutral-500">Sharpe Ratio</div>
          <div className={`font-medium ${getSharpeColor(result.sharpe_ratio)}`}>
            {result.sharpe_ratio !== null && result.sharpe_ratio !== undefined
              ? result.sharpe_ratio.toFixed(2)
              : "N/A"}
          </div>
        </div>
        <div>
          <div className="text-neutral-500">Max Drawdown</div>
          <div
            className={`font-medium ${getDrawdownColor(result.max_drawdown_pct)}`}
          >
            {result.max_drawdown_pct !== null &&
            result.max_drawdown_pct !== undefined
              ? `-${result.max_drawdown_pct.toFixed(2)}%`
              : "N/A"}
          </div>
        </div>
        <div>
          <div className="text-neutral-500">Win Rate</div>
          <div
            className={`font-medium ${getWinRateColor(result.win_rate_pct)}`}
          >
            {result.win_rate_pct != null
              ? `${result.win_rate_pct.toFixed(1)}%`
              : "N/A"}
          </div>
        </div>
        <div>
          <div className="text-neutral-500">Profit Factor</div>
          <div
            className={`font-medium ${getProfitFactorColor(result.profit_factor)}`}
          >
            {result.profit_factor != null
              ? result.profit_factor.toFixed(2)
              : "N/A"}
          </div>
        </div>
      </div>
      {data.trades.length > 0 && (
        <div className="border-neutral-800 border-t px-4 py-2 text-neutral-500 text-xs">
          {data.trades.length} trade{data.trades.length !== 1 ? "s" : ""}{" "}
          executed
        </div>
      )}
    </div>
  );
}
