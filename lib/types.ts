import type { InferUITools, UIMessage, UIMessagePart } from "ai";
import type { BaseTools } from "@/app/api/chat/agent";

export type BaseUIMetadata = never;

export type ChartCandlestick = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
};

export type ChartTradeMarker = {
  time: string;
  price: number;
  type: "buy" | "sell";
  size: number;
};

export type StrategyResult = {
  starting_value: number;
  final_value: number;
  return_pct: number;
  buy_hold_final_value: number;
  buy_hold_return_pct: number;
  sharpe_ratio: number | null; // null if insufficient data
  max_drawdown_pct: number | null; // null if insufficient data
  win_rate_pct: number | null; // null if no trades
  profit_factor: number | null; // null if no trades or no losses
};

export type StrategyChartData = {
  candlestick: ChartCandlestick[];
  trades: ChartTradeMarker[];
  result: StrategyResult;
  label?: string | null;
};

export type BaseUIDataTypes = {
  sandbox: { sandboxId: string };
  strategyChart: StrategyChartData;
};
export type BaseUITools = InferUITools<BaseTools>;

export type BaseUIMessage = UIMessage<
  BaseUIMetadata,
  BaseUIDataTypes,
  BaseUITools
>;
export type BaseUIMessagePart = UIMessagePart<BaseUIDataTypes, BaseUITools>;
