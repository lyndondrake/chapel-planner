import { eq, and } from 'drizzle-orm';
import { db, lectionaryOccasions, lectionaryReadings, lectionaryDateMap } from '../db';
import {
	getLiturgicalSeason,
	getLiturgicalYear,
	getOfficeCycleYear,
	toISODate
} from '$lib/utils/liturgical-date';

export interface ReadingGroup {
	readingType: string;
	readings: (typeof lectionaryReadings.$inferSelect)[];
}

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
	serviceContext?: string | null,
	officeCycleYear?: string | null
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

	// Filter by liturgical year (A/B/C) and office cycle year (1/2)
	if (liturgicalYear) {
		readings = readings.filter(
			(r) =>
				!r.alternateYear ||
				r.alternateYear === liturgicalYear ||
				(officeCycleYear && r.alternateYear === officeCycleYear)
		);
	}

	// Filter by service context if specified
	if (serviceContext) {
		readings = readings.filter((r) => r.serviceContext === serviceContext);
	}

	return readings.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

/**
 * Collapse a sorted list of readings into groups, merging alternatives.
 *
 * An optional reading merges into the previous group when either:
 *   (a) it shares the same sortOrder as the group's primary reading
 *       (regardless of readingType), or
 *   (b) its sortOrder is primary + 1 and the primary is NOT optional
 *       — this handles psalm alternatives stored as old_testament that
 *       follow a non-optional psalm entry.
 *
 * Otherwise a new group is started.
 */
function groupAlternativeReadings(
	readings: (typeof lectionaryReadings.$inferSelect)[]
): ReadingGroup[] {
	const groups: ReadingGroup[] = [];

	for (const reading of readings) {
		const lastGroup = groups.length > 0 ? groups[groups.length - 1] : null;

		if (reading.isOptional && lastGroup) {
			const primary = lastGroup.readings[0];
			const primarySort = primary?.sortOrder ?? 0;
			const readingSort = reading.sortOrder ?? 0;
			const primaryIsOptional = primary?.isOptional ?? false;

			const sameSortOrder = readingSort === primarySort;
			const adjacentToNonOptional =
				readingSort === primarySort + 1 && !primaryIsOptional;

			if (sameSortOrder || adjacentToNonOptional) {
				lastGroup.readings.push(reading);
				continue;
			}
		}

		// Start a new group
		groups.push({
			readingType: reading.readingType,
			readings: [reading]
		});
	}

	return groups;
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

	// Filter by liturgical year (A/B/C for principal) and office cycle year (1/2 for office/eucharist)
	const litYear = occasion.liturgicalYear;
	const dateObj = new Date(date + 'T12:00:00');
	const officeYear = getOfficeCycleYear(dateObj);
	const filtered = allReadings.filter(
		(r) =>
			!r.alternateYear ||
			r.alternateYear === litYear ||
			r.alternateYear === officeYear
	);

	// Group by service context
	const contextReadings: Record<string, typeof filtered> = {};
	for (const reading of filtered) {
		const ctx = reading.serviceContext ?? 'principal';
		if (!contextReadings[ctx]) contextReadings[ctx] = [];
		contextReadings[ctx].push(reading);
	}

	// Sort readings within each context, then collapse alternatives into groups
	const groups: Record<string, ReadingGroup[]> = {};
	for (const ctx of Object.keys(contextReadings)) {
		const sorted = contextReadings[ctx].sort(
			(a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
		);
		groups[ctx] = groupAlternativeReadings(sorted);
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

	const dateObj = new Date(date + 'T12:00:00');
	const officeYear = getOfficeCycleYear(dateObj);
	const readings = getReadingsForOccasion(
		occasion.id,
		tradition,
		occasion.liturgicalYear,
		serviceContext,
		officeYear
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

	const dateObj = new Date(date + 'T12:00:00');
	const officeYear = getOfficeCycleYear(dateObj);
	const readings = getReadingsForOccasion(occasion.id, tradition, occasion.liturgicalYear, null, officeYear);
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
