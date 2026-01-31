/**
 * Parse oremus almanac HTML into JSON lectionary reading files.
 *
 * Reads downloaded HTML from scripts/data/almanac-{year}.html and outputs:
 *   - lectionary-readings-cw-principal.json
 *   - lectionary-readings-cw-office.json
 *   - lectionary-readings-cw-eucharist.json
 *   - lectionary-readings-bcp-hc.json
 *
 * Usage: npx tsx scripts/parse-almanac.ts
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// ---------------------------------------------------------------------------
// Liturgical date logic (duplicated from seed-lectionary.ts)
// ---------------------------------------------------------------------------

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

/** Weekday office lectionary alternates on a 2-year cycle. */
function getOfficeCycleYear(date: Date): '1' | '2' {
	let year = date.getFullYear();
	const adventSunday = getAdventSunday(year);
	if (date < adventSunday) {
		year = year - 1;
	}
	// Odd liturgical years (starting from Advent) = Year 1
	return year % 2 === 1 ? '1' : '2';
}

// ---------------------------------------------------------------------------
// Build date → slug mapping (same logic as seed-lectionary.ts)
// ---------------------------------------------------------------------------

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

function buildDateSlugMap(startYear: number, endYear: number): Map<string, string> {
	const map = new Map<string, string>();

	function set(date: string, slug: string) {
		// Only set the principal mapping (first one wins for a date)
		if (!map.has(date)) {
			map.set(date, slug);
		}
	}

	function setWeekdays(sundayDate: Date, slugPrefix: string) {
		for (let d = 1; d <= 6; d++) {
			const weekday = addDays(sundayDate, d);
			set(toISO(weekday), `${slugPrefix}-${dayAbbrevs[d]}`);
		}
	}

	for (let year = startYear; year <= endYear; year++) {
		const easter = computeEaster(year);
		const adventSunday = getAdventSunday(year);

		// Advent
		for (let w = 0; w < 4; w++) {
			const sunday = addDays(adventSunday, w * 7);
			set(toISO(sunday), `advent-${w + 1}`);
			setWeekdays(sunday, `advent-${w + 1}`);
		}

		// Christmas Eve
		set(`${year}-12-24`, 'christmas-eve');

		// Christmas Day
		set(`${year}-12-25`, 'christmas-day');

		// Christmas date-specific days
		const christmasDateSlugs: Record<string, string> = {
			'12-26': 'christmas-dec-26',
			'12-27': 'christmas-dec-27',
			'12-28': 'christmas-dec-28',
			'12-29': 'christmas-dec-29',
			'12-30': 'christmas-dec-30',
			'12-31': 'christmas-dec-31'
		};
		for (const [md, slug] of Object.entries(christmasDateSlugs)) {
			set(`${year}-${md}`, slug);
		}
		set(`${year + 1}-01-01`, 'christmas-jan-1');

		// Christmas Sundays
		const christmasSundays = getSundaysBetween(
			new Date(year, 11, 26),
			new Date(year + 1, 0, 1)
		);
		if (christmasSundays.length > 0) {
			set(toISO(christmasSundays[0]), 'christmas-1');
		}
		const christmas2Sundays = getSundaysBetween(
			new Date(year + 1, 0, 2),
			new Date(year + 1, 0, 5)
		);
		if (christmas2Sundays.length > 0) {
			set(toISO(christmas2Sundays[0]), 'christmas-2');
		}

		// Epiphany
		set(`${year}-01-06`, 'epiphany');

		// Epiphany Sundays + weekdays
		const ashWednesday = addDays(easter, -46);
		const epiphanySundayStart = new Date(year, 0, 7);
		const epiphanySundays = getSundaysBetween(
			epiphanySundayStart,
			addDays(ashWednesday, -15)
		);
		const epiphanyWeekSlugs = ['epiphany-1', 'epiphany-2', 'epiphany-3', 'epiphany-4'];
		for (let i = 0; i < Math.min(epiphanySundays.length, 4); i++) {
			set(toISO(epiphanySundays[i]), epiphanyWeekSlugs[i]);
			setWeekdays(epiphanySundays[i], epiphanyWeekSlugs[i]);
		}

		// Candlemas
		set(`${year}-02-02`, 'candlemas');

		// Sundays before Lent
		const sundayBeforeLent = addDays(
			ashWednesday,
			-(ashWednesday.getDay() === 0 ? 7 : ashWednesday.getDay())
		);
		set(toISO(sundayBeforeLent), 'before-lent-1');
		setWeekdays(sundayBeforeLent, 'before-lent-1');

		const secondSundayBeforeLent = addDays(sundayBeforeLent, -7);
		set(toISO(secondSundayBeforeLent), 'before-lent-2');
		setWeekdays(secondSundayBeforeLent, 'before-lent-2');

		// Third and Fourth Sundays before Lent (late Easter years)
		const thirdSundayBeforeLent = addDays(sundayBeforeLent, -14);
		const epiphany4End = epiphanySundays.length >= 4 ? addDays(epiphanySundays[3], 7) : epiphanySundayStart;
		if (thirdSundayBeforeLent >= epiphany4End) {
			set(toISO(thirdSundayBeforeLent), 'before-lent-3');
			setWeekdays(thirdSundayBeforeLent, 'before-lent-3');

			const fourthSundayBeforeLent = addDays(sundayBeforeLent, -21);
			if (fourthSundayBeforeLent >= epiphany4End) {
				set(toISO(fourthSundayBeforeLent), 'before-lent-4');
				setWeekdays(fourthSundayBeforeLent, 'before-lent-4');
			}
		}

		// Ash Wednesday
		set(toISO(ashWednesday), 'ash-wednesday');

		// Lent
		const lentSunday1 = addDays(ashWednesday, 4);
		for (let w = 0; w < 5; w++) {
			const sunday = addDays(lentSunday1, w * 7);
			set(toISO(sunday), `lent-${w + 1}`);
			setWeekdays(sunday, `lent-${w + 1}`);
		}

		// Holy Week
		set(toISO(addDays(easter, -7)), 'palm-sunday');
		set(toISO(addDays(easter, -6)), 'holy-monday');
		set(toISO(addDays(easter, -5)), 'holy-tuesday');
		set(toISO(addDays(easter, -4)), 'holy-wednesday');
		set(toISO(addDays(easter, -3)), 'maundy-thursday');
		set(toISO(addDays(easter, -2)), 'good-friday');
		set(toISO(addDays(easter, -1)), 'easter-eve');

		// Easter + weeks
		set(toISO(easter), 'easter-day');
		for (let w = 2; w <= 7; w++) {
			const sunday = addDays(easter, (w - 1) * 7);
			set(toISO(sunday), `easter-${w}`);
			setWeekdays(sunday, `easter-${w}`);
		}

		// Ascension
		set(toISO(addDays(easter, 39)), 'ascension-day');

		// Pentecost
		set(toISO(addDays(easter, 49)), 'pentecost');

		// Trinity Sunday
		set(toISO(addDays(easter, 56)), 'trinity-sunday');

		// Corpus Christi (Easter + 60, Thursday after Trinity)
		set(toISO(addDays(easter, 60)), 'corpus-christi');

		// Ordinary Time (Proper Sundays after Trinity)
		const trinitySunday = addDays(easter, 56);
		let properSunday = addDays(trinitySunday, 7);
		let properNum = 4;

		while (properSunday < adventSunday && properNum <= 25) {
			const weeksBeforeAdvent = Math.round(
				(adventSunday.getTime() - properSunday.getTime()) / (7 * 24 * 60 * 60 * 1000)
			);

			if (weeksBeforeAdvent <= 4) {
				const kingdomSlug =
					weeksBeforeAdvent === 0
						? 'christ-the-king'
						: `kingdom-${weeksBeforeAdvent + 1}`;
				set(toISO(properSunday), kingdomSlug);
				if (weeksBeforeAdvent > 0) {
					setWeekdays(properSunday, kingdomSlug);
				}
			} else {
				set(toISO(properSunday), `proper-${properNum}`);
				setWeekdays(properSunday, `proper-${properNum}`);
				properNum++;
			}
			properSunday = addDays(properSunday, 7);
		}

		// Fixed feasts (as non-principal overlays — these will NOT overwrite existing)
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
			[6, 24, 'birth-of-st-john-baptist'],
			[6, 29, 'ss-peter-and-paul'],
			[7, 3, 'st-thomas'],
			[7, 22, 'st-mary-magdalene'],
			[7, 25, 'st-james'],
			[8, 6, 'transfiguration'],
			[8, 15, 'blessed-virgin-mary'],
			[8, 24, 'st-bartholomew'],
			[9, 14, 'holy-cross-day'],
			[9, 21, 'st-matthew'],
			[9, 29, 'st-michael-all-angels'],
			[10, 18, 'st-luke'],
			[10, 28, 'ss-simon-and-jude'],
			[11, 1, 'all-saints'],
			[11, 2, 'all-souls'],
			[11, 30, 'st-andrew']
		];
		for (const [month, day, slug] of fixedFeasts) {
			const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
			set(dateStr, slug);
		}
	}

	return map;
}

