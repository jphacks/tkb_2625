ALTER TABLE `checkpoints` ADD `record` text NOT NULL;--> statement-breakpoint
ALTER TABLE `checkpoints` ADD `indexed_at` integer DEFAULT (unixepoch()) NOT NULL;--> statement-breakpoint
ALTER TABLE `submits` ADD `record` text NOT NULL;