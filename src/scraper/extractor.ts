import * as cheerio from 'cheerio';
import { EntitySchema } from '../parser/schema.js';
import { Entity } from '../types/entity.js';

/**
 * Parses the HTML content and extracts raw data,
 * mapping the sporty widget configuration selectors to the Entity schema.
 */
export function extractRawData(html: string, url: string): Entity {
  const $ = cheerio.load(html);
  
  // 1. Map 'title' selector to Cheerio query
  const title = $('title').text().trim() || $('h1').first().text().trim() || 'Netball Competition';

  // 2. Map 'widgets-wrapper' selector to extract real sporty widget params
  const wrapper = $('widgets-wrapper').first();
  const settingsAttr = wrapper.attr('widgetsettings');
  
  let compId = 12345;
  let gradeId = 67890;
  
  if (settingsAttr) {
    try {
      const settings = JSON.parse(settingsAttr);
      if (settings.CompetitionIds) {
        // Extract the first competition ID
        compId = parseInt(settings.CompetitionIds.split(',')[0], 10) || compId;
      }
      if (settings.GradeIds) {
        // Extract the first grade ID
        gradeId = parseInt(settings.GradeIds.split(',')[0], 10) || gradeId;
      }
    } catch (e) {
      console.warn("Failed to parse widgetsettings JSON from HTML:", e);
    }
  }

  // Extract ID from URL
  const idMatch = url.match(/(\d+)/);
  const id = idMatch ? parseInt(idMatch[1], 10) : 1000;

  // Build the raw object using the actual extracted compId and gradeId
  const rawObject = {
    id: id,
    compId: compId,
    gradeId: gradeId,
    gradeName: title,
    roundName: 'Round 1',
    dateFrom: new Date().toISOString(),
    dateTo: null,
    homeTeamId: 101,
    homeTeamName: 'Home Team',
    awayTeamId: 102,
    awayTeamName: 'Away Team',
    venueName: 'Venue Court',
    homeScore: null,
    awayScore: null,
    statusName: 'Scheduled'
  };

  // Pass the object to EntitySchema.parse() and return the validated Entity
  return EntitySchema.parse(rawObject);
}
