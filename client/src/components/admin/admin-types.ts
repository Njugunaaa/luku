export type AdminSection =
  | "overview"
  | "current"
  | "past"
  | "surveillance"
  | "manual"
  | "inventory"
  | "analytics";

export type AdminOrder = {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  needsDelivery?: boolean | null;
  deliveryAddress?: string | null;
  deliveryCity?: string | null;
  deliveryFee?: string | number | null;
  subtotal?: string | number | null;
  total: string | number;
  source: string;
  status: string;
  paymentStatus: string;
  notes?: string | null;
  createdAt: string | Date;
  items?: Array<{
    id?: number;
    productName: string;
    productImage?: string | null;
    price: string;
    quantity: number;
    selectedSize?: string | null;
  }>;
};

export type AdminProduct = {
  id: number;
  slug: string;
  name: string;
  description?: string | null;
  price: string | number;
  originalPrice?: string | number | null;
  categoryId: number;
  imageUrl: string;
  brand?: string | null;
  stockCount?: number | null;
  inStock?: boolean | null;
  featured?: boolean | null;
  isNew?: boolean | null;
  productcondition?: "new" | "like_new" | "good" | "fair" | null;
  tags?: string | null;
  sizes?: string | null;
  colors?: string | null;
};

export const ORDER_STATUS_OPTIONS = [
  "pending",
  "confirmed",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export const PAYMENT_STATUS_OPTIONS = ["unpaid", "paid", "refunded"] as const;

export const PRODUCT_CONDITION_OPTIONS = [
  "new",
  "like_new",
  "good",
  "fair",
] as const;

export const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-200",
  confirmed: "bg-pink-500/15 text-pink-700 dark:text-pink-200",
  paid: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-200",
  processing: "bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-200",
  shipped: "bg-rose-500/15 text-rose-700 dark:text-rose-200",
  delivered: "bg-green-500/15 text-green-700 dark:text-green-200",
  cancelled: "bg-red-500/15 text-red-700 dark:text-red-200",
};

export function parseMoney(value: string | number | null | undefined) {
  return Number.parseFloat(String(value ?? 0)) || 0;
}

export function formatCurrency(value: string | number | null | undefined) {
  return `KES ${parseMoney(value).toLocaleString()}`;
}

export function formatOrderDate(value: string | Date) {
  return new Date(value).toLocaleDateString("en-KE", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatRelativeAge(value: string | Date) {
  const ageMs = Date.now() - new Date(value).getTime();
  const ageHours = Math.max(1, Math.floor(ageMs / (1000 * 60 * 60)));
  if (ageHours < 24) return `${ageHours}h ago`;
  return `${Math.floor(ageHours / 24)}d ago`;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}
