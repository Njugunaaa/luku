"use client";

import Hero from "@/components/Hero";
import ProductCard from "@/components/ProductCard";
import { CardStack } from "@/components/ui/card-stack";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { api } from "@/lib/api";
import {
  buildVisibleCategoryIdSet,
  filterProductsByVisibleCategoryIds,
  filterVisibleCategories,
  getCategoryHref,
  getPrimaryCategory,
} from "@/lib/catalog";
import { Link } from "@/lib/navigation";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight,
  Instagram,
  Music2,
  RefreshCw,
  Shield,
  Star,
  Truck,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

function FadeInSection({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function Home() {
  const { data: featuredProducts, isLoading } = api.products.featured.useQuery();
  const { data: categories = [] } = api.categories.list.useQuery();
  const [carouselSize, setCarouselSize] = useState({ width: 440, height: 300 });

  const storefrontCategories = useMemo(() => filterVisibleCategories(categories), [categories]);
  const primaryCategory = useMemo(
    () => getPrimaryCategory(storefrontCategories),
    [storefrontCategories],
  );
  const visibleCategoryIds = useMemo(() => buildVisibleCategoryIdSet(categories), [categories]);
  const visibleFeaturedProducts = useMemo(
    () => filterProductsByVisibleCategoryIds(featuredProducts ?? [], visibleCategoryIds),
    [featuredProducts, visibleCategoryIds],
  );
  const categoryNameById = useMemo(
    () =>
      new Map(
        storefrontCategories.map((category) => [category.id, category.name] as const),
      ),
    [storefrontCategories],
  );
  const featuredPreviewImages = useMemo(
    () => visibleFeaturedProducts.slice(0, 4),
    [visibleFeaturedProducts],
  );
  const categoryCards = useMemo(
    () =>
      storefrontCategories.map((category, index) => ({
        id: category.id,
        label: category.name,
        sub: category.description || "Explore the latest arrivals in this collection.",
        image: category.imageUrl || "",
        href: getCategoryHref(category),
        color:
          index % 3 === 0
            ? "from-rose-900/80"
            : index % 3 === 1
              ? "from-amber-900/80"
              : "from-emerald-900/80",
      })),
    [storefrontCategories],
  );
  const carouselItems = useMemo(
    () =>
      storefrontCategories.slice(0, 5).map((category) => ({
        id: category.id,
        title: category.name,
        description:
          category.description || "Discover the newest pieces available in this collection.",
        imageSrc: category.imageUrl || "",
        href: getCategoryHref(category),
        ctaLabel: `Shop ${category.name}`,
        tag: category.name,
      })),
    [storefrontCategories],
  );

  useEffect(() => {
    const updateCarouselSize = () => {
      const isMobile = window.innerWidth < 640;
      setCarouselSize({
        width: isMobile ? 300 : 440,
        height: isMobile ? 220 : 300,
      });
    };

    updateCarouselSize();
    window.addEventListener("resize", updateCarouselSize);

    return () => window.removeEventListener("resize", updateCarouselSize);
  }, []);

  return (
    <div className="min-h-screen overflow-x-clip">
      <Hero />

      <section className="border-b border-border bg-background py-5">
        <div className="container">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card px-5 py-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-widest text-pink-500">
                Don't miss the next drop
              </p>
              <p className="mt-1 text-md font-medium text-foreground">
                Follow us to know when our next stock drops.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-sm text-muted-foreground">
                  <Truck className="h-3 w-3" /> Fast Nairobi delivery
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-sm text-muted-foreground">
                  <RefreshCw className="h-3 w-3" /> Easy returns
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-sm text-muted-foreground">
                  <Shield className="h-3 w-3" /> Secure checkout
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <a
                href="https://www.instagram.com/alivella_botique"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-lg border border-border bg-background px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:border-pink-400"
              >
                <Instagram className="h-4 w-4 text-pink-500" />
                Instagram
              </a>
              <a
                href="https://www.tiktok.com/@alivella.botique"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-lg border border-border bg-background px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:border-pink-400"
              >
                <Music2 className="h-4 w-4 text-pink-500" />
                TikTok
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="py-5 md:py-28">
        <div className="container">
          <FadeInSection className="mb-12 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent">Browse by Category</p>
            <h2 className="font-display text-4xl font-bold text-foreground md:text-5xl">Shop Your Style</h2>
          </FadeInSection>

          <FadeInSection delay={0.1}>
            {categoryCards.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border px-6 py-14 text-center text-muted-foreground">
                Collections will appear here as soon as categories are available.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                {categoryCards.map((category, index) => (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.08 }}
                  >
                    <Link
                      href={category.href}
                      className="group relative block aspect-[3/4] overflow-hidden rounded-2xl bg-secondary"
                    >
                      {category.image ? (
                        <img
                          src={category.image}
                          alt={category.label}
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : null}
                      <div className={`absolute inset-0 bg-gradient-to-t ${category.color} to-transparent`} />
                      <div className="absolute inset-x-0 bottom-0 p-4">
                        <h3 className="font-display text-lg font-bold leading-tight text-white">{category.label}</h3>
                        <p className="mt-0.5 line-clamp-2 text-xs text-white/70">{category.sub}</p>
                        <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-white/90 transition-all group-hover:gap-2">
                          Shop <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </FadeInSection>
        </div>
      </section>

      <section className="bg-secondary/50 py-20 md:py-28">
        <div className="container">
          <FadeInSection className="mb-12 flex items-end justify-between">
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent">Live Catalog Edit</p>
              <h2 className="font-display text-4xl font-bold text-foreground md:text-5xl">Featured Pieces</h2>
              <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
                A rotating mix from your live catalog, balanced across categories as you keep adding more collections.
              </p>
            </div>
            <Link
              href={getCategoryHref(primaryCategory)}
              className="hidden items-center gap-2 text-sm font-semibold text-foreground transition-colors hover:text-accent md:inline-flex"
            >
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </FadeInSection>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
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
          ) : visibleFeaturedProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
              {visibleFeaturedProducts.slice(0, 8).map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.06 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-border px-6 py-14 text-center text-muted-foreground">
              Products will appear here automatically as soon as the catalog has live items.
            </div>
          )}

          {featuredPreviewImages.length > 0 ? (
            <div className="mt-10 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[1.75rem] border border-border bg-card p-4 shadow-sm">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {featuredPreviewImages.map((product, index) => (
                    <motion.div
                      key={`preview-${product.id}`}
                      initial={{ opacity: 0, y: 18 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.06 }}
                    >
                      <Link
                        href={`/product/${product.slug}`}
                        className="group relative block aspect-[4/5] overflow-hidden rounded-[1.35rem] bg-secondary"
                      >
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 p-3">
                          <p className="line-clamp-1 text-sm font-semibold text-white">{product.name}</p>
                          <p className="mt-1 text-[11px] uppercase tracking-[0.24em] text-white/72">
                            {categoryNameById.get(product.categoryId) ?? "Catalog"}
                          </p>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.75rem] bg-[linear-gradient(135deg,#1f2937_0%,#0f172a_100%)] p-6 text-white shadow-[0_24px_60px_-32px_rgba(15,23,42,0.5)]">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
                  Catalog rotation
                </p>
                <h3 className="mt-4 font-display text-3xl font-semibold leading-tight">
                  The homepage now refreshes from your actual stock.
                </h3>
                <p className="mt-4 text-sm leading-7 text-white/72">
                  Instead of a static browse button here, shoppers now see live product imagery pulled from the catalog, with category variety built in.
                </p>
                <Link
                  href={getCategoryHref(primaryCategory)}
                  className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/12"
                >
                  <ArrowRight className="h-4 w-4" />
                  Explore collections
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="overflow-hidden py-20 md:py-28">
        <div className="container">
          <FadeInSection className="mb-12 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent">Collections</p>
            <h2 className="font-display text-4xl font-bold text-foreground md:text-5xl">Explore the Looks</h2>
            <p className="mx-auto mt-3 max-w-md text-muted-foreground">
              Drag, swipe, or click to explore our curated collections.
            </p>
          </FadeInSection>

          {carouselItems.length > 0 ? (
            <CardStack
              items={carouselItems}
              cardWidth={carouselSize.width}
              cardHeight={carouselSize.height}
              autoAdvance
              intervalMs={3500}
              pauseOnHover
              loop
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-border px-6 py-14 text-center text-muted-foreground">
              Category highlights will appear here after the storefront categories load.
            </div>
          )}
        </div>
      </section>

      <section className="overflow-hidden bg-primary">
        <ContainerScroll
          titleComponent={
            <div className="px-4 text-center">
              <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-accent">The Alivella Boutique Experience</p>
              <h2 className="font-display mb-4 text-4xl font-bold leading-tight text-primary-foreground md:text-6xl">
                Fashion that tells
                <br />
                <span className="text-accent">your story</span>
              </h2>
              <p className="mx-auto max-w-xl text-lg text-primary-foreground/60">
                Every piece in our collection has a history. We find it, curate it, and bring it to you.
              </p>
            </div>
          }
        >
          <div className="relative h-full w-full overflow-hidden rounded-2xl">
            <img
              src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1400&q=80"
              alt="Fashion store"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-transparent to-transparent p-8">
              <div>
                <h3 className="mb-2 font-display text-3xl font-bold text-white">The Alivella Boutique Store</h3>
                <p className="text-sm text-white/80">Nairobi's finest thrift destination</p>
              </div>
            </div>
          </div>
        </ContainerScroll>
      </section>

      <section className="py-20 md:py-28">
        <div className="container">
          <FadeInSection className="mb-12 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent">Reviews</p>
            <h2 className="font-display text-4xl font-bold text-foreground md:text-5xl">What They Say</h2>
          </FadeInSection>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                name: "Amara K.",
                text: "Found the most amazing vintage denim jacket here. Quality is unreal for the price!",
                rating: 5,
                item: "Vintage Levi's Jacket",
              },
              {
                name: "Brian O.",
                text: "The shoe edit is fire. Got a full look for my interview and looked sharp!",
                rating: 5,
                item: "Classic Derby Shoes",
              },
              {
                name: "Zara M.",
                text: "Love the women's collection. The dresses are gorgeous and delivery was super fast.",
                rating: 5,
                item: "Floral Midi Dress",
              },
            ].map((review, index) => (
              <FadeInSection key={review.name} delay={index * 0.1}>
                <div className="hover-lift rounded-2xl border border-border bg-card p-6">
                  <div className="mb-3 flex gap-1">
                    {Array.from({ length: review.rating }).map((_, starIndex) => (
                      <Star key={starIndex} className="h-4 w-4 fill-accent text-accent" />
                    ))}
                  </div>
                  <p className="mb-4 text-sm leading-relaxed text-foreground/80">"{review.text}"</p>
                  <div className="flex items-center gap-3 border-t border-border pt-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      {review.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{review.name}</p>
                      <p className="text-xs text-muted-foreground">{review.item}</p>
                    </div>
                  </div>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
