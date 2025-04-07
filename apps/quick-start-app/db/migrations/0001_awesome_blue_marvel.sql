CREATE TABLE `sessions` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`userId` varchar(36) NOT NULL,
	`expiresAt` datetime NOT NULL,
	`createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`ipAddress` varchar(45),
	`userAgent` text,
	CONSTRAINT `id` UNIQUE(`id`),
	CONSTRAINT `userId` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `mmall_cart` MODIFY COLUMN `id` int AUTO_INCREMENT NOT NULL;--> statement-breakpoint
ALTER TABLE `mmall_cart` MODIFY COLUMN `userId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `mmall_cart` MODIFY COLUMN `productId` int;--> statement-breakpoint
ALTER TABLE `mmall_cart` MODIFY COLUMN `quantity` int;--> statement-breakpoint
ALTER TABLE `mmall_cart` MODIFY COLUMN `checked` int;--> statement-breakpoint
ALTER TABLE `mmall_category` MODIFY COLUMN `id` bigint AUTO_INCREMENT NOT NULL;--> statement-breakpoint
ALTER TABLE `mmall_category` MODIFY COLUMN `parentId` int;--> statement-breakpoint
ALTER TABLE `mmall_category` MODIFY COLUMN `sortOrder` int;--> statement-breakpoint
ALTER TABLE `mmall_order` MODIFY COLUMN `id` bigint AUTO_INCREMENT NOT NULL;--> statement-breakpoint
ALTER TABLE `mmall_order` MODIFY COLUMN `orderNo` bigint;--> statement-breakpoint
ALTER TABLE `mmall_order` MODIFY COLUMN `userId` int;--> statement-breakpoint
ALTER TABLE `mmall_order` MODIFY COLUMN `shippingId` int;--> statement-breakpoint
ALTER TABLE `mmall_order` MODIFY COLUMN `paymentType` int;--> statement-breakpoint
ALTER TABLE `mmall_order` MODIFY COLUMN `postage` int;--> statement-breakpoint
ALTER TABLE `mmall_order` MODIFY COLUMN `status` int;--> statement-breakpoint
ALTER TABLE `mmall_order_item` MODIFY COLUMN `id` int AUTO_INCREMENT NOT NULL;--> statement-breakpoint
ALTER TABLE `mmall_order_item` MODIFY COLUMN `userId` int;--> statement-breakpoint
ALTER TABLE `mmall_order_item` MODIFY COLUMN `orderNo` bigint;--> statement-breakpoint
ALTER TABLE `mmall_order_item` MODIFY COLUMN `productId` int;--> statement-breakpoint
ALTER TABLE `mmall_order_item` MODIFY COLUMN `quantity` int;--> statement-breakpoint
ALTER TABLE `mmall_pay_info` MODIFY COLUMN `id` bigint AUTO_INCREMENT NOT NULL;--> statement-breakpoint
ALTER TABLE `mmall_pay_info` MODIFY COLUMN `userId` int;--> statement-breakpoint
ALTER TABLE `mmall_pay_info` MODIFY COLUMN `orderNo` bigint;--> statement-breakpoint
ALTER TABLE `mmall_pay_info` MODIFY COLUMN `payPlatform` int;--> statement-breakpoint
ALTER TABLE `mmall_product` MODIFY COLUMN `id` bigint AUTO_INCREMENT NOT NULL;--> statement-breakpoint
ALTER TABLE `mmall_product` MODIFY COLUMN `categoryId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `mmall_product` MODIFY COLUMN `stock` int NOT NULL;--> statement-breakpoint
ALTER TABLE `mmall_product` MODIFY COLUMN `status` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `mmall_shipping` MODIFY COLUMN `id` bigint AUTO_INCREMENT NOT NULL;--> statement-breakpoint
ALTER TABLE `mmall_shipping` MODIFY COLUMN `userId` int;--> statement-breakpoint
ALTER TABLE `mmall_user` MODIFY COLUMN `id` bigint AUTO_INCREMENT NOT NULL;--> statement-breakpoint
ALTER TABLE `mmall_user` MODIFY COLUMN `role` int;