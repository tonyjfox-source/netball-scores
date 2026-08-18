import { fetchHtml, fetchFixtures } from './fetcher.js';
import { extractWidgetSettings } from '../parser/html-parser.js';
import { mapSportyFixture, validateFixture } from './extractor.js';
import { upsertEntity } from '../db/repository.js';
import { Entity } from '../types/entity.js';

/**
 * Executes the scraping pipeline for a given URL:
 * 1. Fetches the HTML content.
 * 2. Extracts widget configuration settings.
 * 3. Queries the Sporty CMS API for live fixtures.
 * 4. Maps, validates, and persists each fixture.
 */
export async function processUrl(url: string): Promise<Entity[]> {
  console.log(`[Pipeline] Processing URL: ${url}`);
  
  // 1. Fetch HTML
  const html = await fetchHtml(url);
  
  // 2. Extract Widget Settings
  console.log(`[Pipeline] Extracting widget settings from HTML...`);
  const settings = extractWidgetSettings(html);
  
  // 3. Fetch actual live fixtures from Sporty CMS API
  console.log(`[Pipeline] Fetching live fixtures from Sporty API for Competition ID: ${settings.compId}...`);
  const apiData = await fetchFixtures(settings);
  
  if (!apiData || !Array.isArray(apiData.Fixtures)) {
    throw new Error('Invalid response structure from Sporty CMS API (Fixtures array missing)');
  }

  console.log(`[Pipeline] Found ${apiData.Fixtures.length} fixtures. Processing and saving to DB...`);

  // 4. Map, validate, and upsert each fixture
  const entities: Entity[] = [];
  for (const rawFixture of apiData.Fixtures) {
    const mapped = mapSportyFixture(rawFixture);
    const validated = validateFixture(mapped);
    await upsertEntity(validated);
    entities.push(validated);
  }

  console.log(`[Pipeline] Successfully processed and stored ${entities.length} real fixtures.`);
  return entities;
}