// ---------------------------------------------------------------------------
// Almanac summary → slug mapping for feasts the date mapper might miss
// ---------------------------------------------------------------------------

const summarySlugOverrides: Record<string, string> = {
	'stephen': 'st-stephen',
	'john': 'st-john-evangelist',
	'holy innocents': 'holy-innocents',
	'naming and circumcision of jesus': 'naming-of-jesus',
	'baptism of christ': 'epiphany-1',
	'the presentation': 'candlemas',
	'the annunciation': 'annunciation',
	'joseph of nazareth': 'st-joseph',
	'george': 'st-george',
	'mark the evangelist': 'st-mark',
	'philip and james': 'ss-philip-and-james',
	'matthias': 'st-matthias',
	'the visitation': 'visit-of-mary',
	'barnabas': 'st-barnabas',
	'birth of john the baptist': 'birth-of-st-john-baptist',
	'peter and paul': 'ss-peter-and-paul',
	'thomas': 'st-thomas',
	'mary magdalene': 'st-mary-magdalene',
	'james': 'st-james',
	'the transfiguration': 'transfiguration',
	'the blessed virgin mary': 'blessed-virgin-mary',
	'bartholomew': 'st-bartholomew',
	'holy cross day': 'holy-cross-day',
	'matthew': 'st-matthew',
	'michael and all angels': 'st-michael-all-angels',
	'luke the evangelist': 'st-luke',
	'simon and jude': 'ss-simon-and-jude',
	"all saints' day": 'all-saints',
	"all saints' sunday": 'all-saints',
	"all souls' day": 'all-souls',
	'andrew': 'st-andrew',
	'conversion of paul': 'conversion-of-st-paul',
	'christmas day': 'christmas-day',
	'christmas eve': 'christmas-eve',
	'easter eve': 'easter-eve',
	'easter day': 'easter-day',
	'ascension day': 'ascension-day',
	'palm sunday': 'palm-sunday',
	'maundy thursday': 'maundy-thursday',
	'good friday': 'good-friday',
	'pentecost': 'pentecost',
	'trinity sunday': 'trinity-sunday',
	'ash wednesday': 'ash-wednesday',
	'corpus christi': 'corpus-christi',
	'christ the king': 'christ-the-king',
	'sunday before lent': 'before-lent-1',
	'mothering sunday': 'mothering-sunday',
	'dedication festival': 'dedication-festival',
	'bible sunday': 'bible-sunday',
	'easter vigil': 'easter-vigil',
	'peter': 'peter-apostle'
};

