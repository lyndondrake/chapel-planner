import { fail, redirect } from '@sveltejs/kit';
import { createService } from '$lib/server/services/services';
import { listBlocks } from '$lib/server/services/blocks';
import { getLiturgicalInfoForDate } from '$lib/server/services/lectionary';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const blocks = await listBlocks();
	return { blocks };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const serviceType = formData.get('serviceType') as string;
		const date = formData.get('date') as string;

		if (!serviceType || !date) {
			return fail(400, { error: 'Service type and date are required.' });
		}

		const blockIdStr = formData.get('blockId') as string;

		// Auto-populate liturgical data from the lectionary if not provided
		const liturgicalDay = (formData.get('liturgicalDay') as string) || undefined;
		const liturgicalSeason = (formData.get('liturgicalSeason') as string) || undefined;
		const liturgicalColour = (formData.get('liturgicalColour') as string) || undefined;

		let autoDay = liturgicalDay;
		let autoSeason = liturgicalSeason;
		let autoColour = liturgicalColour;

		if (!liturgicalDay || !liturgicalSeason || !liturgicalColour) {
			const info = getLiturgicalInfoForDate(date);
			if (!autoDay && info.liturgicalDay) autoDay = info.liturgicalDay;
			if (!autoSeason && info.season) autoSeason = info.season;
			if (!autoColour && info.colour) autoColour = info.colour;
		}

		const service = createService({
			serviceType,
			date,
			title: (formData.get('title') as string) || undefined,
			time: (formData.get('time') as string) || undefined,
			endTime: (formData.get('endTime') as string) || undefined,
			rite: (formData.get('rite') as string) || 'CW',
			location: (formData.get('location') as string) || 'Chapel',
			liturgicalDay: autoDay,
			liturgicalSeason: autoSeason,
			liturgicalColour: autoColour,
			visibility: (formData.get('visibility') as string) || 'college',
			notes: (formData.get('notes') as string) || undefined,
			blockId: blockIdStr ? parseInt(blockIdStr, 10) : undefined
		});

		redirect(303, `/services/${service.id}`);
	}
};
