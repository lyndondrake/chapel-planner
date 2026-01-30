import {
	getReadingsGroupedByContext,
	getOccasionByDate
} from '$lib/server/services/lectionary';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const dateParam = url.searchParams.get('date');
	const tradition = url.searchParams.get('tradition') ?? 'cw';

	const today = new Date().toISOString().split('T')[0];
	const date = dateParam || today;

	// Get readings grouped by service context for the selected tradition
	const { occasion, groups } = getReadingsGroupedByContext(date, tradition);

	// Also get readings for the alternate tradition
	const altTradition = tradition === 'cw' ? 'bcp' : 'cw';
	const altData = getReadingsGroupedByContext(date, altTradition);

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
		groups,
		altTradition,
		altGroups: altData.groups
	};
};
