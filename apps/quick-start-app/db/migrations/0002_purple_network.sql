ALTER TABLE `mmall_cart` MODIFY COLUMN `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `mmall_cart` MODIFY COLUMN `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `mmall_category` MODIFY COLUMN `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `mmall_category` MODIFY COLUMN `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `mmall_pay_info` MODIFY COLUMN `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `mmall_pay_info` MODIFY COLUMN `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `mmall_product` MODIFY COLUMN `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `mmall_product` MODIFY COLUMN `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `mmall_shipping` MODIFY COLUMN `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `mmall_shipping` MODIFY COLUMN `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `mmall_user` MODIFY COLUMN `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `mmall_user` MODIFY COLUMN `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `mmall_cart` ADD PRIMARY KEY(`id`);