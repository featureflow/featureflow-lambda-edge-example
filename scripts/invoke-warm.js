#!/usr/bin/env node
/**
 * Run the handler in a single process and invoke it at a fixed rate.
 * Simulates "warm" Lambda: one Node process, handler called repeatedly (no new process per call).
 *
 * Usage: node scripts/invoke-warm.js [event-path]
 * Env:   INVOKE_INTERVAL_MS=1000  (default 1000 = 1 second)
 *
 * Run once: npm run build:dist && npm run invoke:warm
 */
const path = require('path');
const fs = require('fs');

const eventPath = process.argv[2] || path.join(__dirname, '..', 'events', 'cloudfront-request.json');
const intervalMs = parseInt(process.env.INVOKE_INTERVAL_MS || '1000', 10);

const distHandler = path.join(__dirname, '..', 'dist', 'handler.js');
if (!fs.existsSync(distHandler)) {
  console.error('Run "npm run build:dist" first to compile TypeScript to dist/');
  process.exit(1);
}

const event = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
const { handler } = require(distHandler);

const context = {
  getRemainingTimeInMillis: () => 30000,
  functionName: 'redirect',
  awsRequestId: 'warm-test',
};

async function run() {
  console.log(`Warm invoke every ${intervalMs}ms (one process, handler stays hot). Ctrl+C to stop.\n`);
  let i = 0;
  for (;;) {
    const start = Date.now();
    try {
      const result = await handler(event, context, () => {});
      const elapsed = Date.now() - start;
      const loc = result?.headers?.location?.[0]?.value ?? result?.status;
      console.log(`[${i}] ${elapsed}ms → ${loc}`);
    } catch (err) {
      console.error(`[${i}] error:`, err.message);
    }
    i++;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

run();
