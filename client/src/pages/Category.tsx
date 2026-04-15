"use client";

import { api } from "@/lib/api";
import { motion } from "framer-motion";
import { Filter, Grid3X3, LayoutList, Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "@/lib/navigation";
import ProductCard from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const CATEGORY_META: Record<string, { title: string; description: string; heroImage: string }> = {
  "mens-collection": {
    title: "Men's Collection",
    description: "Streetwear, casual fits, denim, sweaters, hoodies, and more — curated for the modern man.",
    heroImage: "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=1200&q=80",
  },
  "womens-collection": {
    title: "Women's Collection",
    description: "Stunning dresses, elegant tops, chic skirts, and everything in between.",
    heroImage: "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=1200&q=80",
  },
  "shoes": {
    title: "Shoes",
    description: "Sneakers, boots, heels, loafers — step out in style with our footwear collection.",
    heroImage: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&q=80",
  },
  "accessories": {
    title: "Accessories",
    description: "Hats, belts, bags, scarves, sunglasses — the details that define your look.",
    heroImage: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1200&q=80",
  },
  "official-wear": {
    title: "Official Wear",
    description: "Men's suits, women's trouser suits, blazers, skirt suits — power dressing for every occasion.",
    heroImage: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1200&q=80",
  },
};

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
];

const productcondition_FILTERS = [
  { value: "", label: "All productconditions" },
  { value: "new", label: "New" },
  { value: "like_new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
];

export default function Category() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "";
  const meta = CATEGORY_META[slug] ?? { title: "Collection", description: "", heroImage: "" };

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [productconditionFilter, setproductconditionFilter] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);

  const { data: category } = api.categories.bySlug.useQuery({ slug }, { enabled: !!slug });
  const { data: products = [], isLoading } = api.products.list.useQuery(
    { categoryId: category?.id, limit: 60 },
    { enabled: !!category?.id }
  );

  const filtered = useMemo(() => {
    let list = [...products];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || (p.brand ?? "").toLowerCase().includes(q));
    }
    if (productconditionFilter) {
      list = list.filter(p => p.productcondition === productconditionFilter);
    }
    if (sortBy === "price-asc") list.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    else if (sortBy === "price-desc") list.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    return list;
  }, [products, search, productconditionFilter, sortBy]);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative h-56 md:h-72 overflow-hidden bg-primary">
        {meta.heroImage && (
          <img src={meta.heroImage} alt={meta.title} className="absolute inset-0 w-full h-full object-cover opacity-30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/50" />
        <div className="container relative z-10 h-full flex flex-col justify-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-4xl md:text-5xl font-bold text-primary-foreground mb-3"
          >
            {meta.title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-primary-foreground/70 max-w-xl text-sm md:text-base"
          >
            {meta.description}
          </motion.p>
        </div>
      </div>

      <div className="container py-8">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </Button>

          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-colors ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
            >
              <LayoutList className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-card border border-border rounded-xl p-4 mb-6"
          >
            <h3 className="text-sm font-semibold mb-3">Filter by productcondition</h3>
            <div className="flex flex-wrap gap-2">
              {productcondition_FILTERS.map(f => (
                <button
                  key={f.value}
                  onClick={() => setproductconditionFilter(f.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                    productconditionFilter === f.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:bg-secondary"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Count */}
        <p className="text-sm text-muted-foreground mb-6">
          {isLoading ? "Loading..." : `${filtered.length} item${filtered.length !== 1 ? "s" : ""} found`}
        </p>

        {/* Products */}
        {isLoading ? (
          <div className={`grid gap-5 ${viewMode === "grid" ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-1"}`}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-card rounded-2xl overflow-hidden border border-border animate-pulse">
                <div className="aspect-[3/4] bg-secondary" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-secondary rounded w-1/3" />
                  <div className="h-4 bg-secondary rounded w-3/4" />
                  <div className="h-4 bg-secondary rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <Filter className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">No products found</h3>
            <p className="text-muted-foreground text-sm">Try adjusting your search or filters</p>
            <Button variant="outline" className="mt-4" onClick={() => { setSearch(""); setproductconditionFilter(""); }}>
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className={`grid gap-5 ${viewMode === "grid" ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-1 max-w-2xl"}`}>
            {filtered.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
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
