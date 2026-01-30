import { eq, desc, gte, lte, and } from 'drizzle-orm';
import { db, services, serviceRoles, serviceReadings, serviceMusic, people, hospitality, hymns } from '../db';

export type CreateServiceInput = {
	blockId?: number | null;
	serviceType: string;
	title?: string;
	date: string;
	time?: string;
	endTime?: string;
	rite?: string;
	location?: string;
	liturgicalDay?: string;
	liturgicalSeason?: string;
	liturgicalColour?: string;
	visibility?: string;
	seriesPosition?: number;
	seriesTheme?: string;
	notes?: string;
	specialInstructions?: string;
	isConfirmed?: boolean;
	isBaptism?: boolean;
	isConfirmation?: boolean;
	isWedding?: boolean;
	isBlessing?: boolean;
};

export type UpdateServiceInput = Partial<CreateServiceInput>;

export function listServices(opts?: { from?: string; to?: string; blockId?: number; serviceType?: string }) {
	let query = db.select().from(services);

	const conditions = [];
	if (opts?.from) conditions.push(gte(services.date, opts.from));
	if (opts?.to) conditions.push(lte(services.date, opts.to));
	if (opts?.blockId) conditions.push(eq(services.blockId, opts.blockId));
	if (opts?.serviceType) conditions.push(eq(services.serviceType, opts.serviceType));

	if (conditions.length > 0) {
		query = query.where(and(...conditions)) as typeof query;
	}

	return query.orderBy(services.date, services.time);
}

export function getService(id: number) {
	return db.select().from(services).where(eq(services.id, id)).get();
}

export function getServiceWithRelations(id: number) {
	const service = db.select().from(services).where(eq(services.id, id)).get();
	if (!service) return null;

	const rolesWithPeople = db
		.select({
			id: serviceRoles.id,
			serviceId: serviceRoles.serviceId,
			personId: serviceRoles.personId,
			role: serviceRoles.role,
			roleLabel: serviceRoles.roleLabel,
			invitationStatus: serviceRoles.invitationStatus,
			invitedAt: serviceRoles.invitedAt,
			respondedAt: serviceRoles.respondedAt,
			notes: serviceRoles.notes,
			personFirstName: people.firstName,
			personLastName: people.lastName,
			personTitle: people.title,
			personEmail: people.email,
			personIsCollegeMember: people.isCollegeMember
		})
		.from(serviceRoles)
		.leftJoin(people, eq(serviceRoles.personId, people.id))
		.where(eq(serviceRoles.serviceId, id))
		.all();

	const roleIds = rolesWithPeople.map((r) => r.id);
	const hospitalityRecords =
		roleIds.length > 0
			? db
					.select()
					.from(hospitality)
					.all()
					.filter((h) => roleIds.includes(h.serviceRoleId))
			: [];

	const roles = rolesWithPeople.map((r) => ({
		...r,
		hospitality: hospitalityRecords.find((h) => h.serviceRoleId === r.id) ?? null
	}));

	const readings = db
		.select({
			id: serviceReadings.id,
			serviceId: serviceReadings.serviceId,
			lectionaryReadingId: serviceReadings.lectionaryReadingId,
			readingType: serviceReadings.readingType,
			reference: serviceReadings.reference,
			isOverride: serviceReadings.isOverride,
			readerId: serviceReadings.readerId,
			sortOrder: serviceReadings.sortOrder,
			notes: serviceReadings.notes,
			readerFirstName: people.firstName,
			readerLastName: people.lastName,
			readerTitle: people.title
		})
		.from(serviceReadings)
		.leftJoin(people, eq(serviceReadings.readerId, people.id))
		.where(eq(serviceReadings.serviceId, id))
		.orderBy(serviceReadings.sortOrder)
		.all();
	const music = db
		.select({
			id: serviceMusic.id,
			serviceId: serviceMusic.serviceId,
			musicType: serviceMusic.musicType,
			position: serviceMusic.position,
			hymnId: serviceMusic.hymnId,
			title: serviceMusic.title,
			composer: serviceMusic.composer,
			sortOrder: serviceMusic.sortOrder,
			hymnTitle: hymns.title,
			hymnNumber: hymns.hymnNumber,
			hymnalName: hymns.hymnalName,
			tune: hymns.tune
		})
		.from(serviceMusic)
		.leftJoin(hymns, eq(serviceMusic.hymnId, hymns.id))
		.where(eq(serviceMusic.serviceId, id))
		.orderBy(serviceMusic.sortOrder)
		.all();

	return { ...service, roles, readings, music };
}

export function createService(input: CreateServiceInput) {
	return db
		.insert(services)
		.values({
			...input,
			rite: input.rite ?? 'CW',
			location: input.location ?? 'Chapel',
			visibility: input.visibility ?? 'college',
			isConfirmed: input.isConfirmed ?? false,
			isBaptism: input.isBaptism ?? false,
			isConfirmation: input.isConfirmation ?? false,
			isWedding: input.isWedding ?? false,
			isBlessing: input.isBlessing ?? false
		})
		.returning()
		.get();
}

export function updateService(id: number, input: UpdateServiceInput) {
	return db
		.update(services)
		.set({ ...input, updatedAt: new Date().toISOString() })
		.where(eq(services.id, id))
		.returning()
		.get();
}

export function deleteService(id: number) {
	return db.delete(services).where(eq(services.id, id)).run();
}
