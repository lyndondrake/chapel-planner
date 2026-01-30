import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { resolve } from 'path';
import { mkdirSync, readFileSync } from 'fs';
import * as schema from '../src/lib/server/db/schema';

const DB_PATH = resolve('data/chapel-planner.db');

mkdirSync(resolve('data'), { recursive: true });

const sqlite = new Database(DB_PATH);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

const db = drizzle(sqlite, { schema });

console.log('Seeding lectionary data...');

// --- 1. Load and insert occasions ---

const occasionsRaw = JSON.parse(
	readFileSync(resolve('scripts/data/lectionary-occasions.json'), 'utf-8')
);

console.log(`  Loading ${occasionsRaw.length} occasions...`);

const slugToId: Record<string, number> = {};

for (const occ of occasionsRaw) {
	const result = db
		.insert(schema.lectionaryOccasions)
		.values({
			name: occ.name,
			slug: occ.slug,
			season: occ.season,
			colour: occ.colour,
			isFixed: occ.isFixed ?? false,
			fixedMonth: occ.fixedMonth ?? null,
			fixedDay: occ.fixedDay ?? null,
			weekOfSeason: occ.weekOfSeason ?? null,
			dayOfWeek: occ.dayOfWeek ?? 0,
			priority: occ.priority ?? 50,
			collectCw: occ.collectCw ?? null,
			collectBcp: occ.collectBcp ?? null,
			postCommunionCw: occ.postCommunionCw ?? null
		})
		.returning()
		.get();

	slugToId[occ.slug] = result.id;
}

console.log(`  Inserted ${Object.keys(slugToId).length} occasions.`);

// --- 2. Load and insert readings ---

const readingsRaw = JSON.parse(
	readFileSync(resolve('scripts/data/lectionary-readings.json'), 'utf-8')
);

console.log(`  Loading ${readingsRaw.length} readings...`);

let readingsInserted = 0;
let readingsSkipped = 0;

for (const reading of readingsRaw) {
	const occasionId = slugToId[reading.occasionSlug];
	if (!occasionId) {
		readingsSkipped++;
		continue;
	}

	db.insert(schema.lectionaryReadings)
		.values({
			occasionId,
			tradition: reading.tradition,
			serviceContext: reading.serviceContext ?? 'principal',
			readingType: reading.readingType,
			book: reading.book ?? null,
			chapter: reading.chapter ?? null,
			verseStart: reading.verseStart ?? null,
			verseEnd: reading.verseEnd ?? null,
			reference: reading.reference,
			alternateYear: reading.alternateYear ?? null,
			isOptional: reading.isOptional ?? false,
			sortOrder: reading.sortOrder ?? 0
		})
		.run();

	readingsInserted++;
}

console.log(`  Inserted ${readingsInserted} readings (${readingsSkipped} skipped due to missing occasion).`);

// --- 3. Generate date map ---

console.log('  Generating date map for 2024–2030...');

// Easter computus (Meeus/Jones/Butcher)
function computeEaster(year: number): Date {
	const a = year % 19;
	const b = Math.floor(year / 100);
	const c = year % 100;
	const d = Math.floor(b / 4);
	const e = b % 4;
	const f = Math.floor((b + 8) / 25);
	const g = Math.floor((b - f + 1) / 3);
	const h = (19 * a + b - d - g + 15) % 30;
	const i = Math.floor(c / 4);
	const k = c % 4;
	const l = (32 + 2 * e + 2 * i - h - k) % 7;
	const m = Math.floor((a + 11 * h + 22 * l) / 451);
	const month = Math.floor((h + l - 7 * m + 114) / 31);
	const day = ((h + l - 7 * m + 114) % 31) + 1;
	return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number): Date {
	const result = new Date(date);
	result.setDate(result.getDate() + days);
	return result;
}

