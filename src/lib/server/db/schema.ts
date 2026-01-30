import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

const timestamps = {
	createdAt: text('created_at')
		.notNull()
		.default(sql`(datetime('now'))`),
	updatedAt: text('updated_at')
		.notNull()
		.default(sql`(datetime('now'))`)
};

// --- People ---

export const people = sqliteTable('people', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	title: text('title'),
	firstName: text('first_name').notNull(),
	lastName: text('last_name').notNull(),
	preferredName: text('preferred_name'),
	suffix: text('suffix'),
	email: text('email'),
	phone: text('phone'),
	institution: text('institution'),
	isCollegeMember: integer('is_college_member', { mode: 'boolean' }).default(false),
	dietaryNeeds: text('dietary_needs'),
	notes: text('notes'),
	...timestamps
});

// --- Service Blocks ---

export const serviceBlocks = sqliteTable('service_blocks', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	description: text('description'),
	termName: text('term_name'),
	seriesTitle: text('series_title'),
	seriesDescription: text('series_description'),
	startDate: text('start_date'),
	endDate: text('end_date'),
	...timestamps
});

// --- Services ---

export const services = sqliteTable('services', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	blockId: integer('block_id').references(() => serviceBlocks.id, { onDelete: 'set null' }),
	serviceType: text('service_type').notNull(),
	title: text('title'),
	date: text('date').notNull(),
	time: text('time'),
	endTime: text('end_time'),
	rite: text('rite').notNull().default('CW'),
	location: text('location').default('Chapel'),
	liturgicalDay: text('liturgical_day'),
	liturgicalSeason: text('liturgical_season'),
	liturgicalColour: text('liturgical_colour'),
	visibility: text('visibility').notNull().default('college'),
	seriesPosition: integer('series_position'),
	seriesTheme: text('series_theme'),
	notes: text('notes'),
	specialInstructions: text('special_instructions'),
	isConfirmed: integer('is_confirmed', { mode: 'boolean' }).default(false),
	...timestamps
});

// --- Service Roles ---

export const serviceRoles = sqliteTable('service_roles', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	serviceId: integer('service_id')
		.notNull()
		.references(() => services.id, { onDelete: 'cascade' }),
	personId: integer('person_id').references(() => people.id, { onDelete: 'set null' }),
	role: text('role').notNull(),
	roleLabel: text('role_label'),
	invitationStatus: text('invitation_status').notNull().default('possibility'),
	invitedAt: text('invited_at'),
	respondedAt: text('responded_at'),
	notes: text('notes')
});

// --- Hospitality ---

export const hospitality = sqliteTable('hospitality', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	serviceRoleId: integer('service_role_id')
		.notNull()
		.references(() => serviceRoles.id, { onDelete: 'cascade' }),
	accommodationStatus: text('accommodation_status').default('not_needed'),
	accommodationNotes: text('accommodation_notes'),
	accommodationDates: text('accommodation_dates'),
	mealStatus: text('meal_status').default('not_needed'),
	mealNotes: text('meal_notes'),
	mealDates: text('meal_dates'),
	parkingStatus: text('parking_status').default('not_needed'),
	parkingNotes: text('parking_notes'),
	parkingDates: text('parking_dates'),
	expensesStatus: text('expenses_status').default('not_needed'),
	expensesAmount: real('expenses_amount'),
	expensesNotes: text('expenses_notes'),
	expensesPaidAt: text('expenses_paid_at')
});

// --- Lectionary ---

export const lectionaryOccasions = sqliteTable('lectionary_occasions', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	slug: text('slug').unique(),
	season: text('season'),
	colour: text('colour'),
	isFixed: integer('is_fixed', { mode: 'boolean' }).default(false),
	fixedMonth: integer('fixed_month'),
	fixedDay: integer('fixed_day'),
	weekOfSeason: integer('week_of_season'),
	dayOfWeek: integer('day_of_week'),
	priority: integer('priority').default(0),
	collectCw: text('collect_cw'),
	collectBcp: text('collect_bcp'),
	postCommunionCw: text('post_communion_cw')
});

export const lectionaryReadings = sqliteTable('lectionary_readings', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	occasionId: integer('occasion_id')
		.notNull()
		.references(() => lectionaryOccasions.id, { onDelete: 'cascade' }),
	tradition: text('tradition').notNull(),
	serviceContext: text('service_context'),
	readingType: text('reading_type').notNull(),
	book: text('book'),
	chapter: text('chapter'),
	verseStart: text('verse_start'),
	verseEnd: text('verse_end'),
	reference: text('reference').notNull(),
	alternateYear: text('alternate_year'),
	isOptional: integer('is_optional', { mode: 'boolean' }).default(false),
	sortOrder: integer('sort_order').default(0)
});

export const lectionaryDateMap = sqliteTable('lectionary_date_map', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	date: text('date').notNull(),
	occasionId: integer('occasion_id')
		.notNull()
		.references(() => lectionaryOccasions.id, { onDelete: 'cascade' }),
	liturgicalYear: text('liturgical_year'),
	isPrincipal: integer('is_principal', { mode: 'boolean' }).default(true)
});

// --- Service Readings ---

export const serviceReadings = sqliteTable('service_readings', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	serviceId: integer('service_id')
		.notNull()
		.references(() => services.id, { onDelete: 'cascade' }),
	lectionaryReadingId: integer('lectionary_reading_id').references(
		() => lectionaryReadings.id,
		{ onDelete: 'set null' }
	),
	readingType: text('reading_type').notNull(),
	reference: text('reference').notNull(),
	isOverride: integer('is_override', { mode: 'boolean' }).default(false),
	readerId: integer('reader_id').references(() => people.id, { onDelete: 'set null' }),
	sortOrder: integer('sort_order').default(0),
	notes: text('notes')
});

// --- Hymns and Music ---

export const hymns = sqliteTable('hymns', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	title: text('title').notNull(),
	hymnalName: text('hymnal_name'),
	hymnNumber: text('hymn_number'),
	author: text('author'),
	tune: text('tune'),
	metre: text('metre')
});

export const serviceMusic = sqliteTable('service_music', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	serviceId: integer('service_id')
		.notNull()
		.references(() => services.id, { onDelete: 'cascade' }),
	musicType: text('music_type').notNull(),
	position: text('position'),
	hymnId: integer('hymn_id').references(() => hymns.id, { onDelete: 'set null' }),
	title: text('title'),
	composer: text('composer'),
	sortOrder: integer('sort_order').default(0)
});
