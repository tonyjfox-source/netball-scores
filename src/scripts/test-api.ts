import { extractWidgetSettings } from '../parser/html-parser.js';
import { fetchHtml, fetchFixtures } from '../scraper/fetcher.js';
import fs from 'fs';
import path from 'path';

async function main() {
  const url = 'https://www.netballnorthharbour.co.nz/draws-results/college-competition/college-saturday-1';
  console.log(`Fetching HTML from: ${url}`);
  
  try {
    const html = await fetchHtml(url);
    const settings = extractWidgetSettings(html);
    console.log('Extracted settings:', settings);
    
    console.log('Fetching fixtures from Sporty API...');
    const data = await fetchFixtures(settings);
    
    const outputPath = path.resolve('src/scripts/sample-api.json');
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Successfully saved Sporty API response to ${outputPath}`);
  } catch (error) {
    console.error('Error fetching Sporty API:', error);
    process.exit(1);
  }
}

main();
