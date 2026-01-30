/**
 * Parse 1922 Revised Table of Lessons (CSV) into BCP office reading JSON.
 *
 * Reads:
 *   - scripts/data/1922-time.csv   (Proper of Time)
 *   - scripts/data/1922-saints.csv (Proper of Saints)
 *
 * Outputs:
 *   - scripts/data/lectionary-readings-bcp-office.json
 *
 * Usage: npx tsx scripts/parse-bcp-office.ts
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

// ---------------------------------------------------------------------------
// Mapping: 1922 Table "Day" labels → occasion slug prefixes
// ---------------------------------------------------------------------------

const dayLabelToSlug: Record<string, string> = {
	// Advent
	'Advent Sunday': 'advent-1',
	'2nd Sunday in Advent': 'advent-2',
	'3rd Sunday in Advent': 'advent-3',
	'4th Sunday in Advent': 'advent-4',

	// Christmas season
	'Christmas Eve': 'christmas-eve',
	'Christmas Day': 'christmas-day',
	'St Stephen': 'st-stephen',
	'St John Evangelist': 'st-john-evangelist',
	"Innocents' Day": 'holy-innocents',
	'Sunday after Christmas Day': 'christmas-1',
	'December 29': 'christmas-dec-29',
	'December 30': 'christmas-dec-30',
	'December 31': 'christmas-dec-31',
	'Circumcision': 'christmas-jan-1',
	'2nd Sunday after Christmas': 'christmas-2',

	// Epiphany
	'Epiphany': 'epiphany',
	'1st Sunday after Epiphany': 'epiphany-1',
	'2nd Sunday after Epiphany': 'epiphany-2',
	'3rd Sunday after Epiphany': 'epiphany-3',
	'4th Sunday after Epiphany': 'epiphany-4',

	// Pre-Lent (BCP names → CW slugs)
	'Septuagesima': 'before-lent-3',
	'Sexagesima': 'before-lent-2',
	'Quinquagesima': 'before-lent-1',

	// Lent
	'Ash Wednesday': 'ash-wednesday',
	'1st Sunday in Lent': 'lent-1',
	'2nd Sunday in Lent': 'lent-2',
	'3rd Sunday in Lent': 'lent-3',
	'4th Sunday in Lent': 'lent-4',
	'5th Sunday in Lent': 'lent-5',

	// Holy Week
	'Palm Sunday': 'palm-sunday',
	'Good Friday': 'good-friday',
	'Easter Eve': 'easter-eve',

	// Easter
	'Easter Day': 'easter-day',
	'1st Sunday after Easter': 'easter-2',
	'2nd Sunday after Easter': 'easter-3',
	'3rd Sunday after Easter': 'easter-4',
	'4th Sunday after Easter': 'easter-5',
	'5th Sunday after Easter': 'easter-6',

	// Ascension & Pentecost
	'Ascension Day': 'ascension-day',
	'Sunday after Ascension': 'easter-7',
	'Whit-Sunday': 'pentecost',

	// Trinity
	'Trinity Sunday': 'trinity-sunday',

	// Post-Trinity → CW Propers
	'1st Sunday after Trinity': 'proper-4',
	'2nd Sunday after Trinity': 'proper-5',
	'3rd Sunday after Trinity': 'proper-6',
	'4th Sunday after Trinity': 'proper-7',
	'5th Sunday after Trinity': 'proper-8',
	'6th Sunday after Trinity': 'proper-9',
	'7th Sunday after Trinity': 'proper-10',
	'8th Sunday after Trinity': 'proper-11',
	'9th Sunday after Trinity': 'proper-12',
	'10th Sunday after Trinity': 'proper-13',
	'11th Sunday after Trinity': 'proper-14',
	'12th Sunday after Trinity': 'proper-15',
	'13th Sunday after Trinity': 'proper-16',
	'14th Sunday after Trinity': 'proper-17',
	'15th Sunday after Trinity': 'proper-18',
	'16th Sunday after Trinity': 'proper-19',
	'17th Sunday after Trinity': 'proper-20',
	'18th Sunday after Trinity': 'proper-21',
	'19th Sunday after Trinity': 'proper-22',
	'20th Sunday after Trinity': 'proper-23',
	'21st Sunday after Trinity': 'proper-24',
	'22nd Sunday after Trinity': 'proper-25',

	// Last kingdom weeks (mapped to CW kingdom slugs)
	'23rd Sunday after Trinity': 'kingdom-5',
	'24th Sunday after Trinity': 'kingdom-4',
	'25th Sunday after Trinity': 'kingdom-3',
	'26th Sunday after Trinity': 'kingdom-2',
	'Sunday next before Advent': 'christ-the-king'
};

// Saints → occasion slugs
const saintToSlug: Record<string, string> = {
	'St Andrew': 'st-andrew',
	'St Thomas': 'st-thomas',
	'Conversion of St Paul': 'conversion-of-st-paul',
	'Purification of the Virgin Mary': 'candlemas',
	'St Matthias': 'st-matthias',
	'Annunciation of Our Lady': 'annunciation',
	'St Mark': 'st-mark',
	'St Phillip and St James': 'ss-philip-and-james',
	'St Barnabas': 'st-barnabas',
	'St John Baptist': 'birth-of-st-john-baptist',
	'St Peter': 'ss-peter-and-paul',
	'St Mary Magdalene': 'st-mary-magdalene',
	'St James': 'st-james',
	'Transfiguration': 'transfiguration',
	'St Bartholomew': 'st-bartholomew',
	'St Matthew': 'st-matthew',
	'St Michael': 'st-michael-all-angels',
	'St Luke': 'st-luke',
	'St Simon and St Jude': 'ss-simon-and-jude',
	'All Saints': 'all-saints'
};

// Weekday name → abbreviation
const weekdayAbbrev: Record<string, string> = {
	Monday: 'mon',
	Tuesday: 'tue',
	Wednesday: 'wed',
	Thursday: 'thu',
	Friday: 'fri',
	Saturday: 'sat'
};

// ---------------------------------------------------------------------------
// Reading output structure (same as parse-almanac.ts)
// ---------------------------------------------------------------------------

interface OutputReading {
	occasionSlug: string;
	tradition: string;
	serviceContext: string;
	readingType: string;
	reference: string;
	book: string | null;
	chapter: string | null;
	verseStart: string | null;
	verseEnd: string | null;
	alternateYear: string | null;
	isOptional: boolean;
	sortOrder: number;
}

// ---------------------------------------------------------------------------
// Classify reading type
// ---------------------------------------------------------------------------

const gospelBooks = new Set(['Matthew', 'Mark', 'Luke', 'John']);

const ntBooks = new Set([
	'Acts',
	'Romans',
	'Corinthians',
	'Galatians',
	'Ephesians',
	'Philippians',
	'Colossians',
	'Thessalonians',
	'Timothy',
	'Titus',
	'Philemon',
	'Hebrews',
	'James',
	'Peter',
	'Jude',
	'John',
	'Revelation'
]);

function classifyReading(ref: string, isNtColumn: boolean): string {
	const refTrimmed = ref.trim();

	if (refTrimmed.toLowerCase().startsWith('psalm')) return 'psalm';

	// If it came from an NT column, classify as gospel or epistle
	if (isNtColumn) {
		for (const g of gospelBooks) {
			if (refTrimmed.startsWith(g)) return 'gospel';
		}
		return 'epistle';
	}

	// OT column — check if it's actually NT (some Apocrypha/NT might appear)
	for (const g of gospelBooks) {
		if (refTrimmed.startsWith(g)) return 'gospel';
	}
	if (refTrimmed.match(/^\d\s*(Corinthians|Thessalonians|Timothy|Peter|John)/)) {
		return 'epistle';
	}
	for (const b of ntBooks) {
		if (refTrimmed.includes(b)) return 'epistle';
	}

	return 'old_testament';
}

// ---------------------------------------------------------------------------
// Parse reference into components
// ---------------------------------------------------------------------------

function parseReference(ref: string): {
	book: string | null;
	chapter: string | null;
	verseStart: string | null;
	verseEnd: string | null;
} {
	const cleaned = ref
		.replace(/\s+/g, ' ')
		.replace(/\u2013/g, '-')
		.trim();

	const m = cleaned.match(
		/^(\d?\s*[A-Za-z][A-Za-z\s]*?)\s+(\d+)(?::(\d+[a-z]?)(?:\s*[-–]\s*(\d+[a-z]?))?)?/
	);
	if (!m) {
		return { book: null, chapter: null, verseStart: null, verseEnd: null };
	}

	return {
		book: m[1].trim(),
		chapter: m[2],
		verseStart: m[3] ?? null,
		verseEnd: m[4] ?? null
	};
}

// ---------------------------------------------------------------------------
// CSV parsing
// ---------------------------------------------------------------------------

function parseCSV(text: string): string[][] {
	const lines = text.split('\n').filter((l) => l.trim());
	return lines.map((line) => {
		// Simple CSV split — no quoted fields in this data
		return line.split(',').map((cell) => cell.trim());
	});
}

// ---------------------------------------------------------------------------
// Process Proper of Time
// ---------------------------------------------------------------------------

function processTimeCSV(filePath: string, validSlugs: Set<string>): OutputReading[] {
	const text = readFileSync(filePath, 'utf-8');
	const rows = parseCSV(text);
	const header = rows[0];
	const readings: OutputReading[] = [];
	let skippedLabels = new Set<string>();

	// Track the current "Day" label (carries forward for weekdays)
	let currentDayLabel = '';

	for (let i = 1; i < rows.length; i++) {
		const row = rows[i];
		const dayLabel = row[0] || currentDayLabel;
		const weekday = row[1]; // empty for Sundays
		currentDayLabel = dayLabel;

		// Resolve the occasion slug
		const baseSlug = dayLabelToSlug[dayLabel];
		if (!baseSlug) {
			skippedLabels.add(dayLabel);
			continue;
		}

		let slug: string;
		if (weekday && weekdayAbbrev[weekday]) {
			slug = `${baseSlug}-${weekdayAbbrev[weekday]}`;
		} else {
			slug = baseSlug;
		}

		if (!validSlugs.has(slug)) {
			// Try without weekday suffix for special days (Ash Wednesday Thu/Fri/Sat, etc.)
			if (!validSlugs.has(baseSlug)) {
				skippedLabels.add(`${dayLabel} ${weekday || '(Sunday)'} → ${slug}`);
			}
			continue;
		}

		// Extract readings from columns
		// Columns: MorningOT1(2), MorningOT2(3), MorningOT3(4),
		//          MorningNT1(5), MorningNT2(6), MorningNT3(7),
		//          EveningOT1(8), EveningOT2(9), EveningOT3(10),
		//          EveningNT1(11), EveningNT2(12), EveningNT3(13)
		const morningOT = [row[2], row[3], row[4]].filter(Boolean);
		const morningNT = [row[5], row[6], row[7]].filter(Boolean);
		const eveningOT = [row[8], row[9], row[10]].filter(Boolean);
		const eveningNT = [row[11], row[12], row[13]].filter(Boolean);

		let sortOrder = 0;

		// Morning Prayer readings
		for (const ref of morningOT) {
			sortOrder++;
			const isOptional = morningOT.indexOf(ref) > 0; // 2nd and 3rd are alternatives
			readings.push(makeReading(slug, 'morning_prayer', ref, false, isOptional, sortOrder));
		}
		for (const ref of morningNT) {
			sortOrder++;
			const isOptional = morningNT.indexOf(ref) > 0;
			readings.push(makeReading(slug, 'morning_prayer', ref, true, isOptional, sortOrder));
		}

		// Evening Prayer readings
		sortOrder = 0;
		for (const ref of eveningOT) {
			sortOrder++;
			const isOptional = eveningOT.indexOf(ref) > 0;
			readings.push(makeReading(slug, 'evening_prayer', ref, false, isOptional, sortOrder));
		}
		for (const ref of eveningNT) {
			sortOrder++;
			const isOptional = eveningNT.indexOf(ref) > 0;
			readings.push(makeReading(slug, 'evening_prayer', ref, true, isOptional, sortOrder));
		}
	}

	if (skippedLabels.size > 0) {
		console.log(`\n  Skipped time.csv rows (no matching slug):`);
		for (const label of skippedLabels) {
			console.log(`    ${label}`);
		}
	}

	return readings;
}

// ---------------------------------------------------------------------------
// Process Proper of Saints
// ---------------------------------------------------------------------------

function processSaintsCSV(filePath: string, validSlugs: Set<string>): OutputReading[] {
	const text = readFileSync(filePath, 'utf-8');
	const rows = parseCSV(text);
	const readings: OutputReading[] = [];
	let skippedSaints = new Set<string>();

	for (let i = 1; i < rows.length; i++) {
		const row = rows[i];
		const holyDay = row[0];
		// row[1] = date (MM-DD), not needed for slug mapping
		const firstEvensongOT = row[2];
		const firstEvensongNT = row[3];
		const mattinsOT = row[4];
		const mattinsNT = row[5];
		const secondEvensongOT = row[6];
		const secondEvensongNT = row[7];

		const slug = saintToSlug[holyDay];
		if (!slug || !validSlugs.has(slug)) {
			skippedSaints.add(holyDay);
			continue;
		}

		let sortOrder: number;

		// Morning Prayer (Mattins) readings
		sortOrder = 0;
		if (mattinsOT) {
			sortOrder++;
			readings.push(makeReading(slug, 'morning_prayer', mattinsOT, false, false, sortOrder));
		}
		if (mattinsNT) {
			sortOrder++;
			readings.push(makeReading(slug, 'morning_prayer', mattinsNT, true, false, sortOrder));
		}

		// Evening Prayer (2nd Evensong) readings
		sortOrder = 0;
		if (secondEvensongOT) {
			sortOrder++;
			readings.push(
				makeReading(slug, 'evening_prayer', secondEvensongOT, false, false, sortOrder)
			);
		}
		if (secondEvensongNT) {
			sortOrder++;
			readings.push(
				makeReading(slug, 'evening_prayer', secondEvensongNT, true, false, sortOrder)
			);
		}

		// First Evensong (eve of the feast) — store as evening_prayer with isOptional
		// since it's an alternative for use the evening before
		sortOrder = 0;
		if (firstEvensongOT) {
			sortOrder++;
			readings.push(
				makeReading(slug, 'evening_prayer', firstEvensongOT, false, true, sortOrder)
			);
		}
		if (firstEvensongNT) {
			sortOrder++;
			readings.push(
				makeReading(slug, 'evening_prayer', firstEvensongNT, true, true, sortOrder)
			);
		}
	}

	if (skippedSaints.size > 0) {
		console.log(`\n  Skipped saints.csv rows (no matching slug):`);
		for (const s of skippedSaints) {
			console.log(`    ${s}`);
		}
	}

	return readings;
}

// ---------------------------------------------------------------------------
// Helper: create a reading record
// ---------------------------------------------------------------------------

function makeReading(
	slug: string,
	serviceContext: string,
	ref: string,
	isNtColumn: boolean,
	isOptional: boolean,
	sortOrder: number
): OutputReading {
	// Handle compound references like "Song of the Three Children 29–37"
	// and "Exodus 10:21 & 11" by keeping the full reference string
	const cleanedRef = ref
		.replace(/\u2013/g, '–')
		.replace(/\s+/g, ' ')
		.trim();

	const readingType = classifyReading(cleanedRef, isNtColumn);
	const parsed = parseReference(cleanedRef);

	return {
		occasionSlug: slug,
		tradition: 'bcp',
		serviceContext,
		readingType,
		reference: cleanedRef,
		book: parsed.book,
		chapter: parsed.chapter,
		verseStart: parsed.verseStart,
		verseEnd: parsed.verseEnd,
		alternateYear: null,
		isOptional,
		sortOrder
	};
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
	const dataDir = resolve('scripts/data');

	// Load valid slugs
	const occasions: { slug: string }[] = JSON.parse(
		readFileSync(resolve(dataDir, 'lectionary-occasions.json'), 'utf-8')
	);
	const validSlugs = new Set(occasions.map((o) => o.slug));
	console.log(`Loaded ${validSlugs.size} valid occasion slugs`);

	// Process Proper of Time
	console.log('\nProcessing 1922-time.csv...');
	const timeReadings = processTimeCSV(resolve(dataDir, '1922-time.csv'), validSlugs);
	console.log(`  Generated ${timeReadings.length} readings from time.csv`);

	// Process Proper of Saints
	console.log('\nProcessing 1922-saints.csv...');
	const saintReadings = processSaintsCSV(resolve(dataDir, '1922-saints.csv'), validSlugs);
	console.log(`  Generated ${saintReadings.length} readings from saints.csv`);

	// Combine and deduplicate
	const allReadings = [...timeReadings, ...saintReadings];

	const seen = new Set<string>();
	const deduped: OutputReading[] = [];
	for (const r of allReadings) {
		const key = `${r.occasionSlug}|${r.serviceContext}|${r.readingType}|${r.reference}|${r.isOptional}`;
		if (!seen.has(key)) {
			seen.add(key);
			deduped.push(r);
		}
	}

	console.log(`\nTotal: ${deduped.length} readings (after deduplication)`);

	// Write output
	const outPath = resolve(dataDir, 'lectionary-readings-bcp-office.json');
	writeFileSync(outPath, JSON.stringify(deduped, null, 2) + '\n');
	console.log(`Wrote ${outPath}`);
}

main();
