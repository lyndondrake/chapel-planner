/**
 * Export utilities for generating JSON data structures
 * suitable for consumption by the Typst typesetting application.
 */

import { db } from '$lib/server/db';
import { services, serviceRoles, serviceReadings, serviceMusic, people, hospitality, hymns } from '$lib/server/db/schema';
import { eq, gte, lte, and } from 'drizzle-orm';

export interface ExportOptions {
	from?: string;
	to?: string;
	blockId?: number;
	publicOnly?: boolean;
}

export function exportServices(opts: ExportOptions) {
	const conditions = [];
	if (opts.from) conditions.push(gte(services.date, opts.from));
	if (opts.to) conditions.push(lte(services.date, opts.to));
	if (opts.blockId) conditions.push(eq(services.blockId, opts.blockId));
	if (opts.publicOnly) conditions.push(eq(services.visibility, 'college'));

	let query = db.select().from(services);
	if (conditions.length > 0) {
		query = query.where(and(...conditions)) as typeof query;
	}

	const serviceList = query.orderBy(services.date, services.time).all();

	return serviceList.map((service) => {
		const roles = db
			.select()
			.from(serviceRoles)
			.where(eq(serviceRoles.serviceId, service.id))
			.all()
			.map((role) => {
				const person = role.personId
					? db.select().from(people).where(eq(people.id, role.personId)).get()
					: null;

				const hospitalityRecord = db
					.select()
					.from(hospitality)
					.where(eq(hospitality.serviceRoleId, role.id))
					.get();

				return {
					...role,
					person,
					hospitality: hospitalityRecord ?? null
				};
			});

		const readings = db
			.select()
			.from(serviceReadings)
			.where(eq(serviceReadings.serviceId, service.id))
			.orderBy(serviceReadings.sortOrder)
			.all();

		const music = db
			.select()
			.from(serviceMusic)
			.where(eq(serviceMusic.serviceId, service.id))
			.orderBy(serviceMusic.sortOrder)
			.all()
			.map((item) => {
				const hymn = item.hymnId
					? db.select().from(hymns).where(eq(hymns.id, item.hymnId)).get()
					: null;
				return { ...item, hymn };
			});

		return {
			...service,
			roles,
			readings,
			music
		};
	});
}
