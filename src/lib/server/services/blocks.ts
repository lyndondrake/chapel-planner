import { eq } from 'drizzle-orm';
import { db, serviceBlocks, services } from '../db';

export type CreateBlockInput = {
	name: string;
	description?: string;
	termName?: string;
	seriesTitle?: string;
	seriesDescription?: string;
	startDate?: string;
	endDate?: string;
};

export type UpdateBlockInput = Partial<CreateBlockInput>;

export function listBlocks() {
	return db.select().from(serviceBlocks).orderBy(serviceBlocks.startDate);
}

export function getBlock(id: number) {
	return db.select().from(serviceBlocks).where(eq(serviceBlocks.id, id)).get();
}

export function getBlockWithServices(id: number) {
	const block = db.select().from(serviceBlocks).where(eq(serviceBlocks.id, id)).get();
	if (!block) return null;

	const blockServices = db
		.select()
		.from(services)
		.where(eq(services.blockId, id))
		.orderBy(services.date, services.time)
		.all();

	return { ...block, services: blockServices };
}

export function createBlock(input: CreateBlockInput) {
	return db.insert(serviceBlocks).values(input).returning().get();
}

export function updateBlock(id: number, input: UpdateBlockInput) {
	return db
		.update(serviceBlocks)
		.set({ ...input, updatedAt: new Date().toISOString() })
		.where(eq(serviceBlocks.id, id))
		.returning()
		.get();
}

export function deleteBlock(id: number) {
	return db.delete(serviceBlocks).where(eq(serviceBlocks.id, id)).run();
}