function parseSummaryToSlug(summary: string): string | null {
	// Strip "CW* " or "CW " prefix, and "(or) " prefix
	let clean = summary
		.replace(/^CW\*?\s*/, '')
		.replace(/^\(or\)\s*/, '')
		.replace(/&rsquo;/g, "'")
		.replace(/&ndash;/g, '–')
		.trim();

	// Strip trailing notes like "; Remembrance Sunday", "; Last Day of..." etc
	clean = clean.replace(/;.*$/, '').trim();

	if (!clean) return null;

	const lower = clean.toLowerCase();

	// Direct override
	if (summarySlugOverrides[lower]) {
		return summarySlugOverrides[lower];
	}

	// "Advent N"
	const adventMatch = lower.match(/^advent (\d+)$/);
	if (adventMatch) return `advent-${adventMatch[1]}`;

	// "Christmas N"
	const christmasMatch = lower.match(/^christmas (\d+)$/);
	if (christmasMatch) return `christmas-${christmasMatch[1]}`;

	// "Epiphany N"
	const epiphanyMatch = lower.match(/^epiphany (\d+)$/);
	if (epiphanyMatch) return `epiphany-${epiphanyMatch[1]}`;

	// "Epiphany" alone
	if (lower === 'epiphany' || lower === 'the epiphany') return 'epiphany';

	// "Lent N"
	const lentMatch = lower.match(/^lent (\d+)$/);
	if (lentMatch) return `lent-${lentMatch[1]}`;

	// "Easter N"
	const easterMatch = lower.match(/^easter (\d+)$/);
	if (easterMatch) return `easter-${easterMatch[1]}`;

	// "Trinity N" → maps to proper-N via date
	const trinityMatch = lower.match(/^trinity (\d+)$/);
	if (trinityMatch) return null; // will be resolved by date mapping

	// "N before Lent"
	const beforeLentMatch = lower.match(/^(\d+) before lent$/);
	if (beforeLentMatch) {
		const n = parseInt(beforeLentMatch[1]);
		if (n >= 1 && n <= 4) return `before-lent-${n}`;
		return null;
	}

	// "N before Advent" → kingdom Sundays
	// In CW: "3 before Advent" = kingdom-4 (wba=3), "2 before Advent" = kingdom-3 (wba=2)
	// "4 before Advent" = kingdom-5 (wba=4)
	const beforeAdventMatch = lower.match(/^(\d+) before advent$/);
	if (beforeAdventMatch) {
		const n = parseInt(beforeAdventMatch[1]);
		if (n >= 2 && n <= 4) return `kingdom-${n + 1}`;
		return null;
	}

	return null;
}

// ---------------------------------------------------------------------------
// Classify reading type from a reference string
// ---------------------------------------------------------------------------

const gospelBooks = new Set([
	'Matthew', 'Mark', 'Luke', 'John'
]);

const epistleBooks = new Set([
	'Romans', 'Corinthians', 'Galatians', 'Ephesians', 'Philippians',
	'Colossians', 'Thessalonians', 'Timothy', 'Titus', 'Philemon',
	'Hebrews', 'James', 'Peter', 'Jude', 'Revelation', 'Acts'
]);

function classifyReadingType(ref: string, sectionContext: string, biblerefAttr?: string): string {
	// Check biblerefAttr first if available (it often has the full "Psalms 139" form
	// even when the visible text is a bare number like "139")
	const checkRef = biblerefAttr ?? ref;
	const checkLower = checkRef.toLowerCase();

	if (checkLower.startsWith('psalm') || checkLower.match(/^\d+\s*psalm/)) {
		return 'psalm';
	}

	// Bare numbers (e.g. "139", "142, 144") in office contexts are psalms
	if (/^\d[\d,\s]*$/.test(ref.trim())) {
		return 'psalm';
	}

	// For principal service and daily eucharist, use detailed classification
	const bookPart = ref.replace(/\d+\s+/, '').split(/[\s.]/)[0];

	// Check gospels
	for (const g of gospelBooks) {
		if (ref.startsWith(g)) {
			return 'gospel';
		}
	}

	// Check epistles / Acts / Revelation
	for (const e of epistleBooks) {
		if (ref.includes(e)) {
			return 'epistle';
		}
	}
	// "1 Corinthians" etc
	if (ref.match(/^\d\s*(Corinthians|Thessalonians|Timothy|Peter|John|Kings|Samuel|Chronicles)/)) {
		const book = ref.match(/^\d\s*(\w+)/)?.[1];
		if (book && epistleBooks.has(book)) return 'epistle';
		// 1/2 Kings, Samuel, Chronicles = OT
		return 'old_testament';
	}

	// Default to old_testament for everything else
	return 'old_testament';
}

// ---------------------------------------------------------------------------
// Parse HTML
// ---------------------------------------------------------------------------

interface RawReading {
	ref: string;
	biblerefAttr: string;
	isOptional?: boolean;
}

interface ParsedSection {
	label: string;
	readings: RawReading[];
}

interface ParsedEntry {
	dateStart: string; // YYYY-MM-DD
	summary: string;
	commemorationName: string | null; // from cwtitle
	commemorationColour: string | null; // from colours span
	sections: {
		lect1: ParsedSection[];
		lect2: ParsedSection[];
		lect3: ParsedSection[];
		lect4: ParsedSection[]; // Exciting Holiness (commemorations)
		bcphc: RawReading[];
		bcpadd: RawReading[];
	};
}

function parseDateAttr(d: string): string {
	// "20241201" → "2024-12-01"
	return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
}

function parseAlmanacHtml(html: string): ParsedEntry[] {
	const entries: ParsedEntry[] = [];

	// Split into previewhtml blocks
	const blockRegex = /<div class="previewhtml[^"]*"[^>]*data-almanac-d1="(\d+)"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<!-- class="previewhtml" -->/g;
	let match;

	while ((match = blockRegex.exec(html)) !== null) {
		const dateStart = parseDateAttr(match[1]);
		const blockHtml = match[2];

		// Get summary
		const summaryMatch = blockHtml.match(/<div class="previewsummary">(.*?)<\/div>/);
		if (!summaryMatch) continue;
		const summary = summaryMatch[1];

		// Skip the copyright/almanac info entry
		if (summary.includes('Almanac and Lectionary')) continue;

		// Parse lect1 spans
		const lect1Sections = parseLectSpans(blockHtml, 'lect1');
		const lect2Sections = parseLectSpans(blockHtml, 'lect2');
		const lect3Sections = parseLectSpans(blockHtml, 'lect3');
		const lect4Sections = parseLectSpans(blockHtml, 'lect4');

		// Parse BCP HC readings
		const bcphcReadings = parseBibleRefs(blockHtml, 'bcphc');
		const bcpaddReadings = parseBibleRefs(blockHtml, 'bcpadd');

		// Extract commemoration metadata from cwtitle and colours spans
		let commemorationName: string | null = null;
		let commemorationColour: string | null = null;

		if (lect4Sections.length > 0) {
			// Get cwtitle text (may have multiple lines for multiple saints)
			const titleRegex = /<span class="cwtitle">(.*?)<br\s*\/?>/g;
			const titles: string[] = [];
			let titleM;
			while ((titleM = titleRegex.exec(blockHtml)) !== null) {
				const t = titleM[1].replace(/<[^>]+>/g, '').trim();
				if (t) titles.push(t);
			}
			if (titles.length > 0) {
				commemorationName = titles[0]; // Use the first/primary title
			}

			// Get colours — look for the second colour after " / "
			const colourMatches = [...blockHtml.matchAll(/<span class="colours">(.*?)<\/span>/g)];
			if (colourMatches.length >= 2) {
				// Second colours span typically has " / red" or " / white"
				const secondColour = colourMatches[1][1]
					.replace(/<br\s*\/?>/g, '')
					.replace(/^\s*\/\s*/, '')
					.trim()
					.toLowerCase();
				if (secondColour) commemorationColour = secondColour;
			} else if (colourMatches.length === 1) {
				const colour = colourMatches[0][1]
					.replace(/<br\s*\/?>/g, '')
					.trim()
					.toLowerCase();
				if (colour) commemorationColour = colour;
			}
		}

		entries.push({
			dateStart,
			summary,
			commemorationName,
			commemorationColour,
			sections: {
				lect1: lect1Sections,
				lect2: lect2Sections,
				lect3: lect3Sections,
				lect4: lect4Sections,
				bcphc: bcphcReadings,
				bcpadd: bcpaddReadings
			}
		});
	}

	return entries;
}

function parseLectSpans(html: string, spanClass: string): ParsedSection[] {
	const sections: ParsedSection[] = [];
	let currentLabel = '';
	let currentReadings: RawReading[] = [];
	let afterOr = false; // track whether we're past an "(or)" marker

	// Find all spans of this class, in order
	const spanRegex = new RegExp(`<span class="${spanClass}">(.*?)</span>`, 'gs');
	let m;

	while ((m = spanRegex.exec(html)) !== null) {
		const content = m[1];

		// Check for <em> label (section header)
		const emMatch = content.match(/<em>(.*?)<\/em>/);
		if (emMatch) {
			const label = emMatch[1].replace(/:$/, '').trim();

			// Check for "(or)" marker within an em tag
			if (label === '(or)' || label === 'or') {
				afterOr = true;
				continue;
			}

			// Check if this span also has a bibleref
			const refMatch = content.match(/<bibleref ref="([^"]*)">(.*?)<\/bibleref>/);

			// If we see a new section label and have accumulated readings, save them
			if (label && !label.startsWith('(') && !label.startsWith('Gospel at')) {
				if (currentLabel && currentReadings.length > 0) {
					sections.push({ label: currentLabel, readings: [...currentReadings] });
				}
				currentLabel = label;
				currentReadings = [];
				afterOr = false;
			}

			// "Gospel at Holy Communion:" appears within lect1, treat as sub-label
			if (label.startsWith('Gospel at')) {
				// Next reading is the HC gospel for this service, just include it
			}

			if (refMatch) {
				currentReadings.push({ ref: refMatch[2], biblerefAttr: refMatch[1], isOptional: afterOr });
			}

			continue;
		}

		// Check for "(or)" marker — this indicates alternative psalms
		if (content.trim() === '<em>(or)</em>') {
			afterOr = true;
			continue;
		}

		// Extract bible references
		const refRegex = /<bibleref ref="([^"]*)">(.*?)<\/bibleref>/g;
		let refM;
		while ((refM = refRegex.exec(content)) !== null) {
			currentReadings.push({ ref: refM[2], biblerefAttr: refM[1], isOptional: afterOr });
		}
	}

	// Save final section
	if (currentLabel && currentReadings.length > 0) {
		sections.push({ label: currentLabel, readings: [...currentReadings] });
	}

	return sections;
}

function parseBibleRefs(html: string, spanClass: string): RawReading[] {
	const readings: RawReading[] = [];
	const regex = new RegExp(`<span class="${spanClass}"><bibleref ref="([^"]*)">(.*?)</bibleref>`, 'g');
	let m;
	while ((m = regex.exec(html)) !== null) {
		readings.push({ ref: m[2], biblerefAttr: m[1] });
	}
	return readings;
}

// ---------------------------------------------------------------------------
// Map section labels to service contexts
// ---------------------------------------------------------------------------

function labelToServiceContext(label: string): string | null {
	const lower = label.toLowerCase();
	if (lower === 'principal service') return 'principal';
	if (lower === 'second service') return 'second_service';
	if (lower === 'third service') return 'third_service';
	if (lower === 'holy communion') return 'daily_eucharist';
	if (lower === 'morning prayer') return 'morning_prayer';
	if (lower === 'evening prayer') return 'evening_prayer';
	if (lower.includes('morning psalm')) return 'morning_prayer';
	if (lower.includes('evening psalm')) return 'evening_prayer';
	return null;
}

