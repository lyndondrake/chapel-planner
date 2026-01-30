import { error, fail, redirect } from '@sveltejs/kit';
import { getServiceWithRelations, updateService, deleteService } from '$lib/server/services/services';
import { listBlocks } from '$lib/server/services/blocks';
import { listPeople } from '$lib/server/services/people';
import { createRole, updateRole, updateInvitationStatus, deleteRole } from '$lib/server/services/roles';
import {
	createHospitality,
	updateHospitality,
	getHospitalityByRole
} from '$lib/server/services/hospitality';
import { getReadingsForDateAndContext, serviceTypeToContext } from '$lib/server/services/lectionary';
import {
	createServiceReading,
	updateServiceReading,
	deleteServiceReading
} from '$lib/server/services/readings';
import { listHymns } from '$lib/server/services/hymns';
import {
	createServiceMusic,
	updateServiceMusic,
	deleteServiceMusic
} from '$lib/server/services/music';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const id = parseInt(params.id, 10);
	const service = getServiceWithRelations(id);

	if (!service) {
		error(404, 'Service not found');
	}

	const blocks = await listBlocks();
	const people = await listPeople();

	// Get suggested lectionary readings for this service date, filtered by service context
	const tradition = service.rite === 'BCP' ? 'bcp' : 'cw';
	const context = serviceTypeToContext(service.serviceType);
	const { occasion, readings: suggestedReadings } = getReadingsForDateAndContext(
		service.date,
		tradition,
		context
	);

	const allHymns = await listHymns();

	return {
		service,
		blocks,
		people,
		lectionaryOccasion: occasion,
		suggestedReadings,
		hymns: allHymns
	};
};

