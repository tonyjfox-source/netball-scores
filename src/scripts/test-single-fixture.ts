import { config } from '../scraper/config.js';

async function testPayload(payload: any, label: string) {
  console.log(`Testing payload for: ${label}`);
  try {
    const response = await fetch(config.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      console.log(`  Failed: ${response.status} ${response.statusText}`);
      return;
    }
    
    const data = (await response.json()) as any;
    if (data && data.Fixtures) {
      console.log(`  Success! Found ${data.Fixtures.length} fixtures in response.`);
      if (data.Fixtures.length > 0 && data.Fixtures.length <= 5) {
        console.log('  Fixtures IDs returned:', data.Fixtures.map((f: any) => f.Id));
      }
    } else {
      console.log('  Response had unexpected structure:', Object.keys(data));
    }
  } catch (error: any) {
    console.log(`  Error: ${error.message}`);
  }
}

async function main() {
  const targetFixtureId = 6575332;
  const compId = 13392;
  const fromDate = '2026-05-01T00:00:00';
  const toDate = '2026-05-02T23:59:59';

  // Control payload (should return the fixtures in that date range)
  await testPayload({
    CompIds: [compId],
    From: fromDate,
    To: toDate
  }, 'Control (Date Range only)');

  // Test 1: Passing FixtureIds as an array
  await testPayload({
    CompIds: [compId],
    From: fromDate,
    To: toDate,
    FixtureIds: [targetFixtureId]
  }, 'FixtureIds (array)');

  // Test 2: Passing FixtureId as a single value
  await testPayload({
    CompIds: [compId],
    From: fromDate,
    To: toDate,
    FixtureId: targetFixtureId
  }, 'FixtureId (single)');

  // Test 3: Passing Id
  await testPayload({
    CompIds: [compId],
    From: fromDate,
    To: toDate,
    Id: targetFixtureId
  }, 'Id');
}

main();
