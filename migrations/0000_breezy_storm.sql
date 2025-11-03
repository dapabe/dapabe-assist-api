CREATE TABLE `listeningTo` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`appId` text NOT NULL,
	`name` text NOT NULL,
	`lastSeen` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `localData` (
	`currentAppId` text NOT NULL,
	`currentName` text NOT NULL,
	FOREIGN KEY (`currentAppId`) REFERENCES `previousAppIds`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `previousAppIds` (
	`id` text PRIMARY KEY NOT NULL,
	`createdAt` integer
);
