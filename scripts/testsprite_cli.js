const { spawn } = require('child_process');
const readline = require('readline');
const path = require('path');
const fs = require('fs');

const PROJECT_PATH = path.resolve(__dirname, '..');
const PROJECT_NAME = path.basename(PROJECT_PATH);
const API_KEY = process.env.API_KEY || 'sk-member-BDcezecrZJ0W9u8np-55A2v-DfQ8daD2rZk3x5C5YzM';

class TestSpriteClient {
  constructor() {
    this.proc = null;
    this.msgId = 1;
    this.pending = new Map();
  }

  async start() {
    const mcpDist = path.join(
      process.env.LOCALAPPDATA || '',
      'npm-cache',
      '_npx',
      '8ddf6bea01b2519d',
      'node_modules',
      '@testsprite',
      'testsprite-mcp',
      'dist',
      'index.js'
    );
    const useDirect = fs.existsSync(mcpDist);
    const cmd = useDirect ? 'node' : 'cmd.exe';
    const args = useDirect ? [mcpDist] : ['/c', 'npx', '-y', '@testsprite/testsprite-mcp@latest'];

    this.proc = spawn(cmd, args, {
      env: {
        ...process.env,
        API_KEY
      },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    this.proc.stderr.on('data', (data) => {
      const txt = data.toString();
      if (!txt.includes('punycode') && !txt.includes('npm notice')) {
        process.stderr.write(`[TestSprite STDERR] ${txt}`);
      }
    });

    const rl = readline.createInterface({ input: this.proc.stdout });
    rl.on('line', (line) => {
      line = line.trim();
      if (!line) return;
      try {
        const msg = JSON.parse(line);
        if (msg.id && this.pending.has(msg.id)) {
          const { resolve, reject } = this.pending.get(msg.id);
          this.pending.delete(msg.id);
          if (msg.error) reject(new Error(msg.error.message || JSON.stringify(msg.error)));
          else resolve(msg.result);
        } else if (msg.method) {
          console.log(`[TestSprite Notification] ${msg.method}:`, msg.params ? JSON.stringify(msg.params) : '');
        }
      } catch (e) {
        console.log(`[TestSprite Log] ${line}`);
      }
    });

    await this.request('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'testsprite-orchestrator', version: '1.0.0' }
    });

    this.notify('notifications/initialized');
  }

  request(method, params = {}) {
    const id = this.msgId++;
    const req = { jsonrpc: '2.0', id, method, params };
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.proc.stdin.write(JSON.stringify(req) + '\n');
    });
  }

  notify(method, params = {}) {
    const req = { jsonrpc: '2.0', method, params };
    this.proc.stdin.write(JSON.stringify(req) + '\n');
  }

  async callTool(name, args = {}) {
    console.log(`\n========================================`);
    console.log(`>> Executing tool: ${name}`);
    console.log(`>> Arguments:`, JSON.stringify(args, null, 2));
    console.log(`========================================`);
    const res = await this.request('tools/call', { name, arguments: args });
    return res;
  }

  close() {
    if (this.proc) {
      this.proc.kill();
      this.proc = null;
    }
  }
}

async function run() {
  const action = process.argv[2] || 'full-run';
  const client = new TestSpriteClient();
  await client.start();

  try {
    if (action === 'check') {
      const res = await client.callTool('testsprite_check_account_info', {});
      console.log('Result:', JSON.stringify(res, null, 2));
    } else if (action === 'bootstrap') {
      const port = parseInt(process.argv[3] || '3000', 10);
      const type = process.argv[4] || 'frontend';
      const res = await client.callTool('testsprite_bootstrap', {
        type,
        projectPath: PROJECT_PATH,
        testScope: 'codebase',
        localPort: port
      });
      console.log('Bootstrap Result:', JSON.stringify(res, null, 2));
    } else if (action === 'summary') {
      const res = await client.callTool('testsprite_generate_code_summary', {
        projectRootPath: PROJECT_PATH
      });
      console.log('Summary Result:', JSON.stringify(res, null, 2));
    } else if (action === 'prd') {
      const res = await client.callTool('testsprite_generate_standardized_prd', {
        projectPath: PROJECT_PATH
      });
      console.log('PRD Result:', JSON.stringify(res, null, 2));
    } else if (action === 'plan') {
      const scope = process.argv[3] || 'frontend';
      if (scope === 'frontend') {
        const res = await client.callTool('testsprite_generate_frontend_test_plan', {
          projectPath: PROJECT_PATH,
          needLogin: true
        });
        console.log('Frontend Test Plan:', JSON.stringify(res, null, 2));
      } else {
        const res = await client.callTool('testsprite_generate_backend_test_plan', {
          projectPath: PROJECT_PATH
        });
        console.log('Backend Test Plan:', JSON.stringify(res, null, 2));
      }
    } else if (action === 'execute') {
      const mode = process.argv[3] || 'production';
      const res = await client.callTool('testsprite_generate_code_and_execute', {
        projectName: PROJECT_NAME,
        projectPath: PROJECT_PATH,
        serverMode: mode,
        additionalInstruction: ''
      });
      console.log('Execution Result:', JSON.stringify(res, null, 2));
    } else if (action === 'dashboard') {
      const res = await client.callTool('testsprite_open_test_result_dashboard', {
        projectPath: PROJECT_PATH,
        modificationContext: 'Review 18 test cases results across full platform'
      });
      console.log('Dashboard Result:', JSON.stringify(res, null, 2));
    } else if (action === 'step') {
      const toolName = process.argv[3];
      const toolArgs = process.argv[4] ? JSON.parse(process.argv[4]) : {};
      const res = await client.callTool(toolName, toolArgs);
      console.log('Tool Result:', JSON.stringify(res, null, 2));
    }
  } catch (err) {
    console.error('TestSprite Error:', err);
    process.exitCode = 1;
  } finally {
    client.close();
  }
}

run();
