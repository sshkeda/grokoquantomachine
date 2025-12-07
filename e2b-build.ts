import { defaultBuildLogger, Template } from "e2b";
import { env } from "@/lib/env";

const template = Template()
  .fromTemplate("code-interpreter-v1")
  .runCmd("pip install backtrader python-dotenv httpx pydantic yfinance")
  .copy("app/api/chat/workDir", "/home/user");

const build = await Template.build(template, {
  alias: env.E2B_TEMPLATE_ALIAS,
  cpuCount: 1,
  memoryMB: 1024,
  onBuildLogs: defaultBuildLogger(),
});

console.log(build);
