import { db } from './client.js';
import { fixtures } from './schema.js';
import { Entity } from '../types/entity.js';

/**
 * Upserts a fixture entity into the database.
 * Uses SQLite's ON CONFLICT(id) DO UPDATE.
 */
export async function upsertEntity(data: Entity) {
  const now = new Date();
  
  return db.insert(fixtures)
    .values({
      id: data.id,
      compId: data.compId,
      gradeId: data.gradeId,
      gradeName: data.gradeName,
      roundName: data.roundName ?? null,
      dateFrom: data.dateFrom,
      dateTo: data.dateTo ?? null,
      homeTeamId: data.homeTeamId,
      homeTeamName: data.homeTeamName,
      awayTeamId: data.awayTeamId,
      awayTeamName: data.awayTeamName,
      venueName: data.venueName ?? null,
      homeScore: data.homeScore ?? null,
      awayScore: data.awayScore ?? null,
      statusName: data.statusName ?? null,
      lastUpdated: now
    })
    .onConflictDoUpdate({
      target: fixtures.id,
      set: {
        compId: data.compId,
        gradeId: data.gradeId,
        gradeName: data.gradeName,
        roundName: data.roundName ?? null,
        dateFrom: data.dateFrom,
        dateTo: data.dateTo ?? null,
        homeTeamId: data.homeTeamId,
        homeTeamName: data.homeTeamName,
        awayTeamId: data.awayTeamId,
        awayTeamName: data.awayTeamName,
        venueName: data.venueName ?? null,
        homeScore: data.homeScore ?? null,
        awayScore: data.awayScore ?? null,
        statusName: data.statusName ?? null,
        lastUpdated: now
      }
    });
}

/**
 * Retrieves all fixture entities stored in the database.
 */
export async function getEntities() {
  return db.select().from(fixtures);
}
