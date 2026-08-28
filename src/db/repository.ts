import { db } from './client.js';
import { fixtures } from './schema.js';
import { Entity } from '../types/entity.js';
import { eq, like, or, and, desc, isNull, isNotNull } from 'drizzle-orm';

export interface MatchFilters {
  id?: string;
  team?: string;
  status?: string;
  limit?: number;
}

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
 * Retrieves fixture entities stored in the database, with support for filtering and limit.
 */
export async function getEntities(filters: MatchFilters = {}) {
  const conditions = [];

  if (filters.id) {
    const idNum = parseInt(filters.id, 10);
    if (!isNaN(idNum)) {
      conditions.push(eq(fixtures.id, idNum));
    } else {
      // If a non-numeric ID is passed, force a condition that will return no results
      conditions.push(eq(fixtures.id, -1));
    }
  }

  if (filters.status) {
    if (filters.status === 'FINAL') {
      conditions.push(
        and(
          eq(fixtures.statusName, 'Confirmed'),
          isNotNull(fixtures.homeScore)
        )
      );
    } else if (filters.status === 'LIVE') {
      conditions.push(eq(fixtures.statusName, 'Live'));
    } else if (filters.status === 'UPCOMING') {
      conditions.push(
        or(
          eq(fixtures.statusName, 'Scheduled'),
          and(
            eq(fixtures.statusName, 'Confirmed'),
            isNull(fixtures.homeScore)
          )
        )
      );
    } else {
      conditions.push(eq(fixtures.statusName, filters.status));
    }
  }

  if (filters.team) {
    const searchPattern = `%${filters.team}%`;
    conditions.push(
      or(
        like(fixtures.homeTeamName, searchPattern),
        like(fixtures.awayTeamName, searchPattern)
      )
    );
  }

  let query = db.select().from(fixtures);

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  // Order by dateFrom (representing match_time) descending
  let orderedQuery = query.orderBy(desc(fixtures.dateFrom));

  if (filters.limit !== undefined && filters.limit > 0) {
    orderedQuery = orderedQuery.limit(filters.limit) as any;
  }

  return orderedQuery;
}

/**
 * Retrieves a list of all unique team names stored in the database.
 */
export async function getTeams(): Promise<string[]> {
  const homeTeams = await db.select({ name: fixtures.homeTeamName }).from(fixtures);
  const awayTeams = await db.select({ name: fixtures.awayTeamName }).from(fixtures);

  const teamNames = new Set<string>();
  
  for (const row of homeTeams) {
    if (row.name) {
      const name = row.name.trim();
      if (name && name.toUpperCase() !== 'BYE') {
        teamNames.add(name);
      }
    }
  }

  for (const row of awayTeams) {
    if (row.name) {
      const name = row.name.trim();
      if (name && name.toUpperCase() !== 'BYE') {
        teamNames.add(name);
      }
    }
  }

  return Array.from(teamNames).sort();
}
