import { eq, like, or } from 'drizzle-orm';
import { db, hymns } from '../db';

export type CreateHymnInput = {
	title: string;
	hymnalName?: string;
	hymnNumber?: string;
	author?: string;
	tune?: string;
	metre?: string;
};

export type UpdateHymnInput = Partial<CreateHymnInput>;

export function listHymns(search?: string) {
	let query = db.select().from(hymns);

	if (search) {
		const pattern = `%${search}%`;
		query = query.where(
			or(
				like(hymns.title, pattern),
				like(hymns.tune, pattern),
				like(hymns.hymnNumber, pattern),
				like(hymns.author, pattern)
			)
		) as typeof query;
	}

	return query.orderBy(hymns.hymnalName, hymns.title);
}

export function getHymn(id: number) {
	return db.select().from(hymns).where(eq(hymns.id, id)).get();
}

export function createHymn(input: CreateHymnInput) {
	return db
		.insert(hymns)
		.values({
			title: input.title,
			hymnalName: input.hymnalName ?? null,
			hymnNumber: input.hymnNumber ?? null,
			author: input.author ?? null,
			tune: input.tune ?? null,
			metre: input.metre ?? null
		})
		.returning()
		.get();
}

export function updateHymn(id: number, input: UpdateHymnInput) {
	return db
		.update(hymns)
		.set(input)
		.where(eq(hymns.id, id))
		.returning()
		.get();
}

export function deleteHymn(id: number) {
	return db.delete(hymns).where(eq(hymns.id, id)).run();
}
