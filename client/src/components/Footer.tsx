"use client";

import { Instagram, Mail, MapPin, MessageCircle, Music2 } from "lucide-react";
import { Link } from "@/lib/navigation";
import { useTheme } from "@/contexts/ThemeContext";

const SHOP_LINKS = [
  { label: "Men", href: "/category/mens-collection" },
  { label: "Women", href: "/category/womens-collection" },
  { label: "Shoes", href: "/category/shoes" },
  { label: "Accessories", href: "/category/accessories" },
  { label: "Official Wear", href: "/category/official-wear" },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <footer className="border-t border-border bg-[linear-gradient(180deg,rgba(255,255,255,0),rgba(244,114,182,0.08)),radial-gradient(circle_at_top_left,rgba(251,113,133,0.08),transparent_30%)]">
      
      {/* Top Section */}
      <div className="container py-12 md:py-14">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
          
          {/* Logo + Description */}
          <div>
            <Link href="/" className="shrink-0 flex items-center">
              <img
                src={isDark ? "/alivella_dark_mode1.png" : "/alivella_light_mode1.png"}
                alt="Alivella Boutique"
                className="h-10 w-auto object-contain hover:opacity-70 transition-opacity duration-200"
              />
            </Link>

            <p className="mt-2 max-w-md text-sm leading-7 text-muted-foreground">
              Curated thrift for bold everyday dressing. Fresh drops, cleaner styling, and standout pieces sourced for the Alivella Boutique woman and man.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href="https://www.instagram.com/alivella_botique?utm_source=qr&igsh=eml1b3Bsdm1xNzVk"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-pink-400 hover:text-pink-500"
              >
                <Instagram className="h-4 w-4" />
                Instagram
              </a>

              <a
                href="https://www.tiktok.com/@alivella.botique?_r=1&_t=ZS-95RuldSgtnB"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-pink-400 hover:text-pink-500"
              >
                <Music2 className="h-4 w-4" />
                TikTok
              </a>
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Shop
            </h4>
            <div className="mt-4 grid gap-2.5">
              {SHOP_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-foreground transition-colors hover:text-pink-500"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Contact
            </h4>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-pink-500" />
                <span>Nairobi, Kenya</span>
              </div>

              <div className="flex items-start gap-3">
                <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-pink-500" />
                <a
                  href="https://wa.me/254701887586"
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-pink-500"
                >
                  Chat on WhatsApp
                </a>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-pink-500" />
                <span>DM us on Instagram or TikTok for the fastest response.</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border">
        <div className="container flex flex-col gap-2 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {currentYear} Alivella Boutique. All rights reserved by NjeriCodes.</p>
          <p>Curated in Nairobi for the next standout look.</p>
        </div>
      </div>

    </footer>
  );
}
