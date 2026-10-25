CREATE TABLE `jetstream_cursor` (
	`id` integer PRIMARY KEY NOT NULL,
	`cursor` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reject` (
	`uri` text PRIMARY KEY NOT NULL,
	`submit_uri` text NOT NULL,
	`submit_cid` text NOT NULL,
	`approver_did` text NOT NULL,
	`reason` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `reject_submit_uri_idx` ON `reject` (`submit_uri`);--> statement-breakpoint
CREATE TABLE `team_members` (
	`team_uri` text NOT NULL,
	`event_uri` text NOT NULL,
	`member_did` text NOT NULL,
	PRIMARY KEY(`team_uri`, `member_did`),
	FOREIGN KEY (`team_uri`) REFERENCES `teams`(`uri`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `team_members_member_did_idx` ON `team_members` (`member_did`);--> statement-breakpoint
CREATE TABLE `teams` (
	`uri` text PRIMARY KEY NOT NULL,
	`cid` text NOT NULL,
	`author_did` text NOT NULL,
	`event_uri` text NOT NULL,
	`event_cid` text NOT NULL,
	`record` text NOT NULL,
	`name` text NOT NULL,
	`members` text NOT NULL,
	`created_at` integer NOT NULL,
	`indexed_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `teams_event_uri_idx` ON `teams` (`event_uri`);--> statement-breakpoint
ALTER TABLE `approve` ADD `reason` text;--> statement-breakpoint
CREATE INDEX `approve_submit_uri_idx` ON `approve` (`submit_uri`);--> statement-breakpoint
ALTER TABLE `checkpoints` ADD `author_did` text NOT NULL;--> statement-breakpoint
ALTER TABLE `checkpoints` ADD `record` text NOT NULL;--> statement-breakpoint
ALTER TABLE `submits` ADD `record` text NOT NULL;