// ---------------------------------------------------------------------------
// Reading output structure
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

function cleanReference(ref: string): string {
	return ref
		.replace(/<[^>]+>/g, '') // strip HTML tags
		.replace(/&ndash;/g, '–')
		.replace(/&rsquo;/g, '\u2019')
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/\s+/g, ' ')
		.replace(/\s*–\s*/g, '–')
		.trim();
}

function parseReference(ref: string): { book: string | null; chapter: string | null; verseStart: string | null; verseEnd: string | null } {
	// Clean up reference
	const cleaned = ref
		.replace(/\s+/g, ' ')
		.replace(/\u2013/g, '-') // en-dash to hyphen for parsing
		.replace(/&ndash;/g, '-')
		.trim();

	// Match patterns like "Isaiah 2.1-5", "Psalm 122", "1 Corinthians 3.1-9"
	const m = cleaned.match(/^(\d?\s*[A-Za-z][A-Za-z\s]*?)\s+(\d+)(?:\.(\d+[a-z]?)(?:\s*[-–]\s*(\d+[a-z]?))?)?/);
	if (!m) {
		// Might be a bare psalm number or abbreviated ref like "1, 2, 3"
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
// Commemoration slug generation
// ---------------------------------------------------------------------------

function commemorationSlug(title: string): string {
	// "Charles, King and Martyr, 1649" → "charles-king-and-martyr"
	// "Francis Xavier, Missionary, Apostle of the Indies, 1552" → "francis-xavier-missionary-apostle-of-the-indies"
	return title
		.replace(/,\s*\d{3,4}(\s+and\s+\d{3,4})?$/, '') // strip trailing years
		.replace(/,\s*c\.\s*\d{3,4}$/, '') // strip "c.326" style years
		.replace(/[,()]/g, '')
		.replace(/&rsquo;/g, '')
		.replace(/&ndash;/g, '-')
		.trim()
		.toLowerCase()
		.replace(/\s+/g, '-');
}

// ---------------------------------------------------------------------------
// Commemoration occasion output structure
// ---------------------------------------------------------------------------

interface OutputCommemorationOccasion {
	slug: string;
	name: string;
	colour: string | null;
	isFixed: true;
	fixedMonth: number;
	fixedDay: number;
	priority: number;
}

// ---------------------------------------------------------------------------
// Main processing
// ---------------------------------------------------------------------------

function main() {
	const dataDir = resolve('scripts/data');
	const years = [2024, 2025, 2026];
	const allEntries: ParsedEntry[] = [];

	for (const year of years) {
		const filePath = resolve(dataDir, `almanac-${year}.html`);
		if (!existsSync(filePath)) {
			console.log(`Skipping ${filePath} (not found)`);
			continue;
		}
		console.log(`Parsing almanac-${year}.html...`);
		const html = readFileSync(filePath, 'utf-8');
		const entries = parseAlmanacHtml(html);
		console.log(`  Found ${entries.length} entries`);
		allEntries.push(...entries);
	}

	// Load occasion slugs for validation
	const occasions: { slug: string }[] = JSON.parse(
		readFileSync(resolve(dataDir, 'lectionary-occasions.json'), 'utf-8')
	);
	const validSlugs = new Set(occasions.map((o) => o.slug));
	console.log(`\nLoaded ${validSlugs.size} valid occasion slugs`);

	// Build date → slug mapping
	const dateSlugMap = buildDateSlugMap(2023, 2027);
	console.log(`Built date-slug map with ${dateSlugMap.size} entries`);

	// Process entries into output readings
	const cwPrincipal: OutputReading[] = [];
	const cwOffice: OutputReading[] = [];
	const cwEucharist: OutputReading[] = [];
	const bcpHc: OutputReading[] = [];
	const cwCommemorations: OutputReading[] = [];
	const commemorationOccasions = new Map<string, OutputCommemorationOccasion>();

	let matched = 0;
	let unmatched = 0;
	const unmatchedSummaries = new Set<string>();

	for (const entry of allEntries) {
		// Always compute both slug sources
		const dateSlug = dateSlugMap.get(entry.dateStart);
		const summarySlug = parseSummaryToSlug(entry.summary);

		let slug: string | undefined;

		// If summary contains "(or)" or the summary slug differs from the date slug,
		// prefer the summary slug — this routes feast alternatives to their own occasion
		const hasOrMarker = entry.summary.includes('(or)');
		if (hasOrMarker && summarySlug && validSlugs.has(summarySlug)) {
			slug = summarySlug;
		} else if (summarySlug && validSlugs.has(summarySlug) && dateSlug && summarySlug !== dateSlug) {
			// Summary-based slug is valid and different from date slug — prefer summary
			// (e.g. a fixed feast on a date that also has a seasonal mapping)
			slug = summarySlug;
		} else if (dateSlug && validSlugs.has(dateSlug)) {
			slug = dateSlug;
		} else if (summarySlug && validSlugs.has(summarySlug)) {
			slug = summarySlug;
		} else {
			// Fall back to date slug even if not in valid slugs (for weekday entries)
			slug = dateSlug;
		}

		if (!slug || !validSlugs.has(slug)) {
			unmatched++;
			if (entry.summary.includes('CW*')) {
				unmatchedSummaries.add(entry.summary);
			}
			continue;
		}

		matched++;

		const date = new Date(entry.dateStart + 'T12:00:00');
		const litYear = getLiturgicalYear(date);
		const officeYear = getOfficeCycleYear(date);
		const isSunday = date.getDay() === 0;

		// --- lect1: Principal/Second/Third service readings ---
		for (const section of entry.sections.lect1) {
			const ctx = labelToServiceContext(section.label);
			if (!ctx) continue;

			let sortOrder = 0;
			for (const reading of section.readings) {
				sortOrder++;
				const readingType = classifyReadingType(reading.ref, ctx, reading.biblerefAttr);
				const parsed = parseReference(reading.ref);

				const outputReading: OutputReading = {
					occasionSlug: slug,
					tradition: 'cw',
					serviceContext: ctx,
					readingType,
					reference: cleanReference(reading.ref),
					book: parsed.book,
					chapter: parsed.chapter,
					verseStart: parsed.verseStart,
					verseEnd: parsed.verseEnd,
					alternateYear: isSunday || isSpecialDay(slug) ? litYear : null,
					isOptional: reading.isOptional ?? false,
					sortOrder
				};

				// Principal/Second/Third go to principal file
				cwPrincipal.push(outputReading);
			}
		}

		// --- lect2: Daily Eucharist readings ---
		for (const section of entry.sections.lect2) {
			const ctx = labelToServiceContext(section.label);
			if (!ctx) continue;

			let sortOrder = 0;
			for (const reading of section.readings) {
				sortOrder++;
				const readingType = classifyReadingType(reading.ref, ctx, reading.biblerefAttr);
				const parsed = parseReference(reading.ref);

				cwEucharist.push({
					occasionSlug: slug,
					tradition: 'cw',
					serviceContext: 'daily_eucharist',
					readingType,
					reference: cleanReference(reading.ref),
					book: parsed.book,
					chapter: parsed.chapter,
					verseStart: parsed.verseStart,
					verseEnd: parsed.verseEnd,
					alternateYear: officeYear,
					isOptional: reading.isOptional ?? false,
					sortOrder
				});
			}
		}

		// --- lect3: Office readings (Morning Prayer / Evening Prayer) ---
		for (const section of entry.sections.lect3) {
			const ctx = labelToServiceContext(section.label);
			if (!ctx) continue;

			let sortOrder = 0;
			for (const reading of section.readings) {
				sortOrder++;
				const readingType = classifyReadingType(reading.ref, ctx, reading.biblerefAttr);
				const parsed = parseReference(reading.ref);

				cwOffice.push({
					occasionSlug: slug,
					tradition: 'cw',
					serviceContext: ctx,
					readingType,
					reference: cleanReference(reading.ref),
					book: parsed.book,
					chapter: parsed.chapter,
					verseStart: parsed.verseStart,
					verseEnd: parsed.verseEnd,
					alternateYear: officeYear,
					isOptional: reading.isOptional ?? false,
					sortOrder
				});
			}
		}

		// --- BCP Holy Communion ---
		const bcpReadings = [...entry.sections.bcpadd, ...entry.sections.bcphc];
		if (bcpReadings.length > 0) {
			let sortOrder = 0;
			for (const reading of bcpReadings) {
				sortOrder++;
				const readingType = classifyReadingType(reading.ref, 'principal', reading.biblerefAttr);
				const parsed = parseReference(reading.ref);

				bcpHc.push({
					occasionSlug: slug,
					tradition: 'bcp',
					serviceContext: 'principal',
					readingType,
					reference: cleanReference(reading.ref),
					book: parsed.book,
					chapter: parsed.chapter,
					verseStart: parsed.verseStart,
					verseEnd: parsed.verseEnd,
					alternateYear: null, // BCP HC doesn't follow the RCL year cycle
					isOptional: reading.isOptional ?? false,
					sortOrder
				});
			}
		}

		// --- lect4: Exciting Holiness (commemoration readings) ---
		if (entry.sections.lect4.length > 0 && entry.commemorationName) {
			const commSlug = commemorationSlug(entry.commemorationName);
			const dateObj = new Date(entry.dateStart + 'T12:00:00');
			const month = dateObj.getMonth() + 1;
			const day = dateObj.getDate();

			// Register the commemoration occasion (first occurrence wins)
			if (!commemorationOccasions.has(commSlug)) {
				commemorationOccasions.set(commSlug, {
					slug: commSlug,
					name: entry.commemorationName,
					colour: entry.commemorationColour,
					isFixed: true,
					fixedMonth: month,
					fixedDay: day,
					priority: 20 // lower than principal feasts
				});
			}

			// Flatten all lect4 section readings into commemoration readings
			let sortOrder = 4; // start at 5 (after regular eucharist at 1-4)
			for (const section of entry.sections.lect4) {
				for (const reading of section.readings) {
					sortOrder++;
					const readingType = classifyReadingType(reading.ref, 'daily_eucharist', reading.biblerefAttr);
					const parsed = parseReference(reading.ref);

					cwCommemorations.push({
						occasionSlug: commSlug,
						tradition: 'cw',
						serviceContext: 'daily_eucharist',
						readingType,
						reference: cleanReference(reading.ref),
						book: parsed.book,
						chapter: parsed.chapter,
						verseStart: parsed.verseStart,
						verseEnd: parsed.verseEnd,
						alternateYear: null,
						isOptional: true, // alternatives to regular daily eucharist
						sortOrder
					});
				}
			}
		}
	}

	console.log(`\nMatched ${matched} entries, ${unmatched} unmatched`);
	if (unmatchedSummaries.size > 0) {
		console.log(`Unmatched CW* summaries (major occasions):`);
		for (const s of unmatchedSummaries) {
			console.log(`  ${s}`);
		}
	}

	// Deduplicate: for each (slug, context, year), keep only readings from the first year encountered
	// This avoids duplicates when the same occasion appears in multiple almanac years
	const deduped = {
		cwPrincipal: deduplicateReadings(cwPrincipal),
		cwOffice: deduplicateReadings(cwOffice),
		cwEucharist: deduplicateReadings(cwEucharist),
		bcpHc: deduplicateReadings(bcpHc),
		cwCommemorations: deduplicateReadings(cwCommemorations)
	};

	console.log(`\nOutput counts (after deduplication):`);
	console.log(`  CW Principal: ${deduped.cwPrincipal.length}`);
	console.log(`  CW Office: ${deduped.cwOffice.length}`);
	console.log(`  CW Eucharist: ${deduped.cwEucharist.length}`);
	console.log(`  BCP HC: ${deduped.bcpHc.length}`);
	console.log(`  CW Commemorations: ${deduped.cwCommemorations.length}`);
	console.log(`  Commemoration occasions: ${commemorationOccasions.size}`);

	// Write output files
	writeJsonFile(resolve(dataDir, 'lectionary-readings-cw-principal.json'), deduped.cwPrincipal);
	writeJsonFile(resolve(dataDir, 'lectionary-readings-cw-office.json'), deduped.cwOffice);
	writeJsonFile(resolve(dataDir, 'lectionary-readings-cw-eucharist.json'), deduped.cwEucharist);
	writeJsonFile(resolve(dataDir, 'lectionary-readings-bcp-hc.json'), deduped.bcpHc);
	writeJsonFile(resolve(dataDir, 'lectionary-readings-cw-commemorations.json'), deduped.cwCommemorations);

	// Write commemoration occasions
	const commOccasionsList = [...commemorationOccasions.values()];
	writeFileSync(
		resolve(dataDir, 'lectionary-occasions-commemorations.json'),
		JSON.stringify(commOccasionsList, null, 2) + '\n'
	);
	console.log(`  Wrote ${resolve(dataDir, 'lectionary-occasions-commemorations.json')}`);

	console.log('\nDone.');
}

function isSpecialDay(slug: string): boolean {
	// Days that should have year-specific readings even if not Sunday
	const specialSlugs = [
		'christmas-day', 'ash-wednesday', 'maundy-thursday', 'good-friday',
		'easter-eve', 'easter-day', 'ascension-day', 'pentecost',
		'trinity-sunday', 'all-saints', 'christ-the-king',
		'epiphany', 'candlemas', 'annunciation'
	];
	return specialSlugs.includes(slug);
}

function deduplicateReadings(readings: OutputReading[]): OutputReading[] {
	// Group by (slug, context, alternateYear, sortOrder) and keep first occurrence
	const seen = new Set<string>();
	const result: OutputReading[] = [];

	for (const r of readings) {
		const key = `${r.occasionSlug}|${r.serviceContext}|${r.alternateYear ?? ''}|${r.readingType}|${r.reference}`;
		if (!seen.has(key)) {
			seen.add(key);
			result.push(r);
		}
	}

	return result;
}

function writeJsonFile(path: string, data: OutputReading[]) {
	writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
	console.log(`  Wrote ${path}`);
}

main();
