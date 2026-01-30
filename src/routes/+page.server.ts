import { listServices } from '$lib/server/services/services';
import { listBlocks } from '$lib/server/services/blocks';
import { listPeople } from '$lib/server/services/people';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const today = new Date().toISOString().split('T')[0];
	const upcomingServices = await listServices({ from: today });
	const blocks = await listBlocks();
	const people = await listPeople();

	return {
		upcomingServices: upcomingServices.slice(0, 10),
		totalServices: upcomingServices.length,
		totalBlocks: blocks.length,
		totalPeople: people.length
	};
};
