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
      if (data.Fixtures.length > 0) {
        // print unique grades in the response
        const grades = [...new Set(data.Fixtures.map((f: any) => `${f.GradeName} (${f.GradeId})`))];
        console.log('  Grades present in response:', grades);
      }
    } else {
      console.log('  Response had unexpected structure:', Object.keys(data));
    }
  } catch (error: any) {
    console.log(`  Error: ${error.message}`);
  }
}

async function main() {
  const compId = 13392;
  const fromDate = '2026-05-01T00:00:00';
  const toDate = '2026-05-02T23:59:59';

  // 1. Control payload with all Grade IDs
  await testPayload({
    CompIds: [compId],
    From: fromDate,
    To: toDate,
    GradeIds: [565456, 565166, 565167]
  }, 'All Grade IDs');

  // 2. Querying only Grade ID 565456
  await testPayload({
    CompIds: [compId],
    From: fromDate,
    To: toDate,
    GradeIds: [565456]
  }, 'Grade 565456 only');

  // 3. Querying only Grade ID 565166
  await testPayload({
    CompIds: [compId],
    From: fromDate,
    To: toDate,
    GradeIds: [565166]
  }, 'Grade 565166 only');
}

main();
