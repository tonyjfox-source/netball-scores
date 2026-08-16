import { processUrl } from '../scraper/pipeline.js';
import { getEntities } from '../db/repository.js';

async function testPhase3() {
  const url = 'https://www.netballnorthharbour.co.nz/draws-results/college-competition/college-saturday-1';
  console.log("=========================================");
  console.log("Netball Scores Tracker Phase 3 Pipeline Test");
  console.log("=========================================");
  console.log(`Fetching and processing URL: ${url}`);
  
  try {
    const result = await processUrl(url);
    console.log("\nPipeline processed successfully.");
    console.log("Resulting Entity:", result);

    console.log("\nQuerying all persisted entities in DB...");
    const entities = await getEntities();
    console.log("Database entries count:", entities.length);
    console.log("Entries:", entities);
  } catch (error) {
    console.error("\nPipeline test failed:", error);
  }
}

testPhase3();
