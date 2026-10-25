PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_submits` (
	`uri` text PRIMARY KEY NOT NULL,
	`cid` text NOT NULL,
	`author_did` text NOT NULL,
	`event_uri` text NOT NULL,
	`event_cid` text NOT NULL,
	`checkpoint_uri` text NOT NULL,
	`checkpoint_cid` text NOT NULL,
	`record` text NOT NULL,
	`photo_cid` text NOT NULL,
	`photo_mime_type` text NOT NULL,
	`photo_size` integer NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`created_at` integer NOT NULL,
	`indexed_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`event_uri`) REFERENCES `events`(`uri`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`checkpoint_uri`) REFERENCES `checkpoints`(`uri`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_submits`("uri", "cid", "author_did", "event_uri", "event_cid", "checkpoint_uri", "checkpoint_cid", "record", "photo_cid", "photo_mime_type", "photo_size", "latitude", "longitude", "created_at", "indexed_at") SELECT "uri", "cid", "author_did", "event_uri", "event_cid", "checkpoint_uri", "checkpoint_cid", "record", "photo_cid", "photo_mime_type", "photo_size", "latitude", "longitude", "created_at", "indexed_at" FROM `submits`;--> statement-breakpoint
DROP TABLE `submits`;--> statement-breakpoint
ALTER TABLE `__new_submits` RENAME TO `submits`;--> statement-breakpoint
CREATE INDEX `submits_event_uri_idx` ON `submits` (`event_uri`);--> statement-breakpoint
CREATE INDEX `submits_checkpoint_uri_idx` ON `submits` (`checkpoint_uri`);--> statement-breakpoint
CREATE INDEX `submits_author_did_idx` ON `submits` (`author_did`);--> statement-breakpoint
CREATE TABLE `__new_checkpoints` (
	`uri` text PRIMARY KEY NOT NULL,
	`cid` text NOT NULL,
	`event_uri` text NOT NULL,
	`author_did` text NOT NULL,
	`event_cid` text NOT NULL,
	`record` text NOT NULL,
	`name` text NOT NULL,
	`point` integer NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`is_goal` integer DEFAULT false NOT NULL,
	`radius_meters` integer DEFAULT 30 NOT NULL,
	`description` text,
	`image_cid` text,
	`internal_image_cids` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_checkpoints`("uri", "cid", "event_uri", "author_did", "event_cid", "record", "name", "point", "latitude", "longitude", "is_goal", "radius_meters", "description", "image_cid", "internal_image_cids", "created_at", "updated_at") SELECT "uri", "cid", "event_uri", "author_did", "event_cid", "record", "name", "point", "latitude", "longitude", "is_goal", "radius_meters", "description", "image_cid", "internal_image_cids", "created_at", "updated_at" FROM `checkpoints`;--> statement-breakpoint
DROP TABLE `checkpoints`;--> statement-breakpoint
ALTER TABLE `__new_checkpoints` RENAME TO `checkpoints`;--> statement-breakpoint
CREATE INDEX `checkpoints_event_uri_idx` ON `checkpoints` (`event_uri`);
--> statement-breakpoint
PRAGMA foreign_keys=ON;