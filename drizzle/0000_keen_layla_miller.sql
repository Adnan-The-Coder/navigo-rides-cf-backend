CREATE TABLE `drivers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_uuid` text NOT NULL,
	`license_number` text NOT NULL,
	`license_expiry_date` text NOT NULL,
	`license_image_url` text NOT NULL,
	`aadhar_number` text NOT NULL,
	`aadhar_image_url` text NOT NULL,
	`pan_number` text,
	`pan_image_url` text,
	`police_verification_cert_url` text,
	`background_check_status` text DEFAULT 'pending' NOT NULL,
	`emergency_contact_name` text NOT NULL,
	`emergency_contact_phone` text NOT NULL,
	`bank_account_number` text,
	`bank_ifsc_code` text,
	`bank_account_holder_name` text,
	`upi_id` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`approved_at` text,
	`rejected_at` text,
	`rejection_reason` text,
	`rating` real DEFAULT 0,
	`total_rides` integer DEFAULT 0 NOT NULL,
	`total_earnings` real DEFAULT 0 NOT NULL,
	`is_online` integer DEFAULT false NOT NULL,
	`last_online_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_uuid`) REFERENCES `users`(`uuid`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `drivers_license_number_unique` ON `drivers` (`license_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `drivers_aadhar_number_unique` ON `drivers` (`aadhar_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `drivers_pan_number_unique` ON `drivers` (`pan_number`);--> statement-breakpoint
CREATE INDEX `drivers_license_idx` ON `drivers` (`license_number`);--> statement-breakpoint
CREATE INDEX `drivers_aadhar_idx` ON `drivers` (`aadhar_number`);--> statement-breakpoint
CREATE INDEX `drivers_status_idx` ON `drivers` (`status`);--> statement-breakpoint
CREATE TABLE `schools` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`address` text NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`city` text NOT NULL,
	`state` text NOT NULL,
	`pincode` text NOT NULL,
	`phone` text,
	`email` text,
	`principal_name` text,
	`school_type` text NOT NULL,
	`board_type` text,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`working_days` text NOT NULL,
	`holidays` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `schools_code_unique` ON `schools` (`code`);--> statement-breakpoint
CREATE INDEX `schools_code_idx` ON `schools` (`code`);--> statement-breakpoint
CREATE INDEX `schools_city_idx` ON `schools` (`city`);--> statement-breakpoint
CREATE INDEX `schools_type_idx` ON `schools` (`school_type`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`phone_number` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`profile_image` text,
	`date_of_birth` text,
	`gender` text,
	`user_type` text DEFAULT 'customer' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`is_verified` integer DEFAULT false NOT NULL,
	`uuid` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_phone_number_unique` ON `users` (`phone_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_uuid_unique` ON `users` (`uuid`);--> statement-breakpoint
CREATE INDEX `users_phone_idx` ON `users` (`phone_number`);--> statement-breakpoint
CREATE INDEX `users_email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `users_user_type_idx` ON `users` (`user_type`);--> statement-breakpoint
CREATE TABLE `vehicles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`driver_id` integer NOT NULL,
	`vehicle_type` text NOT NULL,
	`registration_number` text NOT NULL,
	`make` text NOT NULL,
	`model` text NOT NULL,
	`year` integer NOT NULL,
	`color` text NOT NULL,
	`capacity` integer NOT NULL,
	`rc_image_url` text NOT NULL,
	`insurance_cert_url` text NOT NULL,
	`insurance_expiry_date` text NOT NULL,
	`puc_cert_url` text,
	`puc_expiry_date` text,
	`permit_image_url` text,
	`permit_expiry_date` text,
	`vehicle_image_urls` text,
	`is_active` integer DEFAULT true NOT NULL,
	`verification_status` text DEFAULT 'pending' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`driver_id`) REFERENCES `drivers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vehicles_registration_number_unique` ON `vehicles` (`registration_number`);--> statement-breakpoint
CREATE INDEX `vehicles_driver_idx` ON `vehicles` (`driver_id`);--> statement-breakpoint
CREATE INDEX `vehicles_registration_idx` ON `vehicles` (`registration_number`);