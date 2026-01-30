import { json } from '@sveltejs/kit';
import { listBlocks } from '$lib/server/services/blocks';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => {
	const blocks = listBlocks();
	return json(blocks);
};
