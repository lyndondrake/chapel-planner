import { eq } from 'drizzle-orm';
import { db, serviceMusic, hymns } from '../db';

export type CreateServiceMusicInput = {
	serviceId: number;
	musicType: string;
	position?: string;
	hymnId?: number | null;
	title?: string;
	composer?: string;
	sortOrder?: number;
};

export type UpdateServiceMusicInput = Partial<Omit<CreateServiceMusicInput, 'serviceId'>>;

export function listMusicByService(serviceId: number) {
	return db
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
		.where(eq(serviceMusic.serviceId, serviceId))
		.orderBy(serviceMusic.sortOrder)
		.all();
}

export function createServiceMusic(input: CreateServiceMusicInput) {
	return db
		.insert(serviceMusic)
		.values({
			serviceId: input.serviceId,
			musicType: input.musicType,
			position: input.position ?? null,
			hymnId: input.hymnId ?? null,
			title: input.title ?? null,
			composer: input.composer ?? null,
			sortOrder: input.sortOrder ?? 0
		})
		.returning()
		.get();
}

export function updateServiceMusic(id: number, input: UpdateServiceMusicInput) {
	return db
		.update(serviceMusic)
		.set(input)
		.where(eq(serviceMusic.id, id))
		.returning()
		.get();
}

export function deleteServiceMusic(id: number) {
	return db.delete(serviceMusic).where(eq(serviceMusic.id, id)).run();
}
