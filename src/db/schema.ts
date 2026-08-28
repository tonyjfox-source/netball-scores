import { sqliteTable, integer, text, index } from 'drizzle-orm/sqlite-core';

export const fixtures = sqliteTable('fixtures', {
  id: integer('id').primaryKey(), // Sporty internal match ID
  compId: integer('comp_id').notNull(),
  gradeId: integer('grade_id').notNull(),
  gradeName: text('grade_name').notNull(),
  roundName: text('round_name'),
  dateFrom: text('date_from').notNull(),
  dateTo: text('date_to'),
  homeTeamId: integer('home_team_id'), // Nullable for BYEs or TBD matchups
  homeTeamName: text('home_team_name').notNull(),
  awayTeamId: integer('away_team_id'), // Nullable for BYEs or TBD matchups
  awayTeamName: text('away_team_name').notNull(),
  venueName: text('venue_name'),
  homeScore: integer('home_score'),
  awayScore: integer('away_score'),
  statusName: text('status_name'),
  lastUpdated: integer('last_updated', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
}, (table) => [
  index('home_team_idx').on(table.homeTeamName),
  index('away_team_idx').on(table.awayTeamName),
  index('date_idx').on(table.dateFrom)
]);
