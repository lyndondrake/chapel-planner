import { json } from '@sveltejs/kit';
import { eq, and, gte, lte } from 'drizzle-orm';
import { db, services, serviceRoles, people } from '$lib/server/db';
import { ServiceTypeLabels } from '$lib/types/enums';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url }) => {
	const from = url.searchParams.get('from');
	const to = url.searchParams.get('to');
	const blockId = url.searchParams.get('blockId');
	const download = url.searchParams.get('download') === 'true';

	const conditions = [eq(services.visibility, 'college')];
	if (from) conditions.push(gte(services.date, from));
	if (to) conditions.push(lte(services.date, to));
	if (blockId) conditions.push(eq(services.blockId, parseInt(blockId, 10)));

	const serviceList = db
		.select()
		.from(services)
		.where(and(...conditions))
		.orderBy(services.date, services.time)
		.all();

	const termCard = serviceList.map((svc) => {
		// Get the preacher for this service
		const preacher = db
			.select({
				title: people.title,
				firstName: people.firstName,
				lastName: people.lastName,
				suffix: people.suffix,
				institution: people.institution
			})
			.from(serviceRoles)
			.leftJoin(people, eq(serviceRoles.personId, people.id))
			.where(
				and(
					eq(serviceRoles.serviceId, svc.id),
					eq(serviceRoles.role, 'preacher')
				)
			)
			.get();

		const preacherName = preacher
			? [preacher.title, preacher.firstName, preacher.lastName, preacher.suffix]
					.filter(Boolean)
					.join(' ')
			: null;

		return {
			date: svc.date,
			time: svc.time,
			endTime: svc.endTime,
			serviceType: svc.serviceType,
			serviceTypeLabel: ServiceTypeLabels[svc.serviceType as keyof typeof ServiceTypeLabels] ?? svc.serviceType,
			title: svc.title,
			rite: svc.rite,
			location: svc.location,
			liturgicalDay: svc.liturgicalDay,
			liturgicalSeason: svc.liturgicalSeason,
			liturgicalColour: svc.liturgicalColour,
			preacher: preacherName,
			preacherInstitution: preacher?.institution ?? null,
			isConfirmed: svc.isConfirmed
		};
	});

	const response = json(termCard);

	if (download) {
		response.headers.set('Content-Disposition', 'attachment; filename="term-card.json"');
	}

	return response;
};
