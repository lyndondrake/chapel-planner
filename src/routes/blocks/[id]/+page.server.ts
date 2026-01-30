import { error, fail, redirect } from '@sveltejs/kit';
import { getBlockWithServices, updateBlock, deleteBlock } from '$lib/server/services/blocks';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const id = parseInt(params.id, 10);
	const block = getBlockWithServices(id);

	if (!block) {
		error(404, 'Block not found');
	}

	return { block };
};

export const actions: Actions = {
	update: async ({ params, request }) => {
		const id = parseInt(params.id, 10);
		const formData = await request.formData();

		const name = formData.get('name') as string;
		if (!name) {
			return fail(400, { error: 'Block name is required.' });
		}

		updateBlock(id, {
			name,
			description: (formData.get('description') as string) || undefined,
			termName: (formData.get('termName') as string) || undefined,
			seriesTitle: (formData.get('seriesTitle') as string) || undefined,
			seriesDescription: (formData.get('seriesDescription') as string) || undefined,
			startDate: (formData.get('startDate') as string) || undefined,
			endDate: (formData.get('endDate') as string) || undefined
		});

		return { success: true };
	},

	delete: async ({ params }) => {
		const id = parseInt(params.id, 10);
		deleteBlock(id);
		redirect(303, '/blocks');
	}
};
