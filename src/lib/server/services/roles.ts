import { eq } from 'drizzle-orm';
import { db, serviceRoles, people } from '../db';

export type CreateRoleInput = {
	serviceId: number;
	personId?: number | null;
	role: string;
	roleLabel?: string;
	invitationStatus?: string;
	notes?: string;
};

export type UpdateRoleInput = {
	personId?: number | null;
	role?: string;
	roleLabel?: string;
	invitationStatus?: string;
	invitedAt?: string | null;
	respondedAt?: string | null;
	notes?: string;
};

export function listRolesByService(serviceId: number) {
	return db
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
		.where(eq(serviceRoles.serviceId, serviceId))
		.all();
}

export function getRole(id: number) {
	return db.select().from(serviceRoles).where(eq(serviceRoles.id, id)).get();
}

export function createRole(input: CreateRoleInput) {
	return db
		.insert(serviceRoles)
		.values({
			serviceId: input.serviceId,
			personId: input.personId ?? null,
			role: input.role,
			roleLabel: input.roleLabel ?? null,
			invitationStatus: input.invitationStatus ?? 'possibility',
			notes: input.notes ?? null
		})
		.returning()
		.get();
}

export function updateRole(id: number, input: UpdateRoleInput) {
	return db
		.update(serviceRoles)
		.set(input)
		.where(eq(serviceRoles.id, id))
		.returning()
		.get();
}

export function updateInvitationStatus(id: number, status: string) {
	const now = new Date().toISOString();
	const updates: Record<string, string | null> = { invitationStatus: status };

	if (status === 'requested') {
		updates.invitedAt = now;
	} else if (status === 'accepted' || status === 'declined') {
		updates.respondedAt = now;
	}

	return db
		.update(serviceRoles)
		.set(updates)
		.where(eq(serviceRoles.id, id))
		.returning()
		.get();
}

export function deleteRole(id: number) {
	return db.delete(serviceRoles).where(eq(serviceRoles.id, id)).run();
}
