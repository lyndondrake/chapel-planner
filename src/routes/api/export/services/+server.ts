import { json } from '@sveltejs/kit';
import { exportServices } from '$lib/utils/export';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url }) => {
	const from = url.searchParams.get('from') ?? undefined;
	const to = url.searchParams.get('to') ?? undefined;
	const blockIdStr = url.searchParams.get('blockId');
	const blockId = blockIdStr ? parseInt(blockIdStr, 10) : undefined;
	const publicOnly = url.searchParams.get('publicOnly') === 'true';
	const download = url.searchParams.get('download') === 'true';

	const data = exportServices({ from, to, blockId, publicOnly });

	const response = json(data);

	if (download) {
		response.headers.set('Content-Disposition', 'attachment; filename="services-export.json"');
	}

	return response;
};
