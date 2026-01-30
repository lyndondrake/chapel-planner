import { json } from '@sveltejs/kit';
import { listServices, createService } from '$lib/server/services/services';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url }) => {
	const from = url.searchParams.get('from') ?? undefined;
	const to = url.searchParams.get('to') ?? undefined;
	const blockIdStr = url.searchParams.get('blockId');
	const blockId = blockIdStr ? parseInt(blockIdStr, 10) : undefined;

	const services = listServices({ from, to, blockId });
	return json(services);
};

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();

	if (!body.serviceType || !body.date) {
		return json({ error: 'serviceType and date are required.' }, { status: 400 });
	}

	const service = createService({
		blockId: body.blockId ?? undefined,
		serviceType: body.serviceType,
		title: body.title,
		date: body.date,
		time: body.time,
		endTime: body.endTime,
		rite: body.rite,
		location: body.location,
		liturgicalDay: body.liturgicalDay,
		liturgicalSeason: body.liturgicalSeason,
		liturgicalColour: body.liturgicalColour,
		visibility: body.visibility,
		seriesPosition: body.seriesPosition,
		seriesTheme: body.seriesTheme,
		notes: body.notes,
		specialInstructions: body.specialInstructions,
		isConfirmed: body.isConfirmed
	});

	return json(service, { status: 201 });
};
