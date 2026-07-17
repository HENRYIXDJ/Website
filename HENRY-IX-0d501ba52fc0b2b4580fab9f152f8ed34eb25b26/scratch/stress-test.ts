import { URL } from 'url';

const BASE_URL = 'http://localhost:3001';

async function testEndpoint(name: string, url: string, options: RequestInit) {
  const start = performance.now();
  try {
    const res = await fetch(url, options);
    const body = await res.text();
    const duration = performance.now() - start;
    return {
      success: res.ok,
      status: res.status,
      duration,
      error: null
    };
  } catch (err: any) {
    const duration = performance.now() - start;
    return {
      success: false,
      status: 0,
      duration,
      error: err.message
    };
  }
}

async function runBenchmark(name: string, generator: (index: number) => { url: string; options: RequestInit }, concurrency: number, totalRequests: number) {
  console.log(`\n--- Starting Benchmark: ${name} (Concurrency: ${concurrency}, Total: ${totalRequests}) ---`);
  
  const results: any[] = [];
  const activePromises: Promise<any>[] = [];
  let started = 0;
  const startTime = performance.now();

  async function worker() {
    while (started < totalRequests) {
      const idx = started++;
      const { url, options } = generator(idx);
      const res = await testEndpoint(name, url, options);
      results.push(res);
    }
  }

  // Spawn concurrent workers
  const workers: Promise<void>[] = [];
  for (let i = 0; i < concurrency; i++) {
    workers.push(worker());
  }
  await Promise.all(workers);

  const totalTime = performance.now() - startTime;
  const successCount = results.filter(r => r.success).length;
  const failureCount = totalRequests - successCount;
  const durations = results.map(r => r.duration);
  const avgDuration = durations.reduce((a, b) => a + b, 0) / totalRequests;
  const minDuration = Math.min(...durations);
  const maxDuration = Math.max(...durations);
  const throughput = (totalRequests / (totalTime / 1000)).toFixed(2);

  console.log(`Finished ${name} in ${(totalTime / 1000).toFixed(2)}s`);
  console.log(`Success Rate: ${successCount}/${totalRequests} (${((successCount / totalRequests) * 100).toFixed(1)}%)`);
  console.log(`Throughput: ${throughput} reqs/sec`);
  console.log(`Latency: Min: ${minDuration.toFixed(1)}ms, Max: ${maxDuration.toFixed(1)}ms, Avg: ${avgDuration.toFixed(1)}ms`);

  // Count response status codes
  const statuses: Record<number, number> = {};
  results.forEach(r => {
    statuses[r.status] = (statuses[r.status] || 0) + 1;
  });
  console.log('Status Codes:', statuses);

  const errors = results.filter(r => r.error).map(r => r.error);
  if (errors.length > 0) {
    console.log('Sample errors:', Array.from(new Set(errors)).slice(0, 3));
  }
}

async function main() {
  // Wait 1 second to make sure server is responsive
  console.log('Preparing to stress test...');

  // Test 1: Assets fallback proxy endpoint (GET)
  await runBenchmark(
    'GET /api/assets (Fallback Direct)',
    (idx) => ({
      url: `${BASE_URL}/api/assets?url=${encodeURIComponent(`${BASE_URL}/robots.txt`)}`,
      options: { method: 'GET' }
    }),
    20, // concurrency
    100 // total requests
  );

  // Test 2: Signup API endpoint (POST)
  await runBenchmark(
    'POST /api/signup',
    (idx) => ({
      url: `${BASE_URL}/api/signup`,
      options: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: `stress-test-${idx}@example.com` })
      }
    }),
    10, // concurrency (lower due to 5s sleep block)
    30  // total requests
  );
}

main().catch(console.error);
