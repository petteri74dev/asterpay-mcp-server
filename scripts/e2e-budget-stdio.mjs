// E2E: drive the built MCP server over stdio exactly like Claude Code does.
// Verifies set_budget (no args) returns live funding instructions from prod,
// and get_budget_status errors helpfully with no active budget.
import { spawn } from "node:child_process";

const child = spawn(process.execPath, ["dist/index.js"], {
  stdio: ["pipe", "pipe", "inherit"],
  env: { ...process.env, ASTERPAY_HOME: process.env.TEMP + "\\asterpay-e2e-" + Date.now() },
});

let buf = "";
const pending = new Map();
let nextId = 1;

child.stdout.on("data", (d) => {
  buf += d.toString();
  let nl;
  while ((nl = buf.indexOf("\n")) !== -1) {
    const line = buf.slice(0, nl).trim();
    buf = buf.slice(nl + 1);
    if (!line) continue;
    try {
      const msg = JSON.parse(line);
      if (msg.id && pending.has(msg.id)) {
        pending.get(msg.id)(msg);
        pending.delete(msg.id);
      }
    } catch { /* ignore non-JSON */ }
  }
});

function rpc(method, params) {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, resolve);
    child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
    setTimeout(() => reject(new Error(`timeout: ${method}`)), 15000);
  });
}

try {
  const init = await rpc("initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "e2e", version: "0" },
  });
  console.log("initialize:", init.result?.serverInfo?.name, init.result?.serverInfo?.version);
  child.stdin.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");

  const tools = await rpc("tools/list", {});
  const names = tools.result.tools.map((t) => t.name);
  console.log("tools:", names.join(", "));
  if (!names.includes("set_budget") || !names.includes("get_budget_status")) throw new Error("budget tools missing");

  const prompts = await rpc("prompts/list", {});
  console.log("prompts:", prompts.result.prompts.map((p) => p.name).join(", "));

  const fund = await rpc("tools/call", { name: "set_budget", arguments: {} });
  const fundText = fund.result.content[0].text;
  console.log("set_budget (no args) →", fundText.slice(0, 160).replace(/\n/g, " "));
  if (!fundText.includes("USDC") || !fundText.includes("0x")) throw new Error("funding instructions missing payTo");

  const status = await rpc("tools/call", { name: "get_budget_status", arguments: { token: "bud_e2e_fake" } });
  const statusText = status.result.content[0].text;
  console.log("get_budget_status (fake) →", statusText.slice(0, 120).replace(/\n/g, " "));
  if (!statusText.includes("404")) throw new Error("expected 404 from prod for fake token");

  console.log("E2E PASS");
  process.exit(0);
} catch (e) {
  console.error("E2E FAIL:", e.message);
  process.exit(1);
} finally {
  child.kill();
}
