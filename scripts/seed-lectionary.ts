import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { resolve } from 'path';
import { mkdirSync, readFileSync, existsSync } from 'fs';
import * as schema from '../src/lib/server/db/schema';

const DB_PATH = resolve('data/chapel-planner.db');

mkdirSync(resolve('data'), { recursive: true });

const sqlite = new Database(DB_PATH);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

const db = drizzle(sqlite, { schema });

console.log('Seeding lectionary data...');

// Clear existing lectionary data (order matters for FK constraints)
db.delete(schema.lectionaryDateMap).run();
db.delete(schema.lectionaryReadings).run();
db.delete(schema.lectionaryOccasions).run();
console.log('  Cleared existing lectionary data.');

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

// --- 2. Load and insert readings from multiple files ---

const readingFiles = [
	'scripts/data/lectionary-readings-cw-principal.json',
	'scripts/data/lectionary-readings-cw-office.json',
	'scripts/data/lectionary-readings-bcp-office.json'
];

let readingsInserted = 0;
let readingsSkipped = 0;

for (const file of readingFiles) {
	const filePath = resolve(file);
	if (!existsSync(filePath)) {
		console.log(`  Skipping ${file} (not found)`);
		continue;
	}

	const readingsRaw = JSON.parse(readFileSync(filePath, 'utf-8'));
	console.log(`  Loading ${readingsRaw.length} readings from ${file}...`);

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
}

console.log(
	`  Inserted ${readingsInserted} readings (${readingsSkipped} skipped due to missing occasion).`
);

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
	while (current.getDay() !== 0) {
		current = addDays(current, 1);
	}
	while (current <= end) {
		sundays.push(new Date(current));
		current = addDays(current, 7);
	}
	return sundays;
}

const dayAbbrevs = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

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

/**
 * Insert weekday entries (Mon–Sat) for a given week.
 * sundayDate is the Sunday that starts the week.
 * slugPrefix is e.g. 'advent-1' — weekdays become 'advent-1-mon', etc.
 */
function insertWeekdays(sundayDate: Date, slugPrefix: string) {
	for (let d = 1; d <= 6; d++) {
		const weekday = addDays(sundayDate, d);
		const slug = `${slugPrefix}-${dayAbbrevs[d]}`;
		if (slugToId[slug]) {
			insertDateMap(toISO(weekday), slug);
		}
	}
}

