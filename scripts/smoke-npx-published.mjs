// Smoke test: boot the PUBLISHED npm package via npx (budget-only mode, no env)
// and verify initialize + tools/list include the budget tools.
import { spawn } from 'node:child_process';

const target = process.argv[2] || 'npx -y @asterpay/mcp-server@2.1.0';
const p = spawn(target, { shell: true });
let buf = '';
let phase = 'init';

const timeout = setTimeout(() => { console.error('TIMEOUT'); p.kill(); process.exit(1); }, 90000);

p.stderr.on('data', (d) => process.stderr.write(d));
p.stdout.on('data', (d) => {
  buf += d.toString();
  const lines = buf.split('\n');
  for (const line of lines) {
    if (!line.trim().startsWith('{')) continue;
    let msg;
    try { msg = JSON.parse(line); } catch { continue; }
    if (phase === 'init' && msg.id === 1) {
      console.log('initialized:', msg.result.serverInfo.name, msg.result.serverInfo.version);
      phase = 'tools';
      buf = '';
      p.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list' }) + '\n');
      return;
    }
    if (phase === 'tools' && msg.id === 2) {
      const names = msg.result.tools.map((t) => t.name);
      console.log('tools:', names.length, '| budget:', names.filter((n) => n.includes('budget')).join(', '));
      clearTimeout(timeout);
      p.kill();
      process.exit(0);
    }
  }
});

p.stdin.write(JSON.stringify({
  jsonrpc: '2.0', id: 1, method: 'initialize',
  params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'smoke', version: '1.0' } },
}) + '\n');
