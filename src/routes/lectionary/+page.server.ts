import {
	getReadingsGroupedByContext,
	getOccasionByDate
} from '$lib/server/services/lectionary';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const dateParam = url.searchParams.get('date');

	const today = new Date().toISOString().split('T')[0];
	const date = dateParam || today;

	// Get readings grouped by service context for both traditions
	const { occasion, groups: cwGroups, commemorations, alternativeOccasions } = getReadingsGroupedByContext(date, 'cw');
	const { groups: bcpGroups } = getReadingsGroupedByContext(date, 'bcp');

	return {
		date,
		occasion: occasion
			? {
					id: occasion.id,
					name: occasion.name,
					slug: occasion.slug,
					season: occasion.season,
					colour: occasion.colour,
					liturgicalYear: occasion.liturgicalYear,
					collectCw: occasion.collectCw ?? null,
					collectBcp: occasion.collectBcp ?? null,
					postCommunionCw: occasion.postCommunionCw ?? null
				}
			: null,
		cwGroups,
		bcpGroups,
		commemorations,
		alternativeOccasions
	};
};
