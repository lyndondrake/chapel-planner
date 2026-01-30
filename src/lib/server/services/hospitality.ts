import { eq } from 'drizzle-orm';
import { db, hospitality } from '../db';

export type CreateHospitalityInput = {
	serviceRoleId: number;
	accommodationStatus?: string;
	accommodationNotes?: string;
	accommodationDates?: string;
	mealStatus?: string;
	mealNotes?: string;
	mealDates?: string;
	parkingStatus?: string;
	parkingNotes?: string;
	parkingDates?: string;
	expensesStatus?: string;
	expensesAmount?: number;
	expensesNotes?: string;
	expensesPaidAt?: string;
};

export type UpdateHospitalityInput = Partial<Omit<CreateHospitalityInput, 'serviceRoleId'>>;

export function getHospitalityByRole(serviceRoleId: number) {
	return db
		.select()
		.from(hospitality)
		.where(eq(hospitality.serviceRoleId, serviceRoleId))
		.get();
}

export function getHospitalityByRoles(serviceRoleIds: number[]) {
	if (serviceRoleIds.length === 0) return [];
	return db
		.select()
		.from(hospitality)
		.all()
		.filter((h) => serviceRoleIds.includes(h.serviceRoleId));
}

export function createHospitality(input: CreateHospitalityInput) {
	return db
		.insert(hospitality)
		.values({
			serviceRoleId: input.serviceRoleId,
			accommodationStatus: input.accommodationStatus ?? 'not_needed',
			accommodationNotes: input.accommodationNotes ?? null,
			accommodationDates: input.accommodationDates ?? null,
			mealStatus: input.mealStatus ?? 'not_needed',
			mealNotes: input.mealNotes ?? null,
			mealDates: input.mealDates ?? null,
			parkingStatus: input.parkingStatus ?? 'not_needed',
			parkingNotes: input.parkingNotes ?? null,
			parkingDates: input.parkingDates ?? null,
			expensesStatus: input.expensesStatus ?? 'not_needed',
			expensesAmount: input.expensesAmount ?? null,
			expensesNotes: input.expensesNotes ?? null,
			expensesPaidAt: input.expensesPaidAt ?? null
		})
		.returning()
		.get();
}

export function updateHospitality(id: number, input: UpdateHospitalityInput) {
	return db
		.update(hospitality)
		.set(input)
		.where(eq(hospitality.id, id))
		.returning()
		.get();
}

export function deleteHospitality(id: number) {
	return db.delete(hospitality).where(eq(hospitality.id, id)).run();
}
