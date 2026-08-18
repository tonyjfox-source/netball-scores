import { z } from 'zod';

export const FixtureSchema = z.object({
  id: z.number(),
  compId: z.number(),
  gradeId: z.number(),
  gradeName: z.string(),
  roundName: z.string().optional().nullable(),
  dateFrom: z.string().datetime(), // ISO datetime string
  dateTo: z.string().datetime().optional().nullable(),
  homeTeamId: z.number().optional().nullable(), // Nullable for BYEs or TBD matchups
  homeTeamName: z.string(),
  awayTeamId: z.number().optional().nullable(), // Nullable for BYEs or TBD matchups
  awayTeamName: z.string(),
  venueName: z.string().optional().nullable(),
  homeScore: z.string().nullable().transform(val => {
    if (val === null || val === '') return null;
    const num = parseInt(val, 10);
    return isNaN(num) ? null : num;
  }),
  awayScore: z.string().nullable().transform(val => {
    if (val === null || val === '') return null;
    const num = parseInt(val, 10);
    return isNaN(num) ? null : num;
  }),
  statusName: z.string().optional().nullable()
});

export const EntitySchema = FixtureSchema; // Keeping compatibility with previous references