for (let year = 2024; year <= 2030; year++) {
	const easter = computeEaster(year);
	const adventSunday = getAdventSunday(year);

	// --- Advent Sundays + weekdays ---
	for (let w = 0; w < 4; w++) {
		const sunday = addDays(adventSunday, w * 7);
		insertDateMap(toISO(sunday), `advent-${w + 1}`);
		insertWeekdays(sunday, `advent-${w + 1}`);
	}

	// --- Christmas Day ---
	insertDateMap(`${year}-12-25`, 'christmas-day');

	// --- Christmas date-specific days (Dec 26–31, Jan 1) ---
	// These are fixed-date occasions in the Christmas season
	const christmasDateSlugs: Record<string, string> = {
		'12-26': 'christmas-dec-26',
		'12-27': 'christmas-dec-27',
		'12-28': 'christmas-dec-28',
		'12-29': 'christmas-dec-29',
		'12-30': 'christmas-dec-30',
		'12-31': 'christmas-dec-31'
	};
	for (const [md, slug] of Object.entries(christmasDateSlugs)) {
		const dateStr = `${year}-${md}`;
		insertDateMap(dateStr, slug);
	}
	// Jan 1 of the following year
	insertDateMap(`${year + 1}-01-01`, 'christmas-jan-1');

	// --- Christmas fixed feasts (as non-principal if they overlap) ---
	if (slugToId['st-stephen']) insertDateMap(`${year}-12-26`, 'st-stephen', false);
	if (slugToId['st-john-evangelist']) insertDateMap(`${year}-12-27`, 'st-john-evangelist', false);
	if (slugToId['holy-innocents']) insertDateMap(`${year}-12-28`, 'holy-innocents', false);

	// --- Christmas Sundays ---
	const christmasSundays = getSundaysBetween(
		new Date(year, 11, 26),
		new Date(year + 1, 0, 1)
	);
	if (christmasSundays.length > 0) {
		insertDateMap(toISO(christmasSundays[0]), 'christmas-1');
	}

	const christmas2Sundays = getSundaysBetween(
		new Date(year + 1, 0, 2),
		new Date(year + 1, 0, 5)
	);
	if (christmas2Sundays.length > 0) {
		insertDateMap(toISO(christmas2Sundays[0]), 'christmas-2');
	}

	// --- Naming of Jesus (Jan 1) ---
	if (slugToId['naming-of-jesus']) insertDateMap(`${year}-01-01`, 'naming-of-jesus', false);

	// --- Epiphany (Jan 6) ---
	insertDateMap(`${year}-01-06`, 'epiphany');

	// --- Epiphany Sundays + weekdays ---
	const epiphanySundayStart = new Date(year, 0, 7);
	const ashWednesday = addDays(easter, -46);
	const epiphanySundays = getSundaysBetween(
		epiphanySundayStart,
		addDays(ashWednesday, -15) // stop before Before Lent Sundays
	);
	const epiphanyWeekSlugs = ['epiphany-1', 'epiphany-2', 'epiphany-3', 'epiphany-4'];
	for (let i = 0; i < Math.min(epiphanySundays.length, 4); i++) {
		insertDateMap(toISO(epiphanySundays[i]), epiphanyWeekSlugs[i]);
		insertWeekdays(epiphanySundays[i], epiphanyWeekSlugs[i]);
	}

	// --- Candlemas (Feb 2) ---
	insertDateMap(`${year}-02-02`, 'candlemas');

	// --- Sundays before Lent + weekdays ---
	const sundayBeforeLent = addDays(
		ashWednesday,
		-(ashWednesday.getDay() === 0 ? 7 : ashWednesday.getDay())
	);
	insertDateMap(toISO(sundayBeforeLent), 'before-lent-1');
	insertWeekdays(sundayBeforeLent, 'before-lent-1');

	const secondSundayBeforeLent = addDays(sundayBeforeLent, -7);
	insertDateMap(toISO(secondSundayBeforeLent), 'before-lent-2');
	insertWeekdays(secondSundayBeforeLent, 'before-lent-2');

	// --- Ash Wednesday ---
	insertDateMap(toISO(ashWednesday), 'ash-wednesday');

	// --- Lent Sundays + weekdays ---
	const lentSunday1 = addDays(ashWednesday, 4);
	for (let w = 0; w < 5; w++) {
		const sunday = addDays(lentSunday1, w * 7);
		insertDateMap(toISO(sunday), `lent-${w + 1}`);
		insertWeekdays(sunday, `lent-${w + 1}`);
	}

	// --- Holy Week ---
	insertDateMap(toISO(addDays(easter, -7)), 'palm-sunday');
	insertDateMap(toISO(addDays(easter, -6)), 'holy-monday');
	insertDateMap(toISO(addDays(easter, -5)), 'holy-tuesday');
	insertDateMap(toISO(addDays(easter, -4)), 'holy-wednesday');
	insertDateMap(toISO(addDays(easter, -3)), 'maundy-thursday');
	insertDateMap(toISO(addDays(easter, -2)), 'good-friday');
	insertDateMap(toISO(addDays(easter, -1)), 'easter-eve');

	// --- Easter + weekdays ---
	insertDateMap(toISO(easter), 'easter-day');
	for (let w = 2; w <= 7; w++) {
		const sunday = addDays(easter, (w - 1) * 7);
		insertDateMap(toISO(sunday), `easter-${w}`);
		insertWeekdays(sunday, `easter-${w}`);
	}

	// --- Ascension Day (Easter + 39) ---
	insertDateMap(toISO(addDays(easter, 39)), 'ascension-day');

	// --- Pentecost (Easter + 49) ---
	insertDateMap(toISO(addDays(easter, 49)), 'pentecost');

	// --- Trinity Sunday (Easter + 56) ---
	insertDateMap(toISO(addDays(easter, 56)), 'trinity-sunday');

	// --- Ordinary Time Propers (after Trinity) + weekdays ---
	const trinitySunday = addDays(easter, 56);
	let properSunday = addDays(trinitySunday, 7);

	let properNum = 4;
	while (properSunday < adventSunday && properNum <= 25) {
		const weeksBeforeAdvent = Math.round(
			(adventSunday.getTime() - properSunday.getTime()) / (7 * 24 * 60 * 60 * 1000)
		);

		if (weeksBeforeAdvent <= 3) {
			const kingdomSlug =
				weeksBeforeAdvent === 0
					? 'christ-the-king'
					: `kingdom-${weeksBeforeAdvent + 1}`;
			insertDateMap(toISO(properSunday), kingdomSlug);
			if (weeksBeforeAdvent > 0) {
				insertWeekdays(properSunday, kingdomSlug);
			}
		} else {
			insertDateMap(toISO(properSunday), `proper-${properNum}`);
			insertWeekdays(properSunday, `proper-${properNum}`);
			properNum++;
		}
		properSunday = addDays(properSunday, 7);
	}

	// --- Fixed feasts (as non-principal overlays) ---
	const fixedFeasts: [number, number, string][] = [
		[1, 25, 'conversion-of-st-paul'],
		[2, 2, 'candlemas'],
		[3, 19, 'st-joseph'],
		[3, 25, 'annunciation'],
		[4, 25, 'st-mark'],
		[5, 1, 'ss-philip-and-james'],
		[5, 14, 'st-matthias'],
		[5, 31, 'visit-of-mary'],
		[6, 11, 'st-barnabas'],
		[6, 24, 'birth-of-john-the-baptist'],
		[6, 29, 'ss-peter-and-paul'],
		[7, 3, 'st-thomas'],
		[7, 22, 'st-mary-magdalene'],
		[7, 25, 'st-james'],
		[8, 6, 'transfiguration'],
		[8, 15, 'blessed-virgin-mary'],
		[8, 24, 'st-bartholomew'],
		[9, 14, 'holy-cross-day'],
		[9, 21, 'st-matthew'],
		[9, 29, 'st-michael-and-all-angels'],
		[10, 18, 'st-luke'],
		[10, 28, 'ss-simon-and-jude'],
		[11, 1, 'all-saints'],
		[11, 2, 'all-souls'],
		[11, 30, 'st-andrew']
	];

	for (const [month, day, slug] of fixedFeasts) {
		if (slugToId[slug]) {
			const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
			// All Saints is principal; others are non-principal overlays
			const isPrincipal = slug === 'all-saints';
			insertDateMap(dateStr, slug, isPrincipal);
		}
	}
}

console.log(`  Inserted ${dateMapInserted} date map entries.`);

console.log('\nLectionary seed complete.');
sqlite.close();
