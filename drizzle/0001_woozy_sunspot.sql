ALTER TABLE `site_settings` ADD `channels_show_subscribers` integer DEFAULT true;--> statement-breakpoint
ALTER TABLE `site_settings` ADD `channels_show_reach` integer DEFAULT true;--> statement-breakpoint
ALTER TABLE `site_settings` ADD `channels_card_align` text DEFAULT 'left';--> statement-breakpoint
ALTER TABLE `contacts` DROP COLUMN `contactsAddress`;