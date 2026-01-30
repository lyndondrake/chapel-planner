import { fail, redirect } from '@sveltejs/kit';
import { createBlock } from '$lib/server/services/blocks';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const name = formData.get('name') as string;

		if (!name) {
			return fail(400, { error: 'Block name is required.' });
		}

		const block = createBlock({
			name,
			description: (formData.get('description') as string) || undefined,
			termName: (formData.get('termName') as string) || undefined,
			seriesTitle: (formData.get('seriesTitle') as string) || undefined,
			seriesDescription: (formData.get('seriesDescription') as string) || undefined,
			startDate: (formData.get('startDate') as string) || undefined,
			endDate: (formData.get('endDate') as string) || undefined
		});

		redirect(303, `/blocks/${block.id}`);
	}
};
