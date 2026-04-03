"use client";

import * as React from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

function cn(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(" ");
}

export type CardStackItem = {
  id: string | number;
  title: string;
  description?: string;
  imageSrc?: string;
  href?: string;
  ctaLabel?: string;
  tag?: string;
};

export type CardStackProps<T extends CardStackItem> = {
  items: readonly T[];
  initialIndex?: number;
  maxVisible?: number;
  cardWidth?: number;
  cardHeight?: number;
  overlap?: number;
  spreadDeg?: number;
  perspectivePx?: number;
  depthPx?: number;
  tiltXDeg?: number;
  activeLiftPx?: number;
  activeScale?: number;
  inactiveScale?: number;
  springStiffness?: number;
  springDamping?: number;
  loop?: boolean;
  autoAdvance?: boolean;
  intervalMs?: number;
  pauseOnHover?: boolean;
  showDots?: boolean;
  className?: string;
  onChangeIndex?: (index: number, item: T) => void;
  renderCard?: (item: T, state: { active: boolean }) => React.ReactNode;
};

function wrapIndex(n: number, len: number) {
  if (len <= 0) return 0;
  return ((n % len) + len) % len;
}

function signedOffset(i: number, active: number, len: number, loop: boolean) {
  const raw = i - active;
  if (!loop || len <= 1) return raw;
  const alt = raw > 0 ? raw - len : raw + len;
  return Math.abs(alt) < Math.abs(raw) ? alt : raw;
}

