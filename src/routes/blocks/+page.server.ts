import { listBlocks } from '$lib/server/services/blocks';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const blocks = await listBlocks();
	return { blocks };
};
