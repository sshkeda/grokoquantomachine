import { z } from "zod";

export const MODEL_OPTIONS = [
  { id: "stock-noob", label: "Stock Noob" },
  { id: "quant-pro", label: "Quant Pro" },
  { id: "quant-pro-heavy", label: "Quant Pro Heavy" },
] as const;

const MODEL_IDS = MODEL_OPTIONS.map((model) => model.id);
export const modelIdSchema = z.enum(MODEL_IDS);
export type ModelId = z.infer<typeof modelIdSchema>;

export const DEFAULT_MODEL = "stock-noob" satisfies ModelId;
