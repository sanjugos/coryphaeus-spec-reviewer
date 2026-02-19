/**
 * Reads test-results/results.json and outputs a compact src/test-summary.json
 * for the Test Suite tab in the Coryphaeus app.
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

const inputPath = resolve(rootDir, 'test-results/results.json');
const outputPath = resolve(rootDir, 'src/test-summary.json');

const raw = JSON.parse(readFileSync(inputPath, 'utf-8'));

const summary = {
  date: raw.stats.startTime,
  duration: +(raw.stats.duration / 1000).toFixed(1),
  total: raw.stats.expected + raw.stats.unexpected + raw.stats.skipped,
  passed: raw.stats.expected,
  failed: raw.stats.unexpected,
  skipped: raw.stats.skipped,
  suites: [],
};

for (const fileSuite of raw.suites) {
  for (const suite of (fileSuite.suites || [])) {
    const s = { name: suite.title, passed: 0, failed: 0, tests: [] };
    for (const spec of (suite.specs || [])) {
      const test = spec.tests?.[0];
      const result = test?.results?.[0];
      const status = result?.status || (spec.ok ? 'passed' : 'failed');
      const duration = result ? +(result.duration / 1000).toFixed(1) : 0;
      s.tests.push({ title: spec.title, status, duration });
      if (status === 'passed') s.passed++;
      else s.failed++;
    }
    summary.suites.push(s);
  }
}

writeFileSync(outputPath, JSON.stringify(summary, null, 2) + '\n');
console.log(`Generated ${outputPath}`);
console.log(`  ${summary.total} tests, ${summary.passed} passed, ${summary.failed} failed, ${summary.skipped} skipped`);
console.log(`  ${summary.suites.length} suites, ${(JSON.stringify(summary).length / 1024).toFixed(1)}KB`);
