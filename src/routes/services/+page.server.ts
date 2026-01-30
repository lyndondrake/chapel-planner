import { listServices } from '$lib/server/services/services';
import { listBlocks } from '$lib/server/services/blocks';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const from = url.searchParams.get('from') ?? undefined;
	const to = url.searchParams.get('to') ?? undefined;
	const blockId = url.searchParams.get('blockId');
	const serviceType = url.searchParams.get('serviceType') ?? undefined;

	const services = await listServices({
		from,
		to,
		blockId: blockId ? parseInt(blockId, 10) : undefined,
		serviceType
	});

	const blocks = listBlocks();

	return {
		services,
		blocks,
		filters: {
			from: from ?? '',
			to: to ?? '',
			blockId: blockId ?? '',
			serviceType: serviceType ?? ''
		}
	};
};
