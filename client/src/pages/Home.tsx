import { trpc } from "@/lib/trpc";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight,
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
import { CardStack } from "@/components/ui/card-stack";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import ProductCard from "@/components/ProductCard";

// ─── Fade-in section wrapper ──────────────────────────────────────────────────
function FadeInSection({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
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

// ─── Category data ────────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    slug: "mens-collection",
    label: "Men's Collection",
    sub: "Streetwear · Casual · Denim",
    image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=600&q=80",
    color: "from-slate-900/80",
  },
  {
    slug: "womens-collection",
    label: "Women's Collection",
    sub: "Dresses · Tops · Skirts",
    image: "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=600&q=80",
    color: "from-rose-900/80",
  },
  {
    slug: "shoes",
    label: "Shoes",
    sub: "Sneakers · Boots · Heels",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80",
    color: "from-amber-900/80",
  },
  {
    slug: "accessories",
    label: "Accessories",
    sub: "Hats · Belts · Bags",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80",
    color: "from-emerald-900/80",
  },
  {
    slug: "official-wear",
    label: "Official Wear",
    sub: "Suits · Blazers · Formal",
    image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=80",
    color: "from-indigo-900/80",
  },
];

// ─── Carousel items ───────────────────────────────────────────────────────────
const CAROUSEL_ITEMS = [
  {
    id: 1,
    title: "Designer Streetwear",
    description: "Premium thrifted pieces from top brands — curated for the bold.",
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
    description: "From classic sneakers to statement boots — walk in style.",
    imageSrc: "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=700&q=80",
    href: "/category/shoes",
    ctaLabel: "Shop Shoes",
    tag: "Shoes",
  },
  {
    id: 4,
    title: "Statement Accessories",
    description: "Hats, belts, bags and more — the finishing touch to every outfit.",
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
];

// ─── Features ─────────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: Shield, title: "Curated Quality", desc: "Every piece is inspected and graded before listing." },
  { icon: Truck, title: "Fast Delivery", desc: "Nairobi same-day delivery available on select orders." },
  { icon: RefreshCw, title: "Easy Returns", desc: "Not happy? Return within 7 days, no questions asked." },
  { icon: Sparkles, title: "New Drops Weekly", desc: "Fresh inventory added every week — stay ahead of the curve." },
];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Home() {
  const { data: featuredProducts, isLoading } = trpc.products.featured.useQuery();

  return (
    <div className="min-h-screen">
      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-primary">
        {/* Background texture */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}
        />

        {/* Hero image overlay */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 hidden lg:block">
          <img
            src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=80"
            alt="Fashion hero"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/50 to-transparent" />
        </div>

        <div className="container relative z-10">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 bg-accent/20 border border-accent/30 text-accent px-4 py-1.5 rounded-full text-sm font-medium mb-6"
            >
              <Sparkles className="w-3.5 h-3.5" />
              New Collection Dropped
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="font-display text-5xl md:text-7xl font-bold text-primary-foreground leading-[1.05] mb-6"
            >
              Wear the
              <br />
              <span className="text-accent">Story.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-primary-foreground/70 text-lg md:text-xl leading-relaxed mb-8 max-w-lg"
            >
              Discover premium thrifted fashion for the bold generation. Curated designer pieces, streetwear, and official wear — all at honest prices.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap gap-4"
            >
              <Link
                href="/category/mens-collection"
                className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-7 py-3.5 rounded-xl font-semibold text-sm hover:bg-accent/90 transition-all hover:shadow-lg hover:shadow-accent/30 hover:-translate-y-0.5"
              >
                <ShoppingBag className="w-4 h-4" />
                Shop Now
              </Link>
              <Link
                href="/category/official-wear"
                className="inline-flex items-center gap-2 bg-white/10 text-primary-foreground border border-white/20 px-7 py-3.5 rounded-xl font-semibold text-sm hover:bg-white/20 transition-all"
              >
                Official Wear
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex items-center gap-8 mt-12 pt-8 border-t border-white/10"
            >
              {[
                { value: "500+", label: "Items" },
                { value: "100%", label: "Authentic" },
                { value: "2-Day", label: "Delivery" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-bold text-primary-foreground font-display">{stat.value}</p>
                  <p className="text-xs text-primary-foreground/50 uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-1.5">
            <div className="w-1.5 h-2.5 bg-white/60 rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* ── Features Bar ─────────────────────────────────────────────────── */}
      <section className="bg-secondary border-y border-border">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex items-center gap-3 px-4 py-5">
                <div className="w-9 h-9 rounded-lg bg-accent/15 flex items-center justify-center shrink-0">
                  <f.icon className="w-4.5 h-4.5 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{f.title}</p>
                  <p className="text-xs text-muted-foreground hidden md:block">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories Grid ───────────────────────────────────────────────── */}
      <section className="py-20 md:py-28">
        <div className="container">
          <FadeInSection className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent mb-3">Browse by Category</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground">
              Shop Your Style
            </h2>
          </FadeInSection>

          <FadeInSection delay={0.1}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {CATEGORIES.map((cat, i) => (
                <motion.div
                  key={cat.slug}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Link
                    href={`/category/${cat.slug}`}
                    className="group block relative rounded-2xl overflow-hidden aspect-[3/4] bg-secondary"
                  >
                    <img
                      src={cat.image}
                      alt={cat.label}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t ${cat.color} to-transparent`} />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="font-display font-bold text-white text-lg leading-tight">{cat.label}</h3>
                      <p className="text-white/70 text-xs mt-0.5">{cat.sub}</p>
                      <span className="inline-flex items-center gap-1 text-white/90 text-xs font-medium mt-2 group-hover:gap-2 transition-all">
                        Shop <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ── Featured Products ─────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-secondary/50">
        <div className="container">
          <FadeInSection className="flex items-end justify-between mb-12">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-accent mb-3">Hand-Picked</p>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground">
                Featured Pieces
              </h2>
            </div>
            <Link
              href="/category/mens-collection"
              className="hidden md:inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:text-accent transition-colors"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </FadeInSection>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
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
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {(featuredProducts ?? []).slice(0, 8).map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          )}

          <div className="text-center mt-10">
            <Link
              href="/category/mens-collection"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <Package className="w-4 h-4" />
              Browse All Products
            </Link>
          </div>
        </div>
      </section>

      {/* ── Card Stack Carousel ───────────────────────────────────────────── */}
      <section className="py-20 md:py-28 overflow-hidden">
        <div className="container">
          <FadeInSection className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent mb-3">Collections</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground">
              Explore the Looks
            </h2>
            <p className="text-muted-foreground mt-3 max-w-md mx-auto">
              Drag, swipe, or click to explore our curated collections
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

      {/* ── Scroll Animation Section ──────────────────────────────────────── */}
      <section className="bg-primary overflow-hidden">
        <ContainerScroll
          titleComponent={
            <div className="text-center px-4">
              <p className="text-sm font-semibold uppercase tracking-widest text-accent mb-4">The Luku Experience</p>
              <h2 className="font-display text-4xl md:text-6xl font-bold text-primary-foreground leading-tight mb-4">
                Fashion that tells
                <br />
                <span className="text-accent">your story</span>
              </h2>
              <p className="text-primary-foreground/60 text-lg max-w-xl mx-auto">
                Every piece in our collection has a history. We find it, curate it, and bring it to you.
              </p>
            </div>
          }
        >
          <div className="w-full h-full relative overflow-hidden rounded-2xl">
            <img
              src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1400&q=80"
              alt="Fashion store"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-8">
              <div>
                <h3 className="font-display text-3xl font-bold text-white mb-2">The Luku Store</h3>
                <p className="text-white/80 text-sm">Nairobi's finest thrift destination</p>
              </div>
            </div>
          </div>
        </ContainerScroll>
      </section>

      {/* ── Testimonials / Social Proof ───────────────────────────────────── */}
      <section className="py-20 md:py-28">
        <div className="container">
          <FadeInSection className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent mb-3">Reviews</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground">
              What They Say
            </h2>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Amara K.", text: "Found the most amazing vintage denim jacket here. Quality is unreal for the price!", rating: 5, item: "Vintage Levi's Jacket" },
              { name: "Brian O.", text: "The official wear section is 🔥. Got a full suit for my interview and looked sharp!", rating: 5, item: "Navy Blue Suit" },
              { name: "Zara M.", text: "Love the women's collection. The dresses are gorgeous and delivery was super fast.", rating: 5, item: "Floral Midi Dress" },
            ].map((review, i) => (
              <FadeInSection key={review.name} delay={i * 0.1}>
                <div className="bg-card border border-border rounded-2xl p-6 hover-lift">
                  <div className="flex gap-1 mb-3">
                    {Array.from({ length: review.rating }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-accent text-accent" />
                    ))}
                  </div>
                  <p className="text-foreground/80 text-sm leading-relaxed mb-4">"{review.text}"</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-border">
                    <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
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

      {/* ── CTA Banner ────────────────────────────────────────────────────── */}
      <section className="py-20 md:py-24 bg-accent">
        <div className="container text-center">
          <FadeInSection>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-accent-foreground mb-4">
              Ready to find your look?
            </h2>
            <p className="text-accent-foreground/70 text-lg mb-8 max-w-md mx-auto">
              New pieces drop every week. Don't miss out on the best finds.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/category/womens-collection"
                className="inline-flex items-center gap-2 bg-accent-foreground text-accent px-8 py-3.5 rounded-xl font-semibold text-sm hover:bg-accent-foreground/90 transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                <ShoppingBag className="w-4 h-4" />
                Shop Women
              </Link>
              <Link
                href="/category/mens-collection"
                className="inline-flex items-center gap-2 bg-transparent text-accent-foreground border-2 border-accent-foreground/30 px-8 py-3.5 rounded-xl font-semibold text-sm hover:bg-accent-foreground/10 transition-all"
              >
                Shop Men
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </FadeInSection>
        </div>
      </section>
    </div>
  );
}