export const actions: Actions = {
	update: async ({ params, request }) => {
		const id = parseInt(params.id, 10);
		const formData = await request.formData();

		const serviceType = formData.get('serviceType') as string;
		const date = formData.get('date') as string;

		if (!serviceType || !date) {
			return fail(400, { error: 'Service type and date are required.' });
		}

		const blockIdStr = formData.get('blockId') as string;

		updateService(id, {
			serviceType,
			date,
			title: (formData.get('title') as string) || undefined,
			time: (formData.get('time') as string) || undefined,
			endTime: (formData.get('endTime') as string) || undefined,
			rite: (formData.get('rite') as string) || 'CW',
			location: (formData.get('location') as string) || 'Chapel',
			liturgicalDay: (formData.get('liturgicalDay') as string) || undefined,
			liturgicalSeason: (formData.get('liturgicalSeason') as string) || undefined,
			liturgicalColour: (formData.get('liturgicalColour') as string) || undefined,
			visibility: (formData.get('visibility') as string) || 'college',
			notes: (formData.get('notes') as string) || undefined,
			specialInstructions: (formData.get('specialInstructions') as string) || undefined,
			isConfirmed: formData.get('isConfirmed') === 'on',
			isBaptism: formData.get('isBaptism') === 'on',
			isConfirmation: formData.get('isConfirmation') === 'on',
			isWedding: formData.get('isWedding') === 'on',
			isBlessing: formData.get('isBlessing') === 'on',
			blockId: blockIdStr ? parseInt(blockIdStr, 10) : null
		});

		return { success: true };
	},

	delete: async ({ params }) => {
		const id = parseInt(params.id, 10);
		deleteService(id);
		redirect(303, '/services');
	},

	addRole: async ({ params, request }) => {
		const serviceId = parseInt(params.id, 10);
		const formData = await request.formData();

		const role = formData.get('role') as string;
		if (!role) {
			return fail(400, { error: 'Role is required.' });
		}

		const personIdStr = formData.get('personId') as string;

		createRole({
			serviceId,
			personId: personIdStr ? parseInt(personIdStr, 10) : null,
			role,
			roleLabel: (formData.get('roleLabel') as string) || undefined,
			invitationStatus: (formData.get('invitationStatus') as string) || 'possibility',
			notes: (formData.get('notes') as string) || undefined
		});

		return { success: true, tab: 'roles' };
	},

	updateRole: async ({ request }) => {
		const formData = await request.formData();
		const roleId = parseInt(formData.get('roleId') as string, 10);

		if (!roleId) {
			return fail(400, { error: 'Role ID is required.' });
		}

		const personIdStr = formData.get('personId') as string;

		updateRole(roleId, {
			personId: personIdStr ? parseInt(personIdStr, 10) : null,
			role: (formData.get('role') as string) || undefined,
			roleLabel: (formData.get('roleLabel') as string) || undefined,
			notes: (formData.get('notes') as string) || undefined
		});

		return { success: true, tab: 'roles' };
	},

	updateStatus: async ({ request }) => {
		const formData = await request.formData();
		const roleId = parseInt(formData.get('roleId') as string, 10);
		const status = formData.get('status') as string;

		if (!roleId || !status) {
			return fail(400, { error: 'Role ID and status are required.' });
		}

		updateInvitationStatus(roleId, status);
		return { success: true, tab: 'roles' };
	},

	removeRole: async ({ request }) => {
		const formData = await request.formData();
		const roleId = parseInt(formData.get('roleId') as string, 10);

		if (!roleId) {
			return fail(400, { error: 'Role ID is required.' });
		}

		deleteRole(roleId);
		return { success: true, tab: 'roles' };
	},

	saveHospitality: async ({ request }) => {
		const formData = await request.formData();
		const roleId = parseInt(formData.get('roleId') as string, 10);

		if (!roleId) {
			return fail(400, { error: 'Role ID is required.' });
		}

		const existing = getHospitalityByRole(roleId);
		const data = {
			accommodationStatus: (formData.get('accommodationStatus') as string) || 'not_needed',
			accommodationNotes: (formData.get('accommodationNotes') as string) || undefined,
			accommodationDates: (formData.get('accommodationDates') as string) || undefined,
			mealStatus: (formData.get('mealStatus') as string) || 'not_needed',
			mealNotes: (formData.get('mealNotes') as string) || undefined,
			mealDates: (formData.get('mealDates') as string) || undefined,
			parkingStatus: (formData.get('parkingStatus') as string) || 'not_needed',
			parkingNotes: (formData.get('parkingNotes') as string) || undefined,
			parkingDates: (formData.get('parkingDates') as string) || undefined,
			expensesStatus: (formData.get('expensesStatus') as string) || 'not_needed',
			expensesAmount: formData.get('expensesAmount')
				? parseFloat(formData.get('expensesAmount') as string)
				: undefined,
			expensesNotes: (formData.get('expensesNotes') as string) || undefined,
			expensesPaidAt: (formData.get('expensesPaidAt') as string) || undefined
		};

		if (existing) {
			updateHospitality(existing.id, data);
		} else {
			createHospitality({ serviceRoleId: roleId, ...data });
		}

		return { success: true, tab: 'hospitality' };
	},

	addReading: async ({ params, request }) => {
		const serviceId = parseInt(params.id, 10);
		const formData = await request.formData();

		const readingType = formData.get('readingType') as string;
		const reference = formData.get('reference') as string;

		if (!readingType || !reference) {
			return fail(400, { error: 'Reading type and reference are required.' });
		}

		const lectionaryReadingIdStr = formData.get('lectionaryReadingId') as string;
		const readerIdStr = formData.get('readerId') as string;
		const sortOrderStr = formData.get('sortOrder') as string;

		createServiceReading({
			serviceId,
			readingType,
			reference,
			lectionaryReadingId: lectionaryReadingIdStr ? parseInt(lectionaryReadingIdStr, 10) : null,
			readerId: readerIdStr ? parseInt(readerIdStr, 10) : null,
			sortOrder: sortOrderStr ? parseInt(sortOrderStr, 10) : 0,
			isOverride: formData.get('isOverride') === 'on',
			notes: (formData.get('notes') as string) || undefined
		});

		return { success: true, tab: 'readings' };
	},

	acceptSuggested: async ({ params, request }) => {
		const serviceId = parseInt(params.id, 10);
		const formData = await request.formData();

		// Accept all suggested readings at once
		const readingIds = formData.getAll('readingId') as string[];
		const readingTypes = formData.getAll('readingType') as string[];
		const references = formData.getAll('reference') as string[];

		for (let i = 0; i < references.length; i++) {
			createServiceReading({
				serviceId,
				readingType: readingTypes[i],
				reference: references[i],
				lectionaryReadingId: readingIds[i] ? parseInt(readingIds[i], 10) : null,
				sortOrder: i + 1,
				isOverride: false
			});
		}

		return { success: true, tab: 'readings' };
	},

	updateReading: async ({ request }) => {
		const formData = await request.formData();
		const readingId = parseInt(formData.get('readingId') as string, 10);

		if (!readingId) {
			return fail(400, { error: 'Reading ID is required.' });
		}

		const readerIdStr = formData.get('readerId') as string;

		updateServiceReading(readingId, {
			readingType: (formData.get('readingType') as string) || undefined,
			reference: (formData.get('reference') as string) || undefined,
			readerId: readerIdStr ? parseInt(readerIdStr, 10) : null,
			notes: (formData.get('notes') as string) || undefined
		});

		return { success: true, tab: 'readings' };
	},

	removeReading: async ({ request }) => {
		const formData = await request.formData();
		const readingId = parseInt(formData.get('readingId') as string, 10);

		if (!readingId) {
			return fail(400, { error: 'Reading ID is required.' });
		}

		deleteServiceReading(readingId);
		return { success: true, tab: 'readings' };
	},

	addMusic: async ({ params, request }) => {
		const serviceId = parseInt(params.id, 10);
		const formData = await request.formData();

		const musicType = formData.get('musicType') as string;
		if (!musicType) {
			return fail(400, { error: 'Music type is required.' });
		}

		const hymnIdStr = formData.get('hymnId') as string;
		const sortOrderStr = formData.get('sortOrder') as string;

		createServiceMusic({
			serviceId,
			musicType,
			position: (formData.get('position') as string) || undefined,
			hymnId: hymnIdStr ? parseInt(hymnIdStr, 10) : null,
			title: (formData.get('title') as string) || undefined,
			composer: (formData.get('composer') as string) || undefined,
			sortOrder: sortOrderStr ? parseInt(sortOrderStr, 10) : 0
		});

		return { success: true, tab: 'music' };
	},

	updateMusic: async ({ request }) => {
		const formData = await request.formData();
		const musicId = parseInt(formData.get('musicId') as string, 10);

		if (!musicId) {
			return fail(400, { error: 'Music ID is required.' });
		}

		const hymnIdStr = formData.get('hymnId') as string;

		updateServiceMusic(musicId, {
			musicType: (formData.get('musicType') as string) || undefined,
			position: (formData.get('position') as string) || undefined,
			hymnId: hymnIdStr ? parseInt(hymnIdStr, 10) : null,
			title: (formData.get('title') as string) || undefined,
			composer: (formData.get('composer') as string) || undefined
		});

		return { success: true, tab: 'music' };
	},

	removeMusic: async ({ request }) => {
		const formData = await request.formData();
		const musicId = parseInt(formData.get('musicId') as string, 10);

		if (!musicId) {
			return fail(400, { error: 'Music ID is required.' });
		}

		deleteServiceMusic(musicId);
		return { success: true, tab: 'music' };
	}
};
