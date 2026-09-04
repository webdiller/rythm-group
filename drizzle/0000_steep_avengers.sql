CREATE TABLE `about_cards` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`icon` text NOT NULL,
	`icon_image` text,
	`title_ru` text NOT NULL,
	`title_en` text NOT NULL,
	`text_ru` text NOT NULL,
	`text_en` text NOT NULL,
	`hidden` integer DEFAULT false,
	`order_index` integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE `affiliate_faq` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`question_ru` text NOT NULL,
	`question_en` text NOT NULL,
	`answer_ru` text NOT NULL,
	`answer_en` text NOT NULL,
	`hidden` integer DEFAULT false,
	`order_index` integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE `affiliate_formats` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title_ru` text NOT NULL,
	`title_en` text NOT NULL,
	`body_ru` text NOT NULL,
	`body_en` text NOT NULL,
	`hidden` integer DEFAULT false,
	`order_index` integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE `affiliate_hero` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`badge_ru` text NOT NULL,
	`badge_en` text NOT NULL,
	`title_ru` text NOT NULL,
	`title_en` text NOT NULL,
	`subtitle_ru` text NOT NULL,
	`subtitle_en` text NOT NULL,
	`cta_primary_ru` text NOT NULL,
	`cta_primary_en` text NOT NULL,
	`cta_secondary_ru` text NOT NULL,
	`cta_secondary_en` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `affiliate_partner_views` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`partner_id` integer NOT NULL,
	`ip_hash` text NOT NULL,
	`created_at` text,
	FOREIGN KEY (`partner_id`) REFERENCES `partners`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `affiliate_partner_views_partner_ip_unique` ON `affiliate_partner_views` (`partner_id`,`ip_hash`);--> statement-breakpoint
CREATE TABLE `blog_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name_ru` text NOT NULL,
	`name_en` text NOT NULL,
	`order_index` integer DEFAULT 0 NOT NULL,
	`deleted_at` integer,
	`created_at` text
);
--> statement-breakpoint
CREATE TABLE `blog_posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category_id` integer NOT NULL,
	`slug` text NOT NULL,
	`title_ru` text NOT NULL,
	`title_en` text NOT NULL,
	`excerpt_ru` text NOT NULL,
	`excerpt_en` text NOT NULL,
	`body_html_ru` text NOT NULL,
	`body_html_en` text NOT NULL,
	`cover_image_url` text,
	`status` text NOT NULL,
	`published_at` integer NOT NULL,
	`deleted_at` integer,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`category_id`) REFERENCES `blog_categories`(`id`) ON UPDATE cascade ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `channel_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name_ru` text NOT NULL,
	`name_en` text NOT NULL,
	`order_index` integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE `channels` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category_id` text,
	`name` text NOT NULL,
	`subscribers` text NOT NULL,
	`reach` text,
	`url` text NOT NULL,
	`order_index` integer DEFAULT 0,
	`avatar` text,
	FOREIGN KEY (`category_id`) REFERENCES `channel_categories`(`id`) ON UPDATE cascade ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `contacts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`scope` text DEFAULT 'landing',
	`email` text NOT NULL,
	`telegram_url` text NOT NULL,
	`telegram_username` text,
	`direct_contacts` text,
	`mini_stats` text,
	`contactsAddress` text DEFAULT '[]' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `partner_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`name_ru` text NOT NULL,
	`name_en` text NOT NULL,
	`order_index` integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE `partners` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category_id` integer,
	`name` text NOT NULL,
	`logo_url` text,
	`title_ru` text,
	`title_en` text,
	`short_description_ru` text,
	`short_description_en` text,
	`published_at` text,
	`wishlists` integer DEFAULT 0,
	`views` integer DEFAULT 0,
	`target_url` text,
	`developer_url` text,
	`show_in_landing_cases` integer DEFAULT true,
	`show_in_affiliate_cases` integer DEFAULT true,
	`show_in_affiliate_steam` integer DEFAULT true,
	`order_index` integer DEFAULT 0,
	FOREIGN KEY (`category_id`) REFERENCES `partner_categories`(`id`) ON UPDATE cascade ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `site_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`favicon` text,
	`logo` text,
	`logo_text` text,
	`privacy_policy_url` text,
	`data_processing_policy_url` text,
	`header_nav_order` text,
	`hero_animation_enabled` integer DEFAULT true,
	`partners_display_mode` text,
	`contact_layout` text,
	`contact_form_hidden` integer DEFAULT false,
	`affiliate_contact_layout` text,
	`affiliate_contact_form_hidden` integer DEFAULT false,
	`blog_show_dates` integer DEFAULT true,
	`affiliate_show_blog_block` integer DEFAULT true,
	`affiliate_show_hero` integer DEFAULT true,
	`affiliate_show_formats` integer DEFAULT true,
	`affiliate_show_cases` integer DEFAULT true,
	`affiliate_show_steam` integer DEFAULT true,
	`affiliate_show_faq` integer DEFAULT true,
	`affiliate_show_contacts` integer DEFAULT true,
	`page_blog_enabled` integer DEFAULT true,
	`page_affiliate_enabled` integer DEFAULT true,
	`site_published` integer DEFAULT true
);
--> statement-breakpoint
CREATE TABLE `translations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`locale` text NOT NULL,
	`section` text NOT NULL,
	`key` text NOT NULL,
	`value` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `translations_locale_section_key` ON `translations` (`locale`,`section`,`key`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`created_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);