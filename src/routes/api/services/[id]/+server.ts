import { json } from '@sveltejs/kit';
import {
	getServiceWithRelations,
	updateService,
	deleteService
} from '$lib/server/services/services';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ params }) => {
	const id = parseInt(params.id, 10);
	const service = getServiceWithRelations(id);

	if (!service) {
		return json({ error: 'Service not found.' }, { status: 404 });
	}

	return json(service);
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const id = parseInt(params.id, 10);
	const body = await request.json();

	const updated = updateService(id, body);
	if (!updated) {
		return json({ error: 'Service not found.' }, { status: 404 });
	}

	return json(updated);
};

export const DELETE: RequestHandler = ({ params }) => {
	const id = parseInt(params.id, 10);
	deleteService(id);
	return json({ success: true });
};
