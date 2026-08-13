import { z } from 'zod';
import { FixtureSchema } from '../parser/schema.js';

export type Fixture = z.infer<typeof FixtureSchema>;
export type Entity = Fixture;