export function CardStack<T extends CardStackItem>({
  items,
  initialIndex = 0,
  maxVisible = 5,
  cardWidth = 420,
  cardHeight = 280,
  overlap = 0.5,
  spreadDeg = 40,
  perspectivePx = 1100,
  depthPx = 120,
  tiltXDeg = 10,
  activeLiftPx = 20,
  activeScale = 1.04,
  inactiveScale = 0.93,
  springStiffness = 280,
  springDamping = 28,
  loop = true,
  autoAdvance = true,
  intervalMs = 3000,
  pauseOnHover = true,
  showDots = true,
  className,
  onChangeIndex,
  renderCard,
}: CardStackProps<T>) {
  const reduceMotion = useReducedMotion();
  const len = items.length;

  const [active, setActive] = React.useState(() => wrapIndex(initialIndex, len));
  const [hovering, setHovering] = React.useState(false);

  React.useEffect(() => { setActive((a) => wrapIndex(a, len)); }, [len]);
  React.useEffect(() => { if (!len) return; onChangeIndex?.(active, items[active]!); }, [active]);

  const maxOffset = Math.max(0, Math.floor(maxVisible / 2));
  const cardSpacing = Math.max(10, Math.round(cardWidth * (1 - overlap)));
  const stepDeg = maxOffset > 0 ? spreadDeg / maxOffset : 0;
  const canGoPrev = loop || active > 0;
  const canGoNext = loop || active < len - 1;

  const prev = React.useCallback(() => { if (!len || !canGoPrev) return; setActive((a) => wrapIndex(a - 1, len)); }, [canGoPrev, len]);
  const next = React.useCallback(() => { if (!len || !canGoNext) return; setActive((a) => wrapIndex(a + 1, len)); }, [canGoNext, len]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
  };

  React.useEffect(() => {
    if (!autoAdvance || reduceMotion || !len || (pauseOnHover && hovering)) return;
    const id = window.setInterval(() => { if (loop || active < len - 1) next(); }, Math.max(700, intervalMs));
    return () => window.clearInterval(id);
  }, [autoAdvance, intervalMs, hovering, pauseOnHover, reduceMotion, len, loop, active, next]);

  if (!len) return null;

  return (
    <div
      className={cn("w-full", className)}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div
        className="relative w-full"
        style={{ height: Math.max(340, cardHeight + 80) }}
        tabIndex={0}
        onKeyDown={onKeyDown}
      >
        <div className="pointer-events-none absolute inset-x-0 top-6 mx-auto h-40 w-[60%] rounded-full bg-black/5 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto h-32 w-[70%] rounded-full bg-black/8 blur-3xl" aria-hidden="true" />

        <div className="absolute inset-0 flex items-end justify-center" style={{ perspective: `${perspectivePx}px` }}>
          <AnimatePresence initial={false}>
            {items.map((item, i) => {
              const off = signedOffset(i, active, len, loop);
              const abs = Math.abs(off);
              const visible = abs <= maxOffset;
              if (!visible) return null;

              const rotateZ = off * stepDeg;
              const x = off * cardSpacing;
              const y = abs * 8;
              const z = -abs * depthPx;
              const isActive = off === 0;
              const scale = isActive ? activeScale : inactiveScale;
              const lift = isActive ? -activeLiftPx : 0;
              const rotateX = isActive ? 0 : tiltXDeg;
              const zIndex = 100 - abs;

              const dragProps = isActive ? {
                drag: "x" as const,
                dragConstraints: { left: 0, right: 0 },
                dragElastic: 0.18,
                onDragEnd: (_e: any, info: { offset: { x: number }; velocity: { x: number } }) => {
                  if (reduceMotion) return;
                  const travel = info.offset.x;
                  const v = info.velocity.x;
                  const threshold = Math.min(160, cardWidth * 0.22);
                  if (travel > threshold || v > 650) prev();
                  else if (travel < -threshold || v < -650) next();
                },
              } : {};

              return (
                <motion.div
                  key={item.id}
                  className={cn(
                    "absolute bottom-0 rounded-2xl overflow-hidden shadow-xl will-change-transform select-none",
                    isActive ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
                  )}
                  style={{ width: cardWidth, height: cardHeight, zIndex, transformStyle: "preserve-3d" }}
                  initial={reduceMotion ? false : { opacity: 0, y: y + 40, x, rotateZ, rotateX, scale }}
                  animate={{ opacity: 1, x, y: y + lift, rotateZ, rotateX, scale }}
                  transition={{ type: "spring", stiffness: springStiffness, damping: springDamping }}
                  onClick={() => setActive(i)}
                  {...dragProps}
                >
                  <div className="h-full w-full" style={{ transform: `translateZ(${z}px)`, transformStyle: "preserve-3d" }}>
                    {renderCard ? renderCard(item, { active: isActive }) : (
                      <DefaultCard item={item} active={isActive} />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4 mt-6">
        <button
          onClick={prev}
          disabled={!canGoPrev}
          className="w-10 h-10 rounded-full border border-border bg-card flex items-center justify-center hover:bg-secondary disabled:opacity-40 transition-colors shadow-sm"
          aria-label="Previous"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {showDots && (
          <div className="flex gap-2">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={cn(
                  "rounded-full transition-all duration-300",
                  i === active ? "w-6 h-2.5 bg-primary" : "w-2.5 h-2.5 bg-border hover:bg-muted-foreground"
                )}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}

        <button
          onClick={next}
          disabled={!canGoNext}
          className="w-10 h-10 rounded-full border border-border bg-card flex items-center justify-center hover:bg-secondary disabled:opacity-40 transition-colors shadow-sm"
          aria-label="Next"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function DefaultCard({ item, active }: { item: CardStackItem; active: boolean }) {
  return (
    <div className="relative w-full h-full overflow-hidden rounded-2xl bg-gradient-to-br from-secondary to-muted">
      {item.imageSrc && (
        <img src={item.imageSrc} alt={item.title} className="absolute inset-0 w-full h-full object-cover" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5">
        {item.tag && (
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-white/70 mb-1">
            {item.tag}
          </span>
        )}
        <h3 className="font-display font-bold text-white text-xl leading-tight mb-1">{item.title}</h3>
        {item.description && (
          <p className="text-white/80 text-sm line-clamp-2">{item.description}</p>
        )}
        {item.href && (
          <a
            href={item.href}
            className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-white bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full hover:bg-white/30 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {item.ctaLabel ?? "Shop Now"}
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}
