import { listServices } from '$lib/server/services/services';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const now = new Date();
	const yearParam = url.searchParams.get('year');
	const monthParam = url.searchParams.get('month');

	const year = yearParam ? parseInt(yearParam, 10) : now.getFullYear();
	const month = monthParam ? parseInt(monthParam, 10) : now.getMonth() + 1;

	// Get first and last day of month
	const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
	const lastDay = new Date(year, month, 0);
	const lastDayStr = `${year}-${String(month).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;

	const services = await listServices({ from: firstDay, to: lastDayStr });

	return {
		year,
		month,
		services
	};
};
