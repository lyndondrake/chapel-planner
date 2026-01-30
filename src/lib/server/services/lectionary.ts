import { eq, and } from 'drizzle-orm';
import { db, lectionaryOccasions, lectionaryReadings, lectionaryDateMap } from '../db';
import { getLiturgicalSeason, getLiturgicalYear, toISODate } from '$lib/utils/liturgical-date';

/**
 * Look up the lectionary occasion for a given date.
 * Returns the principal occasion and its readings for the appropriate tradition and year.
 */
export function getOccasionByDate(date: string) {
	const mapping = db
		.select()
		.from(lectionaryDateMap)
		.where(and(eq(lectionaryDateMap.date, date), eq(lectionaryDateMap.isPrincipal, true)))
		.get();

	if (!mapping) return null;

	const occasion = db
		.select()
		.from(lectionaryOccasions)
		.where(eq(lectionaryOccasions.id, mapping.occasionId))
		.get();

	if (!occasion) return null;

	return { ...occasion, liturgicalYear: mapping.liturgicalYear };
}

/**
 * Get all occasions mapped to a given date (including non-principal).
 */
export function getOccasionsByDate(date: string) {
	const mappings = db
		.select()
		.from(lectionaryDateMap)
		.where(eq(lectionaryDateMap.date, date))
		.all();

	if (mappings.length === 0) return [];

	return mappings.map((mapping) => {
		const occasion = db
			.select()
			.from(lectionaryOccasions)
			.where(eq(lectionaryOccasions.id, mapping.occasionId))
			.get();
		return { ...occasion, isPrincipal: mapping.isPrincipal, liturgicalYear: mapping.liturgicalYear };
	});
}

/**
 * Get readings for an occasion, filtered by tradition and liturgical year.
 * Optionally filter by service context.
 */
export function getReadingsForOccasion(
	occasionId: number,
	tradition: string = 'cw',
	liturgicalYear?: string | null,
	serviceContext?: string | null
) {
	let readings = db
		.select()
		.from(lectionaryReadings)
		.where(
			and(
				eq(lectionaryReadings.occasionId, occasionId),
				eq(lectionaryReadings.tradition, tradition)
			)
		)
		.all();

	// Filter by liturgical year: include readings for this year or those without a year specification
	if (liturgicalYear) {
		readings = readings.filter(
			(r) => !r.alternateYear || r.alternateYear === liturgicalYear
		);
	}

	// Filter by service context if specified
	if (serviceContext) {
		readings = readings.filter((r) => r.serviceContext === serviceContext);
	}

	return readings.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

/**
 * Get all readings for a date, grouped by service context.
 * Returns readings for a specific tradition, organised into contexts
 * (principal, morning_prayer, evening_prayer, etc.).
 */
export function getReadingsGroupedByContext(date: string, tradition: string = 'cw') {
	const occasion = getOccasionByDate(date);
	if (!occasion) return { occasion: null, groups: {} as Record<string, never[]> };

	const allReadings = db
		.select()
		.from(lectionaryReadings)
		.where(
			and(
				eq(lectionaryReadings.occasionId, occasion.id),
				eq(lectionaryReadings.tradition, tradition)
			)
		)
		.all();

	// Filter by liturgical year
	const litYear = occasion.liturgicalYear;
	const filtered = allReadings.filter(
		(r) => !r.alternateYear || r.alternateYear === litYear
	);

	// Group by service context
	const groups: Record<string, typeof filtered> = {};
	for (const reading of filtered) {
		const ctx = reading.serviceContext ?? 'principal';
		if (!groups[ctx]) groups[ctx] = [];
		groups[ctx].push(reading);
	}

	// Sort readings within each group
	for (const ctx of Object.keys(groups)) {
		groups[ctx].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
	}

	return { occasion, groups };
}

/**
 * Map a service type to the most appropriate lectionary service context.
 * E.g. sung_eucharist → principal, choral_evensong → evening_prayer.
 */
export function serviceTypeToContext(serviceType: string): string {
	const mapping: Record<string, string> = {
		sung_eucharist: 'principal',
		said_eucharist: 'principal',
		feast_day: 'principal',
		morning_prayer: 'morning_prayer',
		choral_matins: 'morning_prayer',
		choral_evensong: 'evening_prayer',
		evening_prayer: 'evening_prayer',
		gaudy_evensong: 'evening_prayer',
		compline: 'evening_prayer'
	};
	return mapping[serviceType] ?? 'principal';
}

/**
 * Get readings for a specific date, filtered by service context.
 * Uses the date map to find the occasion and the liturgical year to filter readings.
 */
export function getReadingsForDateAndContext(
	date: string,
	tradition: string = 'cw',
	serviceContext?: string | null
) {
	const occasion = getOccasionByDate(date);
	if (!occasion) return { occasion: null, readings: [] };

	const readings = getReadingsForOccasion(
		occasion.id,
		tradition,
		occasion.liturgicalYear,
		serviceContext
	);
	return { occasion, readings };
}

/**
 * Get readings for a specific date, using the date map to find the occasion
 * and the liturgical year to filter readings.
 */
export function getReadingsForDate(date: string, tradition: string = 'cw') {
	const occasion = getOccasionByDate(date);
	if (!occasion) return { occasion: null, readings: [] };

	const readings = getReadingsForOccasion(occasion.id, tradition, occasion.liturgicalYear);
	return { occasion, readings };
}

/**
 * Get an occasion by its slug.
 */
export function getOccasionBySlug(slug: string) {
	return db
		.select()
		.from(lectionaryOccasions)
		.where(eq(lectionaryOccasions.slug, slug))
		.get();
}

/**
 * List all lectionary occasions.
 */
export function listOccasions() {
	return db
		.select()
		.from(lectionaryOccasions)
		.orderBy(lectionaryOccasions.id)
		.all();
}

/**
 * Get liturgical information for a date (season, colour, occasion name, year).
 * Combines the date map lookup with the computus-based season derivation.
 */
export function getLiturgicalInfoForDate(dateStr: string) {
	const date = new Date(dateStr + 'T12:00:00');
	const { season, colour } = getLiturgicalSeason(date);
	const liturgicalYear = getLiturgicalYear(date);

	const occasion = getOccasionByDate(dateStr);

	return {
		season,
		colour: occasion?.colour ?? colour,
		liturgicalDay: occasion?.name ?? null,
		liturgicalYear,
		occasionId: occasion?.id ?? null
	};
}
