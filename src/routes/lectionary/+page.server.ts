import { getReadingsForDate, listOccasions } from '$lib/server/services/lectionary';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const dateParam = url.searchParams.get('date');
	const tradition = url.searchParams.get('tradition') ?? 'cw';

	const today = new Date().toISOString().split('T')[0];
	const date = dateParam || today;

	const { occasion, readings } = getReadingsForDate(date, tradition);

	// Also get BCP readings if we're showing CW, for comparison
	const altTradition = tradition === 'cw' ? 'bcp' : 'cw';
	const altData = getReadingsForDate(date, altTradition);

	return {
		date,
		tradition,
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
		readings,
		altTradition,
		altReadings: altData.readings
	};
};
