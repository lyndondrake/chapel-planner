import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { resolve } from 'path';
import { mkdirSync } from 'fs';
import * as schema from '../src/lib/server/db/schema';

const DB_PATH = resolve('data/chapel-planner.db');

// Ensure data directory exists
mkdirSync(resolve('data'), { recursive: true });

const sqlite = new Database(DB_PATH);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

const db = drizzle(sqlite, { schema });

console.log('Seeding sample data...');

// Create some people
const people = [
	{
		title: 'The Revd Dr',
		firstName: 'James',
		lastName: 'Atkinson',
		email: 'j.atkinson@example.ac.uk',
		institution: 'St John\'s College',
		isCollegeMember: true
	},
	{
		title: 'The Revd Canon',
		firstName: 'Sarah',
		lastName: 'Brightwell',
		email: 's.brightwell@example.ac.uk',
		institution: 'Christ Church',
		isCollegeMember: false
	},
	{
		title: 'Prof',
		firstName: 'David',
		lastName: 'Chen',
		preferredName: 'Dave',
		email: 'd.chen@example.ac.uk',
		institution: 'Faculty of Theology',
		isCollegeMember: true
	},
	{
		title: 'The Rt Revd',
		firstName: 'Eleanor',
		lastName: 'Fanshawe',
		suffix: 'DD',
		email: 'e.fanshawe@example.org',
		institution: 'Diocese of Oxford',
		isCollegeMember: false,
		dietaryNeeds: 'Vegetarian'
	},
	{
		firstName: 'Matthew',
		lastName: 'Greene',
		email: 'm.greene@example.ac.uk',
		institution: 'St John\'s College',
		isCollegeMember: true
	}
];

for (const person of people) {
	db.insert(schema.people).values(person).run();
}
console.log(`  Created ${people.length} people`);

// Create service blocks
const blocks = [
	{
		name: 'Michaelmas 2025 Evensongs',
		termName: 'Michaelmas 2025',
		seriesTitle: 'Faith in the Public Square',
		seriesDescription: 'A series exploring the intersection of Christian faith and public life.',
		startDate: '2025-10-12',
		endDate: '2025-12-07'
	},
	{
		name: 'Michaelmas 2025 Complines',
		termName: 'Michaelmas 2025',
		startDate: '2025-10-09',
		endDate: '2025-12-04'
	}
];

for (const block of blocks) {
	db.insert(schema.serviceBlocks).values(block).run();
}
console.log(`  Created ${blocks.length} service blocks`);

// Create services
const services = [
	{
		blockId: 1,
		serviceType: 'sunday_evensong',
		date: '2025-10-12',
		time: '18:00',
		endTime: '19:00',
		rite: 'CW',
		liturgicalDay: 'Nineteenth Sunday after Trinity',
		liturgicalSeason: 'ordinary_time',
		liturgicalColour: 'green',
		seriesPosition: 1,
		seriesTheme: 'The Calling of Public Service',
		isConfirmed: true
	},
	{
		blockId: 1,
		serviceType: 'sunday_evensong',
		date: '2025-10-19',
		time: '18:00',
		endTime: '19:00',
		rite: 'CW',
		liturgicalDay: 'Twentieth Sunday after Trinity',
		liturgicalSeason: 'ordinary_time',
		liturgicalColour: 'green',
		seriesPosition: 2,
		seriesTheme: 'Justice and Mercy'
	},
	{
		blockId: 1,
		serviceType: 'sunday_evensong',
		date: '2025-10-26',
		time: '18:00',
		endTime: '19:00',
		rite: 'BCP',
		title: 'Bible Sunday Evensong',
		liturgicalDay: 'Bible Sunday',
		liturgicalSeason: 'ordinary_time',
		liturgicalColour: 'green',
		seriesPosition: 3,
		seriesTheme: 'Scripture and Society'
	},
	{
		blockId: 2,
		serviceType: 'thursday_compline',
		date: '2025-10-09',
		time: '21:30',
		endTime: '22:00',
		rite: 'CW',
		liturgicalSeason: 'ordinary_time',
		liturgicalColour: 'green'
	},
	{
		blockId: 2,
		serviceType: 'thursday_compline',
		date: '2025-10-16',
		time: '21:30',
		endTime: '22:00',
		rite: 'CW',
		liturgicalSeason: 'ordinary_time',
		liturgicalColour: 'green'
	},
	{
		serviceType: 'choral_eucharist',
		date: '2025-10-12',
		time: '10:00',
		endTime: '11:00',
		rite: 'CW',
		liturgicalDay: 'Nineteenth Sunday after Trinity',
		liturgicalSeason: 'ordinary_time',
		liturgicalColour: 'green',
		isConfirmed: true
	},
	{
		serviceType: 'feast_day',
		title: 'All Saints\' Day Eucharist',
		date: '2025-11-01',
		time: '17:30',
		endTime: '18:30',
		rite: 'CW',
		liturgicalDay: 'All Saints\' Day',
		liturgicalSeason: 'ordinary_time',
		liturgicalColour: 'white'
	}
];

for (const service of services) {
	db.insert(schema.services).values(service).run();
}
console.log(`  Created ${services.length} services`);

// Create some role assignments
const roles = [
	{ serviceId: 1, personId: 2, role: 'preacher', invitationStatus: 'accepted' },
	{ serviceId: 1, personId: 1, role: 'officiant', invitationStatus: 'accepted' },
	{ serviceId: 1, personId: 5, role: 'reader', roleLabel: 'First Reader', invitationStatus: 'accepted' },
	{ serviceId: 2, personId: 4, role: 'preacher', invitationStatus: 'requested' },
	{ serviceId: 2, personId: 1, role: 'officiant', invitationStatus: 'possibility' },
	{ serviceId: 3, personId: 3, role: 'preacher', invitationStatus: 'possibility' },
	{ serviceId: 6, personId: 1, role: 'celebrant', invitationStatus: 'accepted' },
	{ serviceId: 7, personId: 4, role: 'bishop', invitationStatus: 'requested' }
];

for (const role of roles) {
	db.insert(schema.serviceRoles).values(role).run();
}
console.log(`  Created ${roles.length} role assignments`);

// Create hospitality for external visitors
db.insert(schema.hospitality).values({
	serviceRoleId: 4, // Bishop Fanshawe preaching service 2
	accommodationStatus: 'pending',
	accommodationNotes: 'Guest room in College',
	accommodationDates: JSON.stringify(['2025-10-18', '2025-10-19']),
	mealStatus: 'pending',
	mealNotes: 'Vegetarian - dinner Saturday and lunch Sunday',
	mealDates: JSON.stringify(['2025-10-18', '2025-10-19']),
	parkingStatus: 'not_needed',
	expensesStatus: 'pending'
}).run();
console.log('  Created 1 hospitality record');

console.log('\nSeed complete.');
sqlite.close();
