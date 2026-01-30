import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import * as schema from '../src/lib/server/db/schema';

const DB_PATH = resolve('data/chapel-planner.db');

const sqlite = new Database(DB_PATH);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

const db = drizzle(sqlite, { schema });

console.log('Seeding hymn data...');

// Clear existing hymns
db.delete(schema.hymns).run();
console.log('  Cleared existing hymn data.');

const hymnsRaw = JSON.parse(
	readFileSync(resolve('scripts/data/hymns-neh.json'), 'utf-8')
);

console.log(`  Loading ${hymnsRaw.length} hymns...`);

let inserted = 0;
for (const hymn of hymnsRaw) {
	db.insert(schema.hymns)
		.values({
			title: hymn.title,
			hymnalName: hymn.hymnalName ?? null,
			hymnNumber: hymn.hymnNumber ?? null,
			author: hymn.author ?? null,
			tune: hymn.tune ?? null,
			metre: hymn.metre ?? null
		})
		.run();
	inserted++;
}

console.log(`  Inserted ${inserted} hymns.`);
console.log('\nHymn seed complete.');
sqlite.close();
