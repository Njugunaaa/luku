import { z } from "zod";

export const ORDER_STATUS_VALUES = [
  "pending",
  "confirmed",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export const PAYMENT_STATUS_VALUES = ["unpaid", "paid", "refunded"] as const;
export const PRODUCT_CONDITION_VALUES = ["new", "like_new", "good", "fair"] as const;
export const MANUAL_ORDER_SOURCE_VALUES = ["whatsapp", "manual"] as const;

export const orderStatusSchema = z.enum(ORDER_STATUS_VALUES);
export const paymentStatusSchema = z.enum(PAYMENT_STATUS_VALUES);
export const productConditionSchema = z.enum(PRODUCT_CONDITION_VALUES);
export const manualOrderSourceSchema = z.enum(MANUAL_ORDER_SOURCE_VALUES);

export const productListSchema = z.object({
  categoryId: z.number().int().positive().optional(),
  featured: z.boolean().optional(),
  search: z.string().trim().optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
  inStock: z.boolean().optional(),
});

export const authCredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const signupSchema = authCredentialsSchema.extend({
  password: z.string().min(6),
  name: z.string().trim().min(1).optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(1),
  password: z.string().min(6),
});

export const cartAddSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().min(1).max(10),
  selectedSize: z.string().trim().optional(),
  selectedColor: z.string().trim().optional(),
});

export const cartUpdateSchema = z.object({
  quantity: z.number().int().min(0).max(10),
});

export const websiteOrderSchema = z.object({
  customerName: z.string().trim().min(1),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().trim().optional(),
  needsDelivery: z.boolean(),
  deliveryAddress: z.string().trim().optional(),
  deliveryCity: z.string().trim().optional(),
  deliveryNotes: z.string().trim().optional(),
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        productName: z.string().trim().min(1),
        productImage: z.string().trim().optional(),
        price: z.string().trim().min(1),
        quantity: z.number().int().min(1),
        selectedSize: z.string().trim().optional(),
        selectedColor: z.string().trim().optional(),
      }),
    )
    .min(1),
});

export const manualOrderSchema = z.object({
  customerName: z.string().trim().min(1),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().trim().optional(),
  needsDelivery: z.boolean().default(false),
  deliveryAddress: z.string().trim().optional(),
  deliveryCity: z.string().trim().optional(),
  source: manualOrderSourceSchema.default("whatsapp"),
  notes: z.string().trim().optional(),
  items: z
    .array(
      z.object({
        productId: z.number().int().positive().optional(),
        productName: z.string().trim().min(1),
        productImage: z.string().trim().optional(),
        price: z.string().trim().min(1),
        quantity: z.number().int().min(1),
        selectedSize: z.string().trim().optional(),
      }),
    )
    .min(1),
});

export const orderUpdateSchema = z.object({
  status: orderStatusSchema.optional(),
  paymentStatus: paymentStatusSchema.optional(),
  notes: z.string().optional(),
});

export const productUpsertSchema = z.object({
  slug: z.string().trim().min(1),
  name: z.string().trim().min(1),
  description: z.string().trim().optional(),
  price: z.string().trim().min(1),
  originalPrice: z.string().trim().optional(),
  categoryId: z.number().int().positive(),
  imageUrl: z.string().trim().min(1),
  images: z.string().trim().optional(),
  sizes: z.string().trim().optional(),
  colors: z.string().trim().optional(),
  brand: z.string().trim().optional(),
  productcondition: productConditionSchema.optional(),
  inStock: z.boolean().optional(),
  stockCount: z.number().int().min(0).optional(),
  featured: z.boolean().optional(),
  isNew: z.boolean().optional(),
  tags: z.string().trim().optional(),
});

export const categoryUpsertSchema = z.object({
  slug: z.string().trim().min(1),
  name: z.string().trim().min(1),
  description: z.string().trim().optional(),
  imageUrl: z.string().trim().optional(),
  gender: z.enum(["men", "women", "unisex"]).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const adminOrdersQuerySchema = z.object({
  status: z.string().trim().optional(),
  limit: z.number().int().min(1).optional(),
  offset: z.number().int().min(0).optional(),
});

export const summaryPeriodSchema = z.enum(["weekly", "monthly", "yearly"]);

