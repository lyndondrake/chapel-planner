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
 */
export function getReadingsForOccasion(
	occasionId: number,
	tradition: string = 'cw',
	liturgicalYear?: string | null
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

	return readings.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
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
