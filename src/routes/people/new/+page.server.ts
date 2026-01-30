import { fail, redirect } from '@sveltejs/kit';
import { createPerson } from '$lib/server/services/people';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const firstName = formData.get('firstName') as string;
		const lastName = formData.get('lastName') as string;

		if (!firstName || !lastName) {
			return fail(400, { error: 'First name and last name are required.' });
		}

		const person = createPerson({
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

		redirect(303, `/people/${person.id}`);
	}
};
