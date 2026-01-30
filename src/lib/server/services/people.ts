import { eq, like, or, desc } from 'drizzle-orm';
import { db, people } from '../db';

export type CreatePersonInput = {
	title?: string;
	firstName: string;
	lastName: string;
	preferredName?: string;
	suffix?: string;
	email?: string;
	phone?: string;
	institution?: string;
	isCollegeMember?: boolean;
	dietaryNeeds?: string;
	notes?: string;
};

export type UpdatePersonInput = Partial<CreatePersonInput>;

export function listPeople(search?: string, collegeMembersOnly?: boolean) {
	let query = db.select().from(people);

	if (collegeMembersOnly) {
		query = query.where(eq(people.isCollegeMember, true)) as typeof query;
	}

	if (search) {
		const pattern = `%${search}%`;
		query = query.where(
			or(
				like(people.firstName, pattern),
				like(people.lastName, pattern),
				like(people.email, pattern),
				like(people.institution, pattern)
			)
		) as typeof query;
	}

	return query.orderBy(people.lastName, people.firstName);
}

export function getPerson(id: number) {
	return db.select().from(people).where(eq(people.id, id)).get();
}

export function createPerson(input: CreatePersonInput) {
	return db
		.insert(people)
		.values({
			...input,
			isCollegeMember: input.isCollegeMember ?? false
		})
		.returning()
		.get();
}

export function updatePerson(id: number, input: UpdatePersonInput) {
	return db
		.update(people)
		.set({ ...input, updatedAt: new Date().toISOString() })
		.where(eq(people.id, id))
		.returning()
		.get();
}

export function deletePerson(id: number) {
	return db.delete(people).where(eq(people.id, id)).run();
}
