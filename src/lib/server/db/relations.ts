import { relations } from 'drizzle-orm';
import {
	people,
	serviceBlocks,
	services,
	serviceRoles,
	hospitality,
	lectionaryOccasions,
	lectionaryReadings,
	lectionaryDateMap,
	serviceReadings,
	hymns,
	serviceMusic
} from './schema';

export const peopleRelations = relations(people, ({ many }) => ({
	serviceRoles: many(serviceRoles),
	serviceReadings: many(serviceReadings)
}));

export const serviceBlocksRelations = relations(serviceBlocks, ({ many }) => ({
	services: many(services)
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
	block: one(serviceBlocks, {
		fields: [services.blockId],
		references: [serviceBlocks.id]
	}),
	roles: many(serviceRoles),
	readings: many(serviceReadings),
	music: many(serviceMusic)
}));

export const serviceRolesRelations = relations(serviceRoles, ({ one, many }) => ({
	service: one(services, {
		fields: [serviceRoles.serviceId],
		references: [services.id]
	}),
	person: one(people, {
		fields: [serviceRoles.personId],
		references: [people.id]
	}),
	hospitality: many(hospitality)
}));

export const hospitalityRelations = relations(hospitality, ({ one }) => ({
	serviceRole: one(serviceRoles, {
		fields: [hospitality.serviceRoleId],
		references: [serviceRoles.id]
	})
}));

export const lectionaryOccasionsRelations = relations(lectionaryOccasions, ({ many }) => ({
	readings: many(lectionaryReadings),
	dateMap: many(lectionaryDateMap)
}));

export const lectionaryReadingsRelations = relations(lectionaryReadings, ({ one }) => ({
	occasion: one(lectionaryOccasions, {
		fields: [lectionaryReadings.occasionId],
		references: [lectionaryOccasions.id]
	})
}));

export const lectionaryDateMapRelations = relations(lectionaryDateMap, ({ one }) => ({
	occasion: one(lectionaryOccasions, {
		fields: [lectionaryDateMap.occasionId],
		references: [lectionaryOccasions.id]
	})
}));

export const serviceReadingsRelations = relations(serviceReadings, ({ one }) => ({
	service: one(services, {
		fields: [serviceReadings.serviceId],
		references: [services.id]
	}),
	lectionaryReading: one(lectionaryReadings, {
		fields: [serviceReadings.lectionaryReadingId],
		references: [lectionaryReadings.id]
	}),
	reader: one(people, {
		fields: [serviceReadings.readerId],
		references: [people.id]
	})
}));

export const hymnsRelations = relations(hymns, ({ many }) => ({
	serviceMusic: many(serviceMusic)
}));

export const serviceMusicRelations = relations(serviceMusic, ({ one }) => ({
	service: one(services, {
		fields: [serviceMusic.serviceId],
		references: [services.id]
	}),
	hymn: one(hymns, {
		fields: [serviceMusic.hymnId],
		references: [hymns.id]
	})
}));
