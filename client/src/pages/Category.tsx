"use client";

import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { Link, useParams } from "@/lib/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Filter,
  Grid3X3,
  LayoutList,
  Package2,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useMemo, useState } from "react";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
];

const PRODUCT_CONDITION_FILTERS = [
  { value: "", label: "All conditions" },
  { value: "new", label: "New" },
  { value: "like_new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
];

export default function Category() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "";

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [productConditionFilter, setProductConditionFilter] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);

  const { data: category } = api.categories.bySlug.useQuery(
    { slug },
    { enabled: !!slug },
  );
  const { data: products = [], isLoading } = api.products.list.useQuery(
    { categoryId: category?.id, limit: 60 },
    { enabled: !!category?.id },
  );
  const heroTitle = category?.name ?? "Collection";
  const heroDescription =
    category?.description ?? "Browse this collection and discover what is live right now.";
  const heroImage = category?.imageUrl ?? "";
  const hasProducts = products.length > 0;

  const filtered = useMemo(() => {
    let list = [...products];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (product) =>
          product.name.toLowerCase().includes(q) ||
          (product.brand ?? "").toLowerCase().includes(q),
      );
    }
    if (productConditionFilter) {
      list = list.filter((product) => product.productcondition === productConditionFilter);
    }
    if (sortBy === "price-asc") list.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    else if (sortBy === "price-desc") list.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    return list;
  }, [productConditionFilter, products, search, sortBy]);

  if (!slug) {
    return (
      <div className="container py-24 text-center">
        <h2 className="font-display text-2xl font-bold mb-3">Collection unavailable</h2>
        <p className="text-muted-foreground mb-6">
          This category is no longer visible in the storefront.
        </p>
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-accent">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="relative h-56 overflow-hidden bg-primary md:h-72">
        {heroImage ? (
          <img
            src={heroImage}
            alt={heroTitle}
            className="absolute inset-0 h-full w-full object-cover opacity-30"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/50" />
        <div className="container relative z-10 flex h-full flex-col justify-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display mb-3 text-4xl font-bold text-primary-foreground md:text-5xl"
          >
            {heroTitle}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-xl text-sm text-primary-foreground/70 md:text-base"
          >
            {heroDescription}
          </motion.p>
        </div>
      </div>

      <div className="container py-8">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="relative max-w-sm min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9"
            />
          </div>

          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters((current) => !current)}
            className="gap-2"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </Button>

          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`rounded-lg p-2 transition-colors ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`rounded-lg p-2 transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
            >
              <LayoutList className="w-4 h-4" />
            </button>
          </div>
        </div>

        {showFilters ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-6 rounded-xl border border-border bg-card p-4"
          >
            <h3 className="mb-3 text-sm font-semibold">Filter by condition</h3>
            <div className="flex flex-wrap gap-2">
              {PRODUCT_CONDITION_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setProductConditionFilter(filter.value)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    productConditionFilter === filter.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-secondary"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </motion.div>
        ) : null}

        <p className="mb-6 text-sm text-muted-foreground">
          {isLoading
            ? "Loading..."
            : !category
              ? "Collection unavailable"
              : !hasProducts
                ? "Coming Soon"
                : `${filtered.length} item${filtered.length !== 1 ? "s" : ""} found`}
        </p>

        {isLoading ? (
          <div className={`grid gap-5 ${viewMode === "grid" ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-1"}`}>
            {Array.from({ length: 12 }).map((_, index) => (
              <div key={index} className="animate-pulse overflow-hidden rounded-2xl border border-border bg-card">
                <div className="aspect-[3/4] bg-secondary" />
                <div className="space-y-2 p-4">
                  <div className="h-3 w-1/3 rounded bg-secondary" />
                  <div className="h-4 w-3/4 rounded bg-secondary" />
                  <div className="h-4 w-1/2 rounded bg-secondary" />
                </div>
              </div>
            ))}
          </div>
        ) : !category ? (
          <div className="py-24 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
              <ArrowLeft className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Collection unavailable</h3>
            <p className="text-sm text-muted-foreground">
              This category could not be found.
            </p>
          </div>
        ) : !hasProducts ? (
          <div className="py-24 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
              <Package2 className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Coming Soon</h3>
            <p className="text-sm text-muted-foreground">
              We are preparing this collection. Check back soon for the first arrivals.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
              <Filter className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">No products found</h3>
            <p className="text-sm text-muted-foreground">Try adjusting your search or filters.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearch("");
                setProductConditionFilter("");
              }}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className={`grid gap-5 ${viewMode === "grid" ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-1 max-w-2xl"}`}>
            {filtered.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.04, 0.3) }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
