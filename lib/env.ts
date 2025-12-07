import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    XAI_API_KEY: z.string().min(1),
    E2B_API_KEY: z.string().min(1),
    E2B_TEMPLATE_ALIAS: z.string().min(1),
    APP_BASE_URL: z.url(),
  },
  clientPrefix: "NEXT_PUBLIC_",
  client: {},
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
