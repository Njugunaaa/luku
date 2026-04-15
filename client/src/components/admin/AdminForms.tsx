"use client";

import { Plus, Search, Sparkles, X } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AdminProduct,
  formatCurrency,
  parseMoney,
  PRODUCT_CONDITION_OPTIONS,
  slugify,
} from "./admin-types";

type ManualOrderFormProps = {
  loading: boolean;
  onSubmit: (data: {
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    needsDelivery: boolean;
    deliveryAddress?: string;
    deliveryCity?: string;
    source: "whatsapp" | "manual";
    notes?: string;
    items: Array<{
      productName: string;
      price: string;
      quantity: number;
      selectedSize?: string;
    }>;
  }) => Promise<void>;
};

export function ManualOrderForm({ loading, onSubmit }: ManualOrderFormProps) {
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    needsDelivery: false,
    deliveryAddress: "",
    deliveryCity: "",
    source: "whatsapp" as "whatsapp" | "manual",
    notes: "",
  });
  const [items, setItems] = useState([
    { productName: "", price: "", quantity: 1, selectedSize: "" },
  ]);

  function updateItem(index: number, field: string, value: string | number) {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.customerName.trim()) {
      toast.error("Customer name is required.");
      return;
    }
    if (items.some((item) => !item.productName.trim() || !item.price)) {
      toast.error("Every order item needs a product name and price.");
      return;
    }

    await onSubmit({
      ...form,
      customerEmail: form.customerEmail || undefined,
      customerPhone: form.customerPhone || undefined,
      deliveryAddress: form.deliveryAddress || undefined,
      deliveryCity: form.deliveryCity || undefined,
      notes: form.notes || undefined,
      items: items.map((item) => ({
        ...item,
        selectedSize: item.selectedSize || undefined,
      })),
    });

    setForm({
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      needsDelivery: false,
      deliveryAddress: "",
      deliveryCity: "",
      source: "whatsapp",
      notes: "",
    });
    setItems([{ productName: "", price: "", quantity: 1, selectedSize: "" }]);
  }

  const estimatedTotal = items.reduce(
    (sum, item) => sum + parseMoney(item.price) * item.quantity,
    0,
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-[2rem] border border-border bg-card p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-pink-500">Manual Intake</p>
        <h2 className="mt-3 text-2xl font-semibold">Book a WhatsApp or in-person order</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Capture customer orders exactly as they arrive so stock, delivery, and revenue reporting stay clean.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="manual-customer-name">Customer Name</Label>
            <Input
              id="manual-customer-name"
              value={form.customerName}
              onChange={(event) =>
                setForm((current) => ({ ...current, customerName: event.target.value }))
              }
              placeholder="Full name"
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="manual-customer-phone">Phone Number</Label>
            <Input
              id="manual-customer-phone"
              value={form.customerPhone}
              onChange={(event) =>
                setForm((current) => ({ ...current, customerPhone: event.target.value }))
              }
              placeholder="+254 700 000 000"
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="manual-customer-email">Email</Label>
            <Input
              id="manual-customer-email"
              type="email"
              value={form.customerEmail}
              onChange={(event) =>
                setForm((current) => ({ ...current, customerEmail: event.target.value }))
              }
              placeholder="customer@example.com"
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="manual-source">Order Source</Label>
            <select
              id="manual-source"
              value={form.source}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  source: event.target.value as "whatsapp" | "manual",
                }))
              }
              className="mt-2 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400/40"
            >
              <option value="whatsapp">WhatsApp</option>
              <option value="manual">Manual / In-person</option>
            </select>
          </div>
        </div>

        <div className="mt-5 rounded-3xl border border-border bg-background/70 p-5">
          <div className="flex items-center gap-3">
            <input
              id="manual-delivery"
              type="checkbox"
              checked={form.needsDelivery}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  needsDelivery: event.target.checked,
                }))
              }
              className="h-4 w-4 rounded border-border accent-pink-500"
            />
            <Label htmlFor="manual-delivery">Customer needs delivery</Label>
          </div>

          {form.needsDelivery ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="manual-delivery-address">Delivery Address</Label>
                <Input
                  id="manual-delivery-address"
                  value={form.deliveryAddress}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      deliveryAddress: event.target.value,
                    }))
                  }
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="manual-delivery-city">City</Label>
                <Input
                  id="manual-delivery-city"
                  value={form.deliveryCity}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      deliveryCity: event.target.value,
                    }))
                  }
                  className="mt-2"
                />
              </div>
            </div>
          ) : null}

          <div className="mt-4">
            <Label htmlFor="manual-notes">Operator Notes</Label>
            <Textarea
              id="manual-notes"
              rows={4}
              value={form.notes}
              onChange={(event) =>
                setForm((current) => ({ ...current, notes: event.target.value }))
              }
              placeholder="Delivery timing, payment promises, customer preferences..."
              className="mt-2 rounded-2xl"
            />
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-border bg-card p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold">Order Items</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Add each requested item exactly as the customer ordered it.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setItems((current) => [
                ...current,
                { productName: "", price: "", quantity: 1, selectedSize: "" },
              ])
            }
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        </div>

        <div className="mt-6 space-y-4">
          {items.map((item, index) => (
            <div key={index} className="grid gap-4 rounded-3xl border border-border bg-background/70 p-4 md:grid-cols-[2.2fr_1fr_0.9fr_1fr_auto]">
              <div>
                <Label htmlFor={`manual-item-name-${index}`}>Product Name</Label>
                <Input
                  id={`manual-item-name-${index}`}
                  value={item.productName}
                  onChange={(event) => updateItem(index, "productName", event.target.value)}
                  className="mt-2"
                  placeholder="Vintage varsity jacket"
                />
              </div>
              <div>
                <Label htmlFor={`manual-item-price-${index}`}>Price</Label>
                <Input
                  id={`manual-item-price-${index}`}
                  type="number"
                  min={0}
                  value={item.price}
                  onChange={(event) => updateItem(index, "price", event.target.value)}
                  className="mt-2"
                  placeholder="2500"
                />
              </div>
              <div>
                <Label htmlFor={`manual-item-qty-${index}`}>Quantity</Label>
                <Input
                  id={`manual-item-qty-${index}`}
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(event) =>
                    updateItem(index, "quantity", Number.parseInt(event.target.value || "1", 10))
                  }
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor={`manual-item-size-${index}`}>Size</Label>
                <Input
                  id={`manual-item-size-${index}`}
                  value={item.selectedSize}
                  onChange={(event) => updateItem(index, "selectedSize", event.target.value)}
                  className="mt-2"
                  placeholder="M"
                />
              </div>
              <div className="flex items-end">
                {items.length > 1 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setItems((current) =>
                        current.filter((_, itemIndex) => itemIndex !== index),
                      )
                    }
                    className="rounded-full border border-border p-3 text-muted-foreground transition-colors hover:border-pink-400 hover:text-pink-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-4 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Estimated total</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{formatCurrency(estimatedTotal)}</p>
          </div>
          <Button type="submit" disabled={loading} className="sm:min-w-[220px]">
            {loading ? "Creating Order..." : "Create Manual Order"}
          </Button>
        </div>
      </section>
    </form>
  );
}

