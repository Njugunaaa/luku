import { motion } from "framer-motion";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { Link } from "wouter";

type HeroMediaProps = {
  alt: string;
  className?: string;
  imageSrc: string;
  posterSrc?: string;
  videoSrc?: string;
};

function HeroMedia({ alt, className = "", imageSrc, posterSrc, videoSrc }: HeroMediaProps) {
  if (videoSrc) {
    return (
      <video
        autoPlay
        className={className}
        loop
        muted
        playsInline
        poster={posterSrc ?? imageSrc}
        preload="metadata"
      >
        <source src={videoSrc} type="video/mp4" />
      </video>
    );
  }

  return (
    <img
      alt={alt}
      className={className}
      decoding="async"
      fetchPriority="high"
      loading="eager"
      src={imageSrc}
    />
  );
}

export default function Hero() {
  return (
    <section className="relative isolate flex min-h-[72svh] items-end overflow-clip bg-primary sm:min-h-[78svh] lg:min-h-[88svh]">
      <div className="absolute inset-0">
        <HeroMedia
          alt="Luku fashion motion background"
          className="h-full w-full object-cover object-center"
          imageSrc="/Whisk_mmylrgn4kjy4adz30ynmjwytuwyhrtl1mzn20iz.gif"
        />
      </div>

      <div className="container relative z-10 py-16 sm:py-20 lg:py-24">
        <div className="max-w-xl text-left">
          <motion.p
            animate={{ opacity: 1, y: 0 }}
            className="hero-copy-shadow text-xs font-semibold uppercase tracking-[0.34em] text-primary-foreground sm:text-sm"
            initial={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.45 }}
          >
            Curated thrift
          </motion.p>

          <motion.h1
            animate={{ opacity: 1, y: 0 }}
            className="hero-copy-shadow mt-4 text-balance font-display text-4xl font-semibold leading-[0.94] text-primary-foreground sm:text-5xl md:text-6xl lg:text-7xl"
            initial={{ opacity: 0, y: 22 }}
            transition={{ delay: 0.08, duration: 0.55 }}
          >
            Dress bold.
            <br />
            Shop rare.
          </motion.h1>

          <motion.p
            animate={{ opacity: 1, y: 0 }}
            className="hero-copy-shadow mt-5 max-w-lg text-sm leading-7 text-primary-foreground sm:text-base md:text-lg"
            initial={{ opacity: 0, y: 22 }}
            transition={{ delay: 0.16, duration: 0.55 }}
          >
            Premium streetwear, refined essentials, and standout pieces sourced for modern wardrobes.
          </motion.p>

          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
            initial={{ opacity: 0, y: 22 }}
            transition={{ delay: 0.24, duration: 0.55 }}
          >
            <Link
              className="cta-swoop inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all duration-300 sm:px-7"
              href="/category/mens-collection"
            >
              <ShoppingBag className="h-4 w-4" />
              Shop now
            </Link>
            <Link
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-slate-800 bg-slate-950 px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[0_10px_28px_rgba(0,0,0,0.24)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-900 sm:px-7"
              href="/category/official-wear"
            >
              View collection
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
