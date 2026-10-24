CREATE TABLE `approve` (
	`uri` text PRIMARY KEY NOT NULL,
	`submit_uri` text NOT NULL,
	`submit_cid` text NOT NULL,
	`approver_did` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `checkpoints` (
	`uri` text PRIMARY KEY NOT NULL,
	`cid` text NOT NULL,
	`event_uri` text NOT NULL,
	`event_cid` text NOT NULL,
	`name` text NOT NULL,
	`point` integer NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`radius_meters` integer DEFAULT 30 NOT NULL,
	`description` text,
	`image_cid` text,
	`internal_image_cids` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `checkpoints_event_uri_idx` ON `checkpoints` (`event_uri`);--> statement-breakpoint
CREATE TABLE `events` (
	`uri` text PRIMARY KEY NOT NULL,
	`cid` text NOT NULL,
	`author_did` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`image_cid` text,
	`starts_at` integer NOT NULL,
	`ends_at` integer NOT NULL,
	`approver_did` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `submits` (
	`uri` text PRIMARY KEY NOT NULL,
	`cid` text NOT NULL,
	`author_did` text NOT NULL,
	`event_uri` text NOT NULL,
	`event_cid` text NOT NULL,
	`checkpoint_uri` text NOT NULL,
	`checkpoint_cid` text NOT NULL,
	`photo_cid` text NOT NULL,
	`photo_mime_type` text NOT NULL,
	`photo_size` integer NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`created_at` integer NOT NULL,
	`indexed_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`event_uri`) REFERENCES `events`(`uri`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`checkpoint_uri`) REFERENCES `checkpoints`(`uri`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `submits_event_uri_idx` ON `submits` (`event_uri`);--> statement-breakpoint
CREATE INDEX `submits_checkpoint_uri_idx` ON `submits` (`checkpoint_uri`);--> statement-breakpoint
CREATE INDEX `submits_author_did_idx` ON `submits` (`author_did`);--> statement-breakpoint
DROP TABLE `example`;