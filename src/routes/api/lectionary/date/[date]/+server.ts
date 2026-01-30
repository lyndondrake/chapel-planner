import { json } from '@sveltejs/kit';
import { getReadingsForDate, getLiturgicalInfoForDate } from '$lib/server/services/lectionary';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ params, url }) => {
	const date = params.date;
	const tradition = (url.searchParams.get('tradition') as string) ?? 'cw';

	const liturgicalInfo = getLiturgicalInfoForDate(date);
	const { occasion, readings } = getReadingsForDate(date, tradition);

	return json({
		date,
		tradition,
		liturgicalInfo,
		occasion: occasion
			? {
					id: occasion.id,
					name: occasion.name,
					slug: occasion.slug,
					season: occasion.season,
					colour: occasion.colour,
					liturgicalYear: occasion.liturgicalYear
				}
			: null,
		readings: readings.map((r) => ({
			id: r.id,
			readingType: r.readingType,
			reference: r.reference,
			book: r.book,
			chapter: r.chapter,
			verseStart: r.verseStart,
			verseEnd: r.verseEnd,
			alternateYear: r.alternateYear,
			isOptional: r.isOptional,
			sortOrder: r.sortOrder
		}))
	});
};
