-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE `mmall_cart` (
	`id` int(11) AUTO_INCREMENT NOT NULL,
	`userId` int(11) NOT NULL,
	`productId` int(11),
	`quantity` int(11),
	`checked` int(11),
	`createTime` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updateTime` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	CONSTRAINT `mmall_cart__user_id__unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `mmall_category` (
	`id` bigint(20) AUTO_INCREMENT NOT NULL,
	`parentId` int(11),
	`name` varchar(255),
	`status` tinyint DEFAULT 1,
	`sortOrder` int(11),
	`createTime` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updateTime` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	CONSTRAINT `id` UNIQUE(`id`),
	CONSTRAINT `mmall_category_id__unique` UNIQUE(`id`)
);
--> statement-breakpoint
CREATE TABLE `mmall_order` (
	`id` bigint(20) AUTO_INCREMENT NOT NULL,
	`orderNo` bigint(20),
	`userId` int(11),
	`shippingId` int(11),
	`payment` decimal(20,2),
	`paymentType` int(11),
	`postage` int(11),
	`status` int(11),
	`paymentTime` datetime,
	`sendTime` datetime,
	`endTime` datetime,
	`closeTime` datetime,
	`createTime` datetime,
	`updateTime` datetime,
	CONSTRAINT `id` UNIQUE(`id`),
	CONSTRAINT `mmall_order_id__unique` UNIQUE(`id`)
);
--> statement-breakpoint
CREATE TABLE `mmall_order_item` (
	`id` int(11) AUTO_INCREMENT NOT NULL,
	`userId` int(11),
	`orderNo` bigint(20),
	`productId` int(11),
	`productName` varchar(100),
	`productImage` varchar(500),
	`currentUnitPrice` decimal(20,2),
	`quantity` int(11),
	`totalPrice` decimal(20,2),
	`createTime` datetime,
	`updateTime` datetime,
	CONSTRAINT `mmall_order_item_id__unique` UNIQUE(`id`)
);
--> statement-breakpoint
CREATE TABLE `mmall_pay_info` (
	`id` bigint(20) AUTO_INCREMENT NOT NULL,
	`userId` int(11),
	`orderNo` bigint(20),
	`payPlatform` int(11),
	`platformNumber` varchar(200),
	`platformStatus` varchar(20),
	`createTime` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updateTime` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	CONSTRAINT `id` UNIQUE(`id`),
	CONSTRAINT `mmall_pay_info_id__unique` UNIQUE(`id`)
);
--> statement-breakpoint
CREATE TABLE `mmall_product` (
	`id` bigint(20) AUTO_INCREMENT NOT NULL,
	`categoryId` int(11) NOT NULL,
	`name` varchar(100) NOT NULL,
	`subtitle` varchar(200),
	`mainImage` varchar(500),
	`subImages` text,
	`detail` text,
	`price` decimal(20,2) NOT NULL,
	`stock` int(11) NOT NULL,
	`status` int(11) DEFAULT 1,
	`createTime` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updateTime` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	CONSTRAINT `id` UNIQUE(`id`),
	CONSTRAINT `mmall_product_id__unique` UNIQUE(`id`)
);
--> statement-breakpoint
CREATE TABLE `mmall_shipping` (
	`id` bigint(20) AUTO_INCREMENT NOT NULL,
	`userId` int(11),
	`receiverName` varchar(20),
	`receiverPhone` varchar(20),
	`receiverMobile` varchar(20),
	`receiverProvince` varchar(20),
	`receiverCity` varchar(20),
	`receiverDistrict` varchar(20),
	`receiverAddress` varchar(200),
	`receiverZip` varchar(6),
	`createTime` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updateTime` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	CONSTRAINT `id` UNIQUE(`id`),
	CONSTRAINT `mmall_shipping_id__unique` UNIQUE(`id`)
);
--> statement-breakpoint
CREATE TABLE `mmall_user` (
	`id` bigint(20) AUTO_INCREMENT NOT NULL,
	`username` varchar(50) NOT NULL,
	`password` varchar(50) NOT NULL,
	`email` varchar(50),
	`phone` varchar(20),
	`question` varchar(100),
	`answer` varchar(100),
	`role` int(11) NOT NULL,
	`createTime` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updateTime` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	CONSTRAINT `id` UNIQUE(`id`),
	CONSTRAINT `user_name_unique` UNIQUE(`username`)
);
--> statement-breakpoint
CREATE INDEX `mmall_cart__user_id__idx` ON `mmall_cart` (`userId`);--> statement-breakpoint
CREATE INDEX `mmall_category_id__idx` ON `mmall_category` (`id`);--> statement-breakpoint
CREATE INDEX `mmall_order_id__idx` ON `mmall_order` (`id`);--> statement-breakpoint
CREATE INDEX `mmall_order_item_id__idx__order_no` ON `mmall_order_item` (`id`,`orderNo`);--> statement-breakpoint
CREATE INDEX `mmall_pay_info_id__idx` ON `mmall_pay_info` (`id`);--> statement-breakpoint
CREATE INDEX `mmall_product_id__idx` ON `mmall_product` (`id`);--> statement-breakpoint
CREATE INDEX `mmall_shipping_id__idx` ON `mmall_shipping` (`id`);
*/