CREATE TABLE `cart_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`productId` int NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`selectedSize` varchar(32),
	`selectedColor` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cart_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(64) NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` text,
	`imageUrl` text,
	`gender` enum('men','women','unisex') DEFAULT 'unisex',
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`productId` int,
	`productName` varchar(256) NOT NULL,
	`productImage` text,
	`price` decimal(10,2) NOT NULL,
	`quantity` int NOT NULL,
	`selectedSize` varchar(32),
	`selectedColor` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderNumber` varchar(32) NOT NULL,
	`userId` int,
	`customerName` varchar(256) NOT NULL,
	`customerEmail` varchar(320),
	`customerPhone` varchar(32),
	`needsDelivery` boolean DEFAULT false,
	`deliveryAddress` text,
	`deliveryCity` varchar(128),
	`deliveryNotes` text,
	`subtotal` decimal(10,2) NOT NULL,
	`deliveryFee` decimal(10,2) DEFAULT '0',
	`total` decimal(10,2) NOT NULL,
	`status` enum('pending','confirmed','paid','processing','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending',
	`paymentStatus` enum('unpaid','paid','refunded') NOT NULL DEFAULT 'unpaid',
	`source` enum('website','whatsapp','manual') NOT NULL DEFAULT 'website',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_orderNumber_unique` UNIQUE(`orderNumber`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(128) NOT NULL,
	`name` varchar(256) NOT NULL,
	`description` text,
	`price` decimal(10,2) NOT NULL,
	`originalPrice` decimal(10,2),
	`categoryId` int NOT NULL,
	`imageUrl` text NOT NULL,
	`images` text,
	`sizes` text,
	`colors` text,
	`brand` varchar(128),
	`condition` enum('new','like_new','good','fair') DEFAULT 'like_new',
	`inStock` boolean NOT NULL DEFAULT true,
	`stockCount` int DEFAULT 1,
	`featured` boolean DEFAULT false,
	`isNew` boolean DEFAULT false,
	`tags` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(32);