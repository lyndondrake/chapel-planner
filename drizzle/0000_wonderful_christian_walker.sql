CREATE TABLE `hospitality` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`service_role_id` integer NOT NULL,
	`accommodation_status` text DEFAULT 'not_needed',
	`accommodation_notes` text,
	`accommodation_dates` text,
	`meal_status` text DEFAULT 'not_needed',
	`meal_notes` text,
	`meal_dates` text,
	`parking_status` text DEFAULT 'not_needed',
	`parking_notes` text,
	`parking_dates` text,
	`expenses_status` text DEFAULT 'not_needed',
	`expenses_amount` real,
	`expenses_notes` text,
	`expenses_paid_at` text,
	FOREIGN KEY (`service_role_id`) REFERENCES `service_roles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `hymns` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`hymnal_name` text,
	`hymn_number` text,
	`author` text,
	`tune` text,
	`metre` text
);
--> statement-breakpoint
CREATE TABLE `lectionary_date_map` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`occasion_id` integer NOT NULL,
	`liturgical_year` text,
	`mapping_type` text DEFAULT 'primary' NOT NULL,
	FOREIGN KEY (`occasion_id`) REFERENCES `lectionary_occasions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `lectionary_occasions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text,
	`season` text,
	`colour` text,
	`is_fixed` integer DEFAULT false,
	`fixed_month` integer,
	`fixed_day` integer,
	`week_of_season` integer,
	`day_of_week` integer,
	`priority` integer DEFAULT 0,
	`collect_cw` text,
	`collect_bcp` text,
	`post_communion_cw` text,
	`occasion_rank` text,
	`can_transfer_to_sunday` integer DEFAULT false,
	`common_slug` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `lectionary_occasions_slug_unique` ON `lectionary_occasions` (`slug`);--> statement-breakpoint
CREATE TABLE `lectionary_readings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`occasion_id` integer NOT NULL,
	`tradition` text NOT NULL,
	`service_context` text,
	`reading_type` text NOT NULL,
	`book` text,
	`chapter` text,
	`verse_start` text,
	`verse_end` text,
	`reference` text NOT NULL,
	`alternate_year` text,
	`is_optional` integer DEFAULT false,
	`sort_order` integer DEFAULT 0,
	FOREIGN KEY (`occasion_id`) REFERENCES `lectionary_occasions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `people` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`preferred_name` text,
	`suffix` text,
	`email` text,
	`phone` text,
	`institution` text,
	`is_college_member` integer DEFAULT false,
	`dietary_needs` text,
	`notes` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `service_blocks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`term_name` text,
	`series_title` text,
	`series_description` text,
	`start_date` text,
	`end_date` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `service_music` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`service_id` integer NOT NULL,
	`music_type` text NOT NULL,
	`position` text,
	`hymn_id` integer,
	`title` text,
	`composer` text,
	`sort_order` integer DEFAULT 0,
	FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`hymn_id`) REFERENCES `hymns`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `service_readings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`service_id` integer NOT NULL,
	`lectionary_reading_id` integer,
	`reading_type` text NOT NULL,
	`reference` text NOT NULL,
	`is_override` integer DEFAULT false,
	`reader_id` integer,
	`sort_order` integer DEFAULT 0,
	`notes` text,
	FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`lectionary_reading_id`) REFERENCES `lectionary_readings`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`reader_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `service_roles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`service_id` integer NOT NULL,
	`person_id` integer,
	`role` text NOT NULL,
	`role_label` text,
	`invitation_status` text DEFAULT 'possibility' NOT NULL,
	`invited_at` text,
	`responded_at` text,
	`notes` text,
	FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`person_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `services` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`block_id` integer,
	`service_type` text NOT NULL,
	`title` text,
	`date` text NOT NULL,
	`time` text,
	`end_time` text,
	`rite` text DEFAULT 'CW' NOT NULL,
	`location` text DEFAULT 'Chapel',
	`liturgical_day` text,
	`liturgical_season` text,
	`liturgical_colour` text,
	`visibility` text DEFAULT 'college' NOT NULL,
	`series_position` integer,
	`series_theme` text,
	`notes` text,
	`special_instructions` text,
	`is_confirmed` integer DEFAULT false,
	`is_baptism` integer DEFAULT false,
	`is_confirmation` integer DEFAULT false,
	`is_wedding` integer DEFAULT false,
	`is_blessing` integer DEFAULT false,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`block_id`) REFERENCES `service_blocks`(`id`) ON UPDATE no action ON DELETE set null
);
