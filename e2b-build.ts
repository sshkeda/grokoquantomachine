import { defaultBuildLogger, Template } from "e2b";
import { env } from "@/lib/env";

const template = Template()
  .fromPythonImage()
  // install uv // https://docs.astral.sh/uv/getting-started/installation/
  .runCmd("curl -LsSf https://astral.sh/uv/install.sh | sh")
  .runCmd("uv init --python 3.12")
  .runCmd("uv add backtrader");

const build = await Template.build(template, {
  alias: env.E2B_TEMPLATE_ALIAS,
  cpuCount: 1,
  memoryMB: 1024,
  onBuildLogs: defaultBuildLogger(),
});

console.log(build);
