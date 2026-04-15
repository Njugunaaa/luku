"use client";

import { motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { Link } from "@/lib/navigation";

// HEADER_HEIGHT must match exactly what header.tsx exports
const HEADER_HEIGHT = 58;

export default function Hero() {
  return (
    /*
      calc(100svh - HEADER_HEIGHT) = exactly the remaining viewport
      after the header. The video fills this space perfectly — no
      scrolling needed to see the full frame on any screen including
      HP Pavilion laptops.
      NO overflow-clip, NO vignette, NO dark overlays.
    */
    <section
      className="relative w-full overflow-hidden bg-black"
      style={{ height: `calc(100svh - ${HEADER_HEIGHT}px)` }}
    >

      {/* ── Video — fills section exactly, no cropping ────────────── */}
      <video
        className="absolute inset-0 h-full w-full object-cover object-center"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        src="/vid.mp4"
      />

      {/* ── Grain — barely visible, just adds film texture ────────── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] opacity-[0.022]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
        }}
      />

      {/* ── CTA — floats at bottom center, zero background ───────── */}
      <motion.div
        className="
          absolute bottom-0 left-0 right-0 z-10
          flex flex-col items-center gap-3
          pb-10 sm:pb-12
          px-4 text-center
        "
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.p
          className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.5em] text-white/60"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.55 }}
        >
          Welcome to Alivella
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.36, duration: 0.55 }}
        >
          <Link
            href="/category/mens-collection"
            className="
              group inline-flex items-center gap-2.5
              rounded-full
              bg-pink-400 hover:bg-pink-300
              px-8 py-3.5
              text-sm font-semibold text-white
              shadow-[0_0_40px_rgba(244,114,182,0.55)]
              hover:shadow-[0_0_56px_rgba(244,114,182,0.75)]
              transition-all duration-300
              hover:-translate-y-0.5 active:translate-y-0
            "
          >
            <ShoppingBag className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
            Shop with us now
          </Link>
        </motion.div>
      </motion.div>

    </section>
  );
}
