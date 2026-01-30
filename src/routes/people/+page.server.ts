import { listPeople } from '$lib/server/services/people';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const search = url.searchParams.get('search') ?? undefined;
	const collegeMembersOnly = url.searchParams.get('collegeMembersOnly') === 'true';
	const people = await listPeople(search, collegeMembersOnly || undefined);
	return { people, search: search ?? '', collegeMembersOnly };
};