function toISO(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

function getAdventSunday(year: number): Date {
	const christmas = new Date(year, 11, 25);
	const dayOfWeek = christmas.getDay();
	const daysBack = dayOfWeek === 0 ? 28 : dayOfWeek + 21;
	return addDays(christmas, -daysBack);
}

function getLiturgicalYear(date: Date): 'A' | 'B' | 'C' {
	let year = date.getFullYear();
	const adventSunday = getAdventSunday(year);
	if (date < adventSunday) {
		year = year - 1;
	}
	const mod = (year + 1) % 3;
	if (mod === 1) return 'A';
	if (mod === 2) return 'B';
	return 'C';
}

function getSundaysBetween(start: Date, end: Date): Date[] {
	const sundays: Date[] = [];
	let current = new Date(start);
	// Advance to the next Sunday if start isn't one
	while (current.getDay() !== 0) {
		current = addDays(current, 1);
	}
	while (current <= end) {
		sundays.push(new Date(current));
		current = addDays(current, 7);
	}
	return sundays;
}

let dateMapInserted = 0;

function insertDateMap(date: string, slug: string, isPrincipal: boolean = true) {
	const occasionId = slugToId[slug];
	if (!occasionId) return;

	const litYear = getLiturgicalYear(new Date(date + 'T12:00:00'));

	db.insert(schema.lectionaryDateMap)
		.values({
			date,
			occasionId,
			liturgicalYear: litYear,
			isPrincipal: isPrincipal
		})
		.run();

	dateMapInserted++;
}

for (let year = 2024; year <= 2030; year++) {
	const easter = computeEaster(year);
	const adventSunday = getAdventSunday(year);

	// --- Advent Sundays ---
	for (let w = 0; w < 4; w++) {
		insertDateMap(toISO(addDays(adventSunday, w * 7)), `advent-${w + 1}`);
	}

	// --- Christmas Day ---
	insertDateMap(`${year}-12-25`, 'christmas-day');

	// --- Christmas Sundays ---
	// First Sunday of Christmas: the Sunday between Dec 26 and Jan 1
	const christmasSundays = getSundaysBetween(
		new Date(year, 11, 26),
		new Date(year + 1, 0, 1)
	);
	if (christmasSundays.length > 0) {
		insertDateMap(toISO(christmasSundays[0]), 'christmas-1');
	}

	// Second Sunday of Christmas: the Sunday between Jan 2 and Jan 5
	const christmas2Sundays = getSundaysBetween(
		new Date(year + 1, 0, 2),
		new Date(year + 1, 0, 5)
	);
	if (christmas2Sundays.length > 0) {
		insertDateMap(toISO(christmas2Sundays[0]), 'christmas-2');
	}

	// --- Epiphany (Jan 6) ---
	insertDateMap(`${year}-01-06`, 'epiphany');

	// --- Epiphany Sundays ---
	// Baptism of Christ / First Sunday of Epiphany: first Sunday after Jan 6
	const epiphanySundayStart = new Date(year, 0, 7);
	const epiphanySundays = getSundaysBetween(
		epiphanySundayStart,
		new Date(year, 1, 1) // up to Feb 1
	);
	const epiphanyWeekSlugs = ['epiphany-1', 'epiphany-2', 'epiphany-3', 'epiphany-4'];
	for (let i = 0; i < Math.min(epiphanySundays.length, 4); i++) {
		insertDateMap(toISO(epiphanySundays[i]), epiphanyWeekSlugs[i]);
	}

	// --- Candlemas (Feb 2) ---
	insertDateMap(`${year}-02-02`, 'candlemas');

	// --- Sundays before Lent ---
	const ashWednesday = addDays(easter, -46);
	// Sunday next before Lent = Sunday before Ash Wednesday
	const sundayBeforeLent = addDays(ashWednesday, -(ashWednesday.getDay() === 0 ? 7 : ashWednesday.getDay()));
	insertDateMap(toISO(sundayBeforeLent), 'sunday-before-lent');

	// Second Sunday before Lent
	const secondSundayBeforeLent = addDays(sundayBeforeLent, -7);
	insertDateMap(toISO(secondSundayBeforeLent), 'second-sunday-before-lent');

	// --- Ash Wednesday ---
	insertDateMap(toISO(ashWednesday), 'ash-wednesday');

	// --- Lent Sundays ---
	// Ash Wednesday is always a Wednesday (day 3), so the next Sunday is +4 days
	const lentSunday1 = addDays(ashWednesday, 4);
	for (let w = 0; w < 5; w++) {
		insertDateMap(toISO(addDays(lentSunday1, w * 7)), `lent-${w + 1}`);
	}

	// --- Holy Week ---
	insertDateMap(toISO(addDays(easter, -7)), 'palm-sunday');
	insertDateMap(toISO(addDays(easter, -6)), 'holy-monday');
	insertDateMap(toISO(addDays(easter, -5)), 'holy-tuesday');
	insertDateMap(toISO(addDays(easter, -4)), 'holy-wednesday');
	insertDateMap(toISO(addDays(easter, -3)), 'maundy-thursday');
	insertDateMap(toISO(addDays(easter, -2)), 'good-friday');
	insertDateMap(toISO(addDays(easter, -1)), 'easter-eve');

	// --- Easter ---
	insertDateMap(toISO(easter), 'easter-day');
	for (let w = 2; w <= 7; w++) {
		insertDateMap(toISO(addDays(easter, (w - 1) * 7)), `easter-${w}`);
	}

	// --- Ascension Day (Easter + 39) ---
	insertDateMap(toISO(addDays(easter, 39)), 'ascension-day');

	// --- Pentecost (Easter + 49) ---
	insertDateMap(toISO(addDays(easter, 49)), 'pentecost');

	// --- Trinity Sunday (Easter + 56) ---
	insertDateMap(toISO(addDays(easter, 56)), 'trinity-sunday');

	// --- Ordinary Time Propers (after Trinity) ---
	// Proper 4 starts the Sunday after Trinity Sunday
	const trinitySunday = addDays(easter, 56);
	let properSunday = addDays(trinitySunday, 7);

	// Calculate which proper to start with based on the calendar
	// Propers are numbered by the week - Proper 4 is the first Sunday after Trinity in some years
	// We need to match propers to their approximate calendar weeks
	// Proper N covers the week containing the dates closest to N weeks after a reference point
	// Simpler approach: assign sequentially from Proper 4
	let properNum = 4;
	while (properSunday < adventSunday && properNum <= 25) {
		// Check if this is in the Kingdom season (last 4 Sundays before Advent)
		const weeksBeforeAdvent = Math.round(
			(adventSunday.getTime() - properSunday.getTime()) / (7 * 24 * 60 * 60 * 1000)
		);

		if (weeksBeforeAdvent <= 3) {
			// Kingdom season: last 4 Sundays before Advent
			// 3 = Fourth Sunday before Advent, 2 = Third, 1 = Second, 0 = Christ the King
			const kingdomSlug =
				weeksBeforeAdvent === 0
					? 'christ-the-king'
					: `kingdom-${weeksBeforeAdvent + 1}`;
			insertDateMap(toISO(properSunday), kingdomSlug);
		} else {
			insertDateMap(toISO(properSunday), `proper-${properNum}`);
			properNum++;
		}
		properSunday = addDays(properSunday, 7);
	}

	// --- Fixed feasts ---
	insertDateMap(`${year}-11-01`, 'all-saints');
}

console.log(`  Inserted ${dateMapInserted} date map entries.`);

console.log('\nLectionary seed complete.');
sqlite.close();
