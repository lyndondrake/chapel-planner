import { eq } from 'drizzle-orm';
import { db, serviceReadings, people } from '../db';

export type CreateServiceReadingInput = {
	serviceId: number;
	lectionaryReadingId?: number | null;
	readingType: string;
	reference: string;
	isOverride?: boolean;
	readerId?: number | null;
	sortOrder?: number;
	notes?: string;
};

export type UpdateServiceReadingInput = Partial<Omit<CreateServiceReadingInput, 'serviceId'>>;

export function listReadingsByService(serviceId: number) {
	return db
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
		.where(eq(serviceReadings.serviceId, serviceId))
		.orderBy(serviceReadings.sortOrder)
		.all();
}

export function createServiceReading(input: CreateServiceReadingInput) {
	return db
		.insert(serviceReadings)
		.values({
			serviceId: input.serviceId,
			lectionaryReadingId: input.lectionaryReadingId ?? null,
			readingType: input.readingType,
			reference: input.reference,
			isOverride: input.isOverride ?? false,
			readerId: input.readerId ?? null,
			sortOrder: input.sortOrder ?? 0,
			notes: input.notes ?? null
		})
		.returning()
		.get();
}

export function updateServiceReading(id: number, input: UpdateServiceReadingInput) {
	return db
		.update(serviceReadings)
		.set(input)
		.where(eq(serviceReadings.id, id))
		.returning()
		.get();
}

export function deleteServiceReading(id: number) {
	return db.delete(serviceReadings).where(eq(serviceReadings.id, id)).run();
}

export function deleteReadingsByService(serviceId: number) {
	return db.delete(serviceReadings).where(eq(serviceReadings.serviceId, serviceId)).run();
}
