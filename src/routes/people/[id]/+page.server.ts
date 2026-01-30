import { error, fail, redirect } from '@sveltejs/kit';
import { getPerson, updatePerson, deletePerson } from '$lib/server/services/people';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const id = parseInt(params.id, 10);
	const person = getPerson(id);

	if (!person) {
		error(404, 'Person not found');
	}

	return { person };
};

export const actions: Actions = {
	update: async ({ params, request }) => {
		const id = parseInt(params.id, 10);
		const formData = await request.formData();

		const firstName = formData.get('firstName') as string;
		const lastName = formData.get('lastName') as string;

		if (!firstName || !lastName) {
			return fail(400, { error: 'First name and last name are required.' });
		}

		updatePerson(id, {
			title: (formData.get('title') as string) || undefined,
			firstName,
			lastName,
			preferredName: (formData.get('preferredName') as string) || undefined,
			suffix: (formData.get('suffix') as string) || undefined,
			email: (formData.get('email') as string) || undefined,
			phone: (formData.get('phone') as string) || undefined,
			institution: (formData.get('institution') as string) || undefined,
			isCollegeMember: formData.get('isCollegeMember') === 'on',
			dietaryNeeds: (formData.get('dietaryNeeds') as string) || undefined,
			notes: (formData.get('notes') as string) || undefined
		});

		return { success: true };
	},

	delete: async ({ params }) => {
		const id = parseInt(params.id, 10);
		deletePerson(id);
		redirect(303, '/people');
	}
};
