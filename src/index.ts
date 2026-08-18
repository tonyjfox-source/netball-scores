import { processUrl } from './scraper/pipeline.js';
import { getEntities } from './db/repository.js';

const TARGET_URL = 'https://www.netballnorthharbour.co.nz/draws-results/college-competition/college-saturday-1';

async function main() {
  console.log('=========================================');
  console.log('Netball Score Tracker Scraper Entry Point');
  console.log('=========================================');
  console.log(`Starting scrape pipeline for: ${TARGET_URL}`);
  
  try {
    const start = Date.now();
    const fixtures = await processUrl(TARGET_URL);
    const duration = ((Date.now() - start) / 1000).toFixed(2);
    
    console.log(`\nPipeline execution completed successfully in ${duration}s.`);
    console.log(`Processed ${fixtures.length} fixtures.`);

    console.log('\nQuerying persisted records from SQLite database...');
    const storedRecords = await getEntities();
    console.log(`Total records now stored in DB: ${storedRecords.length}`);
    
    if (storedRecords.length > 0) {
      console.log('\nSample stored record:');
      console.log(JSON.stringify(storedRecords[0], null, 2));
    }
  } catch (error: any) {
    console.error('\nAn error occurred during pipeline execution:', error);
    process.exit(1);
  }
}

main();
