import Hero from "@/components/Hero";
import ProductCard from "@/components/ProductCard";
import { CardStack } from "@/components/ui/card-stack";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { api } from "@/lib/api";
import { normalizeArray } from "@/lib/normalizeArray";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight,
  Instagram,
  Music2,
  Package,
  RefreshCw,
  Shield,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
} from "lucide-react";
import { useRef } from "react";
import { Link } from "wouter";

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

const CATEGORIES = [
  {
    slug: "mens-collection",
    label: "Men's Collection",
    sub: "Streetwear / Casual / Denim",
    image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=600&q=80",
    color: "from-slate-900/80",
  },
  {
    slug: "womens-collection",
    label: "Women's Collection",
    sub: "Dresses / Tops / Skirts",
    image: "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=600&q=80",
    color: "from-rose-900/80",
  },
  {
    slug: "shoes",
    label: "Shoes",
    sub: "Sneakers / Boots / Heels",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80",
    color: "from-amber-900/80",
  },
  {
    slug: "accessories",
    label: "Accessories",
    sub: "Hats / Belts / Bags",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80",
    color: "from-emerald-900/80",
  },
  {
    slug: "official-wear",
    label: "Official Wear",
    sub: "Suits / Blazers / Formal",
    image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=80",
    color: "from-indigo-900/80",
  },
] as const;

const CAROUSEL_ITEMS = [
  {
    id: 1,
    title: "Designer Streetwear",
    description: "Premium thrifted pieces from top brands curated for the bold.",
    imageSrc: "https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=700&q=80",
    href: "/category/mens-collection",
    ctaLabel: "Shop Men",
    tag: "Men's Collection",
  },
  {
    id: 2,
    title: "Elegant Women's Wear",
    description: "Stunning dresses, blouses, and co-ords for every occasion.",
    imageSrc: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=700&q=80",
    href: "/category/womens-collection",
    ctaLabel: "Shop Women",
    tag: "Women's Collection",
  },
  {
    id: 3,
    title: "Iconic Footwear",
    description: "From classic sneakers to statement boots, walk in style.",
    imageSrc: "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=700&q=80",
    href: "/category/shoes",
    ctaLabel: "Shop Shoes",
    tag: "Shoes",
  },
  {
    id: 4,
    title: "Statement Accessories",
    description: "Hats, belts, bags and more for the finishing touch.",
    imageSrc: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=700&q=80",
    href: "/category/accessories",
    ctaLabel: "Shop Accessories",
    tag: "Accessories",
  },
  {
    id: 5,
    title: "Power Suits & Formal",
    description: "Look sharp in our curated official wear collection.",
    imageSrc: "https://images.unsplash.com/photo-1594938298603-c8148c4b4a0e?w=700&q=80",
    href: "/category/official-wear",
    ctaLabel: "Shop Official",
    tag: "Official Wear",
  },
] as const;

export default function Home() {
  const { data: featuredProducts, isLoading } = api.products.featured.useQuery();

  return (
    <div className="min-h-screen overflow-x-clip">
      <Hero />

      {/* ── Social / trust strip ── */}
      <section className="border-b border-border bg-background py-5">
        <div className="container">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card px-5 py-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-widest text-pink-500">
                Don&apos;t miss the next drop
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
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
              {CATEGORIES.map((category, index) => (
                <motion.div
                  key={category.slug}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                >
                  <Link
                    href={`/category/${category.slug}`}
                    className="group relative block aspect-[3/4] overflow-hidden rounded-2xl bg-secondary"
                  >
                    <img
                      src={category.image}
                      alt={category.label}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t ${category.color} to-transparent`} />
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <h3 className="font-display text-lg font-bold leading-tight text-white">{category.label}</h3>
                      <p className="mt-0.5 text-xs text-white/70">{category.sub}</p>
                      <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-white/90 transition-all group-hover:gap-2">
                        Shop <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </FadeInSection>
        </div>
      </section>

      <section className="bg-secondary/50 py-20 md:py-28">
        <div className="container">
          <FadeInSection className="mb-12 flex items-end justify-between">
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent">Hand-Picked</p>
              <h2 className="font-display text-4xl font-bold text-foreground md:text-5xl">Featured Pieces</h2>
            </div>
            <Link
              href="/category/mens-collection"
              className="hidden items-center gap-2 text-sm font-semibold text-foreground transition-colors hover:text-accent md:inline-flex"
            >
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </FadeInSection>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="overflow-hidden rounded-2xl border border-border bg-card animate-pulse">
                  <div className="aspect-[3/4] bg-secondary" />
                  <div className="space-y-2 p-4">
                    <div className="h-3 w-1/3 rounded bg-secondary" />
                    <div className="h-4 w-3/4 rounded bg-secondary" />
                    <div className="h-4 w-1/2 rounded bg-secondary" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
              {normalizeArray<any>(featuredProducts).slice(0, 8).map((product, index) => (
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
          )}

          <div className="mt-10 text-center">
            <Link
              href="/category/mens-collection"
              className="cta-swoop inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-semibold transition-all"
            >
              <Package className="h-4 w-4" />
              Browse All Products
            </Link>
          </div>
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

          <CardStack
            items={CAROUSEL_ITEMS}
            cardWidth={typeof window !== "undefined" && window.innerWidth < 640 ? 300 : 440}
            cardHeight={typeof window !== "undefined" && window.innerWidth < 640 ? 220 : 300}
            autoAdvance
            intervalMs={3500}
            pauseOnHover
            loop
          />
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
                <p className="text-sm text-white/80">Nairobi&apos;s finest thrift destination</p>
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
                text: "The official wear section is fire. Got a full suit for my interview and looked sharp!",
                rating: 5,
                item: "Navy Blue Suit",
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
                  <p className="mb-4 text-sm leading-relaxed text-foreground/80">&quot;{review.text}&quot;</p>
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