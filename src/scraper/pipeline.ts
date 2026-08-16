import { fetchHtml } from './fetcher.js';
import { extractRawData } from './extractor.js';
import { upsertEntity } from '../db/repository.js';
import { Entity } from '../types/entity.js';

/**
 * Executes the scraping pipeline for a given URL:
 * 1. Fetches the HTML content.
 * 2. Parses and validates the HTML into an Entity.
 * 3. Persists/upserts the Entity to the database.
 */
export async function processUrl(url: string): Promise<Entity> {
  const html = await fetchHtml(url);
  const entity = extractRawData(html, url);
  await upsertEntity(entity);
  return entity;
}
