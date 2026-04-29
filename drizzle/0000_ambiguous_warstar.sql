CREATE TYPE "public"."gender" AS ENUM('men', 'women', 'unisex');--> statement-breakpoint
CREATE TYPE "public"."source" AS ENUM('website', 'whatsapp', 'manual');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('pending', 'confirmed', 'paid', 'processing', 'shipped', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."paymentStatus" AS ENUM('unpaid', 'paid', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."productcondition" AS ENUM('new', 'like_new', 'good', 'fair');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "cart_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer,
	"guestId" varchar(64),
	"productId" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"selectedSize" varchar(32),
	"selectedColor" varchar(64),
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(64) NOT NULL,
	"name" varchar(128) NOT NULL,
	"description" text,
	"imageUrl" text,
	"gender" "gender" DEFAULT 'unisex',
	"sortOrder" integer DEFAULT 0,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"orderId" integer NOT NULL,
	"productId" integer,
	"productName" varchar(256) NOT NULL,
	"productImage" text,
	"price" numeric(10, 2) NOT NULL,
	"quantity" integer NOT NULL,
	"selectedSize" varchar(32),
	"selectedColor" varchar(64),
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"orderNumber" varchar(32) NOT NULL,
	"userId" integer,
	"guestId" varchar(64),
	"customerName" varchar(256) NOT NULL,
	"customerEmail" varchar(320),
	"customerPhone" varchar(32),
	"needsDelivery" boolean DEFAULT false,
	"deliveryAddress" text,
	"deliveryCity" varchar(128),
	"deliveryNotes" text,
	"subtotal" numeric(10, 2) NOT NULL,
	"deliveryFee" numeric(10, 2) DEFAULT '0',
	"total" numeric(10, 2) NOT NULL,
	"status" "status" DEFAULT 'pending' NOT NULL,
	"paymentStatus" "paymentStatus" DEFAULT 'unpaid' NOT NULL,
	"source" "source" DEFAULT 'website' NOT NULL,
	"notes" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_orderNumber_unique" UNIQUE("orderNumber")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(128) NOT NULL,
	"name" varchar(256) NOT NULL,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"originalPrice" numeric(10, 2),
	"categoryId" integer NOT NULL,
	"imageUrl" text NOT NULL,
	"images" text,
	"sizes" text,
	"colors" text,
	"brand" varchar(128),
	"productcondition" "productcondition" DEFAULT 'like_new',
	"inStock" boolean DEFAULT true NOT NULL,
	"stockCount" integer DEFAULT 1,
	"featured" boolean DEFAULT false,
	"isNew" boolean DEFAULT false,
	"tags" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"passwordHash" varchar(128),
	"phone" varchar(32),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE INDEX "cart_items_user_id_idx" ON "cart_items" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "cart_items_guest_id_idx" ON "cart_items" USING btree ("guestId");--> statement-breakpoint
CREATE INDEX "cart_items_product_id_idx" ON "cart_items" USING btree ("productId");--> statement-breakpoint
CREATE INDEX "order_items_order_id_idx" ON "order_items" USING btree ("orderId");--> statement-breakpoint
CREATE INDEX "order_items_product_id_idx" ON "order_items" USING btree ("productId");--> statement-breakpoint
CREATE INDEX "orders_user_id_idx" ON "orders" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "orders_guest_id_idx" ON "orders" USING btree ("guestId");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "products_category_id_idx" ON "products" USING btree ("categoryId");