type InventoryManagerProps = {
  categories: Array<{ id: number; name: string }>;
  products: AdminProduct[];
  loading: boolean;
  deletingProductId?: number | null;
  onSubmit: (payload: {
    slug: string;
    name: string;
    description?: string;
    price: string;
    originalPrice?: string;
    categoryId: number;
    imageUrl: string;
    images?: string;
    sizes?: string;
    colors?: string;
    brand?: string;
    productcondition?: "new" | "like_new" | "good" | "fair";
    inStock?: boolean;
    stockCount?: number;
    featured?: boolean;
    isNew?: boolean;
    tags?: string;
  }) => Promise<void>;
  onDelete: (productId: number) => Promise<void>;
};

const EMPTY_PRODUCT_FORM = {
  slug: "",
  name: "",
  description: "",
  price: "",
  originalPrice: "",
  categoryId: 0,
  imageUrl: "",
  images: "",
  sizes: "",
  colors: "",
  brand: "",
  productcondition: "like_new" as "new" | "like_new" | "good" | "fair",
  inStock: true,
  stockCount: 1,
  featured: false,
  isNew: false,
  tags: "",
};

export function InventoryManager({
  categories,
  products,
  loading,
  deletingProductId = null,
  onSubmit,
  onDelete,
}: InventoryManagerProps) {
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(EMPTY_PRODUCT_FORM);
  const [uploadingImage, setUploadingImage] = useState(false);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products;
    return products.filter((product) =>
      [product.name, product.slug, product.brand, product.tags]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [products, search]);

  function hydrateForm(product: AdminProduct) {
    setForm({
      slug: product.slug,
      name: product.name,
      description: product.description ?? "",
      price: String(product.price ?? ""),
      originalPrice: String(product.originalPrice ?? ""),
      categoryId: product.categoryId,
      imageUrl: product.imageUrl,
      images: product.images ?? JSON.stringify([product.imageUrl]),
      sizes: product.sizes ?? "",
      colors: product.colors ?? "",
      brand: product.brand ?? "",
      productcondition: product.productcondition ?? "like_new",
      inStock: product.inStock ?? true,
      stockCount: product.stockCount ?? 1,
      featured: product.featured ?? false,
      isNew: product.isNew ?? false,
      tags: product.tags ?? "",
    });
  }

  async function handleImageSelection(file?: File) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }

    setUploadingImage(true);

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Unable to read image file."));
        reader.readAsDataURL(file);
      });

      setForm((current) => ({
        ...current,
        imageUrl: dataUrl,
        images: JSON.stringify([dataUrl]),
      }));

      toast.success("Image added to the product form.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to add image.");
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim() || !form.imageUrl.trim() || !form.price || !form.categoryId) {
      toast.error("Name, category, image, and price are required.");
      return;
    }

    const slug = form.slug.trim() || slugify(form.name);
    await onSubmit({
      slug,
      name: form.name.trim(),
      description: form.description || undefined,
      price: form.price,
      originalPrice: form.originalPrice || undefined,
      categoryId: form.categoryId,
      imageUrl: form.imageUrl.trim(),
      images: form.images || undefined,
      sizes: form.sizes || undefined,
      colors: form.colors || undefined,
      brand: form.brand || undefined,
      productcondition: form.productcondition,
      inStock: form.inStock,
      stockCount: form.stockCount,
      featured: form.featured,
      isNew: form.isNew,
      tags: form.tags || undefined,
    });

    setForm(EMPTY_PRODUCT_FORM);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.85fr]">
      <section className="rounded-[2rem] border border-border bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-pink-500">Inventory Desk</p>
            <h2 className="mt-3 text-2xl font-semibold">Manage available stock</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Search catalog items, spot low stock, and load a product back into the editor.
            </p>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, slug, brand..."
              className="pl-11"
            />
          </div>
        </div>

        <div className="mt-6 grid gap-3">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="grid gap-4 rounded-3xl border border-border bg-background/70 p-4 md:grid-cols-[72px_1.4fr_1fr_auto]"
            >
              <img
                src={product.imageUrl}
                alt={product.name}
                className="h-[72px] w-[72px] rounded-2xl object-cover"
              />
              <div className="min-w-0">
                <p className="truncate font-semibold text-foreground">{product.name}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {product.slug}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {product.brand || "Unbranded"} · {product.stockCount ?? 0} in stock
                </p>
              </div>
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-foreground">{formatCurrency(product.price)}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs">
                    {product.inStock ? "Live" : "Paused"}
                  </span>
                  {(product.stockCount ?? 0) <= 3 ? (
                    <span className="rounded-full bg-pink-500/15 px-3 py-1 text-xs text-pink-600 dark:text-pink-200">
                      Low stock
                    </span>
                  ) : null}
                  {product.featured ? (
                    <span className="rounded-full bg-fuchsia-500/15 px-3 py-1 text-xs text-fuchsia-600 dark:text-fuchsia-200">
                      Featured
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => hydrateForm(product)}>
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={async () => {
                    const shouldDelete = window.confirm(
                      `Delete ${product.name} from the storefront catalog?`,
                    );

                    if (!shouldDelete) return;
                    await onDelete(product.id);
                  }}
                  disabled={deletingProductId === product.id}
                >
                  {deletingProductId === product.id ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          ))}
          {filteredProducts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border px-6 py-14 text-center text-muted-foreground">
              No products matched that search yet.
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-[2rem] border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-pink-500">Product Editor</p>
            <h2 className="mt-3 text-2xl font-semibold">Add or refresh inventory</h2>
          </div>
          <button
            type="button"
            onClick={() => setForm(EMPTY_PRODUCT_FORM)}
            className="rounded-full border border-border px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:border-pink-400 hover:text-pink-500"
          >
            Clear
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="inventory-name">Product Name</Label>
            <Input
              id="inventory-name"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value,
                  slug: current.slug || slugify(event.target.value),
                }))
              }
              className="mt-2"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="inventory-slug">Slug</Label>
              <Input
                id="inventory-slug"
                value={form.slug}
                onChange={(event) =>
                  setForm((current) => ({ ...current, slug: slugify(event.target.value) }))
                }
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="inventory-category">Category</Label>
              <select
                id="inventory-category"
                value={form.categoryId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    categoryId: Number.parseInt(event.target.value, 10),
                  }))
                }
                className="mt-2 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400/40"
              >
                <option value={0}>Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="inventory-description">Description</Label>
            <Textarea
              id="inventory-description"
              rows={4}
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
              className="mt-2 rounded-2xl"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="inventory-price">Price</Label>
              <Input
                id="inventory-price"
                type="number"
                min={0}
                value={form.price}
                onChange={(event) =>
                  setForm((current) => ({ ...current, price: event.target.value }))
                }
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="inventory-original-price">Original Price</Label>
              <Input
                id="inventory-original-price"
                type="number"
                min={0}
                value={form.originalPrice}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    originalPrice: event.target.value,
                  }))
                }
                className="mt-2"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="inventory-image">Primary Image URL</Label>
            <Input
              id="inventory-image"
              value={form.imageUrl}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  imageUrl: event.target.value,
                  images: event.target.value ? JSON.stringify([event.target.value]) : "",
                }))
              }
              className="mt-2"
            />
          </div>

          <div className="rounded-3xl border border-border bg-background/70 p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Upload from your device</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Pick an image from your phone or computer and it will be attached directly to this product.
                </p>
              </div>
              <label className="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-border px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-pink-400 hover:text-pink-500">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    void handleImageSelection(event.target.files?.[0]);
                    event.currentTarget.value = "";
                  }}
                />
                {uploadingImage ? "Adding image..." : "Choose image file"}
              </label>
            </div>

            {form.imageUrl ? (
              <div className="mt-4 overflow-hidden rounded-3xl border border-border">
                <img
                  src={form.imageUrl}
                  alt={form.name || "Product preview"}
                  className="h-56 w-full object-cover"
                />
              </div>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="inventory-brand">Brand</Label>
              <Input
                id="inventory-brand"
                value={form.brand}
                onChange={(event) =>
                  setForm((current) => ({ ...current, brand: event.target.value }))
                }
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="inventory-condition">Condition</Label>
              <select
                id="inventory-condition"
                value={form.productcondition}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    productcondition: event.target.value as
                      | "new"
                      | "like_new"
                      | "good"
                      | "fair",
                  }))
                }
                className="mt-2 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400/40"
              >
                {PRODUCT_CONDITION_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="inventory-stock">Stock Count</Label>
              <Input
                id="inventory-stock"
                type="number"
                min={0}
                value={form.stockCount}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    stockCount: Number.parseInt(event.target.value || "0", 10),
                  }))
                }
                className="mt-2"
              />
            </div>
            <label className="mt-7 flex items-center gap-3 text-sm text-foreground">
              <input
                type="checkbox"
                checked={form.inStock}
                onChange={(event) =>
                  setForm((current) => ({ ...current, inStock: event.target.checked }))
                }
                className="h-4 w-4 rounded border-border accent-pink-500"
              />
              In stock
            </label>
            <label className="mt-7 flex items-center gap-3 text-sm text-foreground">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(event) =>
                  setForm((current) => ({ ...current, featured: event.target.checked }))
                }
                className="h-4 w-4 rounded border-border accent-pink-500"
              />
              Featured
            </label>
          </div>

          <label className="flex items-center gap-3 text-sm text-foreground">
            <input
              type="checkbox"
              checked={form.isNew}
              onChange={(event) =>
                setForm((current) => ({ ...current, isNew: event.target.checked }))
              }
              className="h-4 w-4 rounded border-border accent-pink-500"
            />
            Mark as new arrival
          </label>

          <div className="grid gap-4">
            <div>
              <Label htmlFor="inventory-sizes">Sizes</Label>
              <Input
                id="inventory-sizes"
                value={form.sizes}
                onChange={(event) =>
                  setForm((current) => ({ ...current, sizes: event.target.value }))
                }
                className="mt-2"
                placeholder='["S","M","L"]'
              />
            </div>
            <div>
              <Label htmlFor="inventory-colors">Colors</Label>
              <Input
                id="inventory-colors"
                value={form.colors}
                onChange={(event) =>
                  setForm((current) => ({ ...current, colors: event.target.value }))
                }
                className="mt-2"
                placeholder='["Black","Pink"]'
              />
            </div>
            <div>
              <Label htmlFor="inventory-tags">Tags</Label>
              <Input
                id="inventory-tags"
                value={form.tags}
                onChange={(event) =>
                  setForm((current) => ({ ...current, tags: event.target.value }))
                }
                className="mt-2"
                placeholder='["streetwear","editorial"]'
              />
            </div>
          </div>

          <div className="rounded-3xl border border-pink-400/20 bg-pink-500/10 p-4 text-sm text-pink-700 dark:text-pink-200">
            <p className="flex items-center gap-2 font-medium">
              <Sparkles className="h-4 w-4" />
              Tip
            </p>
            <p className="mt-2">
              Keep sizes, colors, and tags as JSON arrays so the storefront can read them cleanly.
            </p>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Saving Product..." : "Save Product"}
          </Button>
        </form>
      </section>
    </div>
  );
}

type CategoryRecord = {
  id: number;
  slug: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  gender?: "men" | "women" | "unisex" | null;
  sortOrder?: number | null;
};

type CategoryManagerProps = {
  categories: CategoryRecord[];
  loading: boolean;
  onSubmit: (payload: {
    slug: string;
    name: string;
    description?: string;
    imageUrl?: string;
    gender?: "men" | "women" | "unisex";
    sortOrder?: number;
  }) => Promise<void>;
};

const EMPTY_CATEGORY_FORM = {
  slug: "",
  name: "",
  description: "",
  imageUrl: "",
  gender: "unisex" as "men" | "women" | "unisex",
  sortOrder: 0,
};

export function CategoryManager({
  categories,
  loading,
  onSubmit,
}: CategoryManagerProps) {
  const [form, setForm] = useState(EMPTY_CATEGORY_FORM);

  function hydrateCategory(category: CategoryRecord) {
    setForm({
      slug: category.slug,
      name: category.name,
      description: category.description ?? "",
      imageUrl: category.imageUrl ?? "",
      gender: category.gender ?? "unisex",
      sortOrder: category.sortOrder ?? 0,
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim()) {
      toast.error("Category name is required.");
      return;
    }

    const slug = form.slug.trim() || slugify(form.name);
    await onSubmit({
      slug,
      name: form.name.trim(),
      description: form.description || undefined,
      imageUrl: form.imageUrl || undefined,
      gender: form.gender,
      sortOrder: form.sortOrder,
    });

    setForm(EMPTY_CATEGORY_FORM);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <section className="rounded-[2rem] border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-pink-500">Category Desk</p>
            <h2 className="mt-3 text-2xl font-semibold">Shape the storefront rails</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Keep every collection organized so products land in the right customer journey.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setForm(EMPTY_CATEGORY_FORM)}
            className="rounded-full border border-border px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:border-pink-400 hover:text-pink-500"
          >
            Clear
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="category-name">Category Name</Label>
              <Input
                id="category-name"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                    slug: current.slug || slugify(event.target.value),
                  }))
                }
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="category-slug">Slug</Label>
              <Input
                id="category-slug"
                value={form.slug}
                onChange={(event) =>
                  setForm((current) => ({ ...current, slug: slugify(event.target.value) }))
                }
                className="mt-2"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_180px]">
            <div>
              <Label htmlFor="category-image">Image URL</Label>
              <Input
                id="category-image"
                value={form.imageUrl}
                onChange={(event) =>
                  setForm((current) => ({ ...current, imageUrl: event.target.value }))
                }
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="category-order">Sort Order</Label>
              <Input
                id="category-order"
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    sortOrder: Number.parseInt(event.target.value || "0", 10),
                  }))
                }
                className="mt-2"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="category-description">Description</Label>
            <Textarea
              id="category-description"
              rows={4}
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
              className="mt-2 rounded-2xl"
            />
          </div>

          <div>
            <Label htmlFor="category-gender">Audience</Label>
            <select
              id="category-gender"
              value={form.gender}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  gender: event.target.value as "men" | "women" | "unisex",
                }))
              }
              className="mt-2 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400/40"
            >
              <option value="unisex">Unisex</option>
              <option value="men">Men</option>
              <option value="women">Women</option>
            </select>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Saving Category..." : "Save Category"}
          </Button>
        </form>
      </section>

      <section className="rounded-[2rem] border border-border bg-card p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-pink-500">Live Collections</p>
        <h2 className="mt-3 text-2xl font-semibold">Current category lineup</h2>
        <div className="mt-6 grid gap-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className="grid gap-4 rounded-3xl border border-border bg-background/70 p-4 md:grid-cols-[1fr_auto]"
            >
              <div>
                <p className="font-semibold text-foreground">{category.name}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {category.slug}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {category.description || "No description yet."}
                </p>
              </div>
              <div className="flex items-center justify-end">
                <Button type="button" variant="outline" onClick={() => hydrateCategory(category)}>
                  Edit
                </Button>
              </div>
            </div>
          ))}
          {categories.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border px-6 py-14 text-center text-muted-foreground">
              Categories will appear here after the first save.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
