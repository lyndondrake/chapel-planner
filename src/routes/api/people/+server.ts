import { json } from '@sveltejs/kit';
import { listPeople } from '$lib/server/services/people';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url }) => {
	const search = url.searchParams.get('search') ?? undefined;
	const collegeMembersOnly = url.searchParams.get('collegeMembersOnly') === 'true';

	const people = listPeople(search, collegeMembersOnly || undefined);
	return json(people);
};
