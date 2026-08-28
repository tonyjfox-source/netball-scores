import { EntitySchema } from '../parser/schema.js';
import { Entity } from '../types/entity.js';

/**
 * Maps a raw Sporty API fixture object to the internal schema format.
 */
export function mapSportyFixture(f: any): any {
  return {
    id: f.Id,
    compId: f.CompId,
    gradeId: f.GradeId,
    gradeName: f.GradeName || 'Netball Competition',
    roundName: f.RoundName || null,
    // Convert date string from API (e.g. 2026-05-02T08:00:00) into a valid ISO datetime string
    dateFrom: new Date(f.From).toISOString(),
    dateTo: f.To ? new Date(f.To).toISOString() : null,
    homeTeamId: f.HomeTeamId,
    homeTeamName: f.HomeTeamName,
    awayTeamId: f.AwayTeamId,
    awayTeamName: f.AwayTeamName,
    venueName: f.VenueName || null,
    // Scores are passed as strings or null and transformed to numbers in EntitySchema
    homeScore: f.HomeScore !== undefined && f.HomeScore !== null && f.HomeScore !== '' ? String(f.HomeScore) : null,
    awayScore: f.AwayScore !== undefined && f.AwayScore !== null && f.AwayScore !== '' ? String(f.AwayScore) : null,
    statusName: f.StatusName || null
  };
}

/**
 * Validates the mapped raw object against the EntitySchema (Zod).
 */
export function validateFixture(mapped: any): Entity {
  return EntitySchema.parse(mapped);
}
