import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema.js';

const sqlite = new Database('sqlite.db');

// Migrate schema: ensure updated_at column exists in database
try {
  sqlite.exec('ALTER TABLE fixtures ADD COLUMN updated_at INTEGER;');
} catch {
  // Column already exists, ignore error
}

export const db = drizzle(sqlite, { schema });
