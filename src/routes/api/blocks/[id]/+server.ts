import { json } from '@sveltejs/kit';
import { getBlockWithServices } from '$lib/server/services/blocks';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ params }) => {
	const id = parseInt(params.id, 10);
	const block = getBlockWithServices(id);

	if (!block) {
		return json({ error: 'Block not found.' }, { status: 404 });
	}

	return json(block);
};
