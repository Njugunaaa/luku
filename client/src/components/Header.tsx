"use client";

import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { useCart } from "@/contexts/CartContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  ChevronDown,
  LogIn,
  LogOut,
  Menu,
  Moon,
  Package,
  ShieldCheck,
  ShoppingBag,
  Sun,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "@/lib/navigation";

const NAV_LINKS = [
  { label: "Men", href: "/category/mens-collection" },
  { label: "Women", href: "/category/womens-collection" },
  { label: "Shoes", href: "/category/shoes" },
  { label: "Accessories", href: "/category/accessories" },
  { label: "Official Wear", href: "/category/official-wear" },
];

const HEADER_HEIGHT = 58; // reduced from 72

export default function Header() {
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { itemCount } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isDark = theme === "dark";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location]);

  const navLinkClass = (href: string) => {
    const active = location.startsWith(href);
    return `
      px-3.5 py-1.5 text-[15px] font-medium tracking-wide rounded-full
      transition-all duration-200 select-none whitespace-nowrap
      ${active
        ? "text-white bg-pink-400 ring-1 ring-pink-300/50 shadow-[0_0_14px_rgba(244,114,182,0.4)]"
        : isDark
          ? "text-white/55 hover:text-white hover:bg-white/8"
          : "text-black/50 hover:text-black hover:bg-black/6"
      }
    `;
  };

  const iconBtn = (size: "sm" | "md" = "sm") => `
    inline-flex items-center justify-center rounded-full border
    transition-all duration-200 shrink-0
    ${size === "md" ? "h-11 w-11" : "h-8 w-8"}
    ${isDark
      ? "border-white/12 text-white/65 hover:text-white hover:bg-white/8 hover:border-white/25"
      : "border-black/10 text-black/55 hover:text-black hover:bg-black/6 hover:border-black/20"
    }
  `;

  return (
    <>
      <header
        className={`
          fixed top-0 left-0 right-0 z-50 transition-all duration-300
          ${isDark
            ? scrolled
              ? "bg-neutral-950 border-b border-white/8 shadow-[0_2px_20px_rgba(0,0,0,0.5)]"
              : "bg-neutral-950"
            : scrolled
              ? "bg-white border-b border-black/8 shadow-[0_2px_20px_rgba(0,0,0,0.06)]"
              : "bg-white"
          }
        `}
        style={{ height: HEADER_HEIGHT }}
      >
        <div className="container h-full px-4 md:px-6">
          <div className="flex items-center justify-between h-full gap-4">

            {/* ── Logo ──────────────────────────────────────────────── */}
            <Link href="/" className="shrink-0 flex items-center h-full">
              <img
                src={isDark ? "/alivella_dark_mode1.png" : "/alivella_light_mode1.png"}
                alt="Alivella Boutique"
                className="h-13 w-auto object-contain hover:opacity-70 transition-opacity duration-200"
              />
            </Link>

            {/* ── Desktop Nav — centered ─────────────────────────────── */}
            <nav className="hidden md:flex items-center gap-0.5 mx-auto">
              {NAV_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className={navLinkClass(link.href)}>
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* ── Desktop Right ─────────────────────────────────────── */}
            <div className="hidden md:flex items-center gap-1.5 shrink-0">
              <button type="button" onClick={toggleTheme} aria-label="Toggle theme" className={iconBtn()}>
                {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              </button>

              <Link href="/cart" className={`${iconBtn()} relative`}>
                <ShoppingBag className="h-3.5 w-3.5" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-pink-400 text-[8px] font-bold text-white">
                    {itemCount > 9 ? "9+" : itemCount}
                  </span>
                )}
              </Link>

              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className={`
                      flex items-center gap-1.5 rounded-full border px-2 py-1
                      outline-none transition-all duration-200
                      ${isDark
                        ? "border-white/12 hover:bg-white/7 hover:border-white/22"
                        : "border-black/10 hover:bg-black/4 hover:border-black/18"
                      }
                    `}>
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-pink-300 to-pink-500 flex items-center justify-center text-[10px] font-bold text-white">
                        {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                      </div>
                      <span className={`hidden sm:block text-xs font-medium max-w-[72px] truncate ${isDark ? "text-white/75" : "text-black/65"}`}>
                        {user?.name?.split(" ")[0] ?? "Account"}
                      </span>
                      <ChevronDown className={`w-2.5 h-2.5 ${isDark ? "text-white/35" : "text-black/30"}`} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className={`
                    w-52 rounded-2xl border shadow-2xl p-0 overflow-hidden
                    ${isDark ? "bg-neutral-950 border-white/10" : "bg-white border-black/10"}
                  `}>
                    <DropdownMenuLabel className="px-4 py-3">
                      <p className={`text-sm font-semibold truncate ${isDark ? "text-white" : "text-black"}`}>{user?.name}</p>
                      <p className={`text-xs truncate mt-0.5 ${isDark ? "text-white/40" : "text-black/40"}`}>{user?.email}</p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className={isDark ? "bg-white/8" : "bg-black/8"} />
                    <DropdownMenuItem asChild>
                      <Link href="/account/orders" className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer text-sm ${isDark ? "text-white/65 hover:text-white" : "text-black/60 hover:text-black"}`}>
                        <Package className="w-4 h-4 opacity-50" /> My Orders
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/account" className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer text-sm ${isDark ? "text-white/65 hover:text-white" : "text-black/60 hover:text-black"}`}>
                        <User className="w-4 h-4 opacity-50" /> Account
                      </Link>
                    </DropdownMenuItem>
                    {user?.role === "admin" && (
                      <>
                        <DropdownMenuSeparator className={isDark ? "bg-white/8" : "bg-black/8"} />
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="flex items-center gap-3 px-4 py-2.5 text-pink-400 cursor-pointer text-sm">
                            <ShieldCheck className="w-4 h-4" /> Admin Panel
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator className={isDark ? "bg-white/8" : "bg-black/8"} />
                    <DropdownMenuItem
                      onClick={() => logout()}
                      className="flex items-center gap-3 px-4 py-2.5 text-red-400 cursor-pointer focus:text-red-400 focus:bg-red-500/8 text-sm"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/login" className={`
                  inline-flex items-center gap-1.5 rounded-full border
                  px-3.5 py-1.5 text-sm font-medium transition-all duration-200
                  ${isDark
                    ? "border-white/18 text-white/75 hover:bg-white/8 hover:text-white"
                    : "border-black/12 text-black/65 hover:bg-black/5 hover:text-black"
                  }
                `}>
                  <LogIn className="w-3 h-3" /> Sign In
                </Link>
              )}
            </div>

            {/* ── Mobile Right ──────────────────────────────────────── */}
            <div className="flex md:hidden items-center gap-3 shrink-0">
              <Link href="/cart" className={`${iconBtn("md")} relative`}>
                <ShoppingBag className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-pink-400 text-[10px] font-bold text-white shadow-sm">
                    {itemCount > 9 ? "9+" : itemCount}
                  </span>
                )}
              </Link>

              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <button className={iconBtn("md")} aria-label="Open menu">
                    <Menu className="w-5 h-5" />
                  </button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className={`
                    w-[82vw] max-w-sm p-0 border-l
                    ${isDark ? "bg-neutral-950 border-white/10" : "bg-white border-black/10"}
                  `}
                >
                  {/* Sheet header */}
                  <div className={`flex items-center justify-between px-5 py-5 border-b ${isDark ? "border-white/8" : "border-black/8"}`}>
                    <img
                      src={isDark ? "/alivella_dark_mode.png" : "/alivella_light_mode.png"}
                      alt="Alivella"
                      className="h-8 w-auto object-contain"
                    />
                    <button
                      type="button"
                      onClick={toggleTheme}
                      className={iconBtn("md")}
                      aria-label="Toggle theme"
                    >
                      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    </button>
                  </div>

                  {/* Nav links */}
                  <nav className="flex flex-col px-4 pt-5 pb-3 gap-1">
                    <p className={`px-3 pb-3 text-[11px] font-semibold uppercase tracking-widest ${isDark ? "text-white/30" : "text-black/30"}`}>
                      Shop
                    </p>
                    {NAV_LINKS.map((link) => {
                      const active = location.startsWith(link.href);
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setMobileOpen(false)}
                          className={`
                            flex items-center px-4 py-3.5 rounded-xl text-base font-medium
                            transition-all duration-150
                            ${active
                              ? "bg-pink-400 text-white ring-1 ring-pink-300/40 shadow-[0_0_12px_rgba(244,114,182,0.3)]"
                              : isDark
                                ? "text-white/70 hover:text-white hover:bg-white/7"
                                : "text-black/65 hover:text-black hover:bg-black/5"
                            }
                          `}
                        >
                          {link.label}
                        </Link>
                      );
                    })}
                  </nav>

                  <div className={`mx-5 my-1 border-t ${isDark ? "border-white/8" : "border-black/8"}`} />

                  {/* Account section */}
                  <div className="flex flex-col px-4 pt-3 pb-5 gap-1">
                    <p className={`px-3 pb-3 text-[11px] font-semibold uppercase tracking-widest ${isDark ? "text-white/30" : "text-black/30"}`}>
                      Account
                    </p>
                    {isAuthenticated ? (
                      <>
                        {/* User info pill */}
                        <div className={`flex items-center gap-3 px-4 py-3 mb-1 rounded-xl ${isDark ? "bg-white/5" : "bg-black/4"}`}>
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-300 to-pink-500 flex items-center justify-center text-sm font-bold text-white shrink-0">
                            {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                          </div>
                          <div className="min-w-0">
                            <p className={`text-sm font-semibold truncate ${isDark ? "text-white" : "text-black"}`}>{user?.name}</p>
                            <p className={`text-xs truncate ${isDark ? "text-white/40" : "text-black/40"}`}>{user?.email}</p>
                          </div>
                        </div>
                        <Link href="/account/orders" onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-base transition-colors ${isDark ? "text-white/65 hover:text-white hover:bg-white/7" : "text-black/60 hover:text-black hover:bg-black/5"}`}>
                          <Package className="w-5 h-5 opacity-50 shrink-0" /> My Orders
                        </Link>
                        <Link href="/account" onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-base transition-colors ${isDark ? "text-white/65 hover:text-white hover:bg-white/7" : "text-black/60 hover:text-black hover:bg-black/5"}`}>
                          <User className="w-5 h-5 opacity-50 shrink-0" /> Account Settings
                        </Link>
                        {user?.role === "admin" && (
                          <Link href="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-base text-pink-400 hover:bg-pink-500/8 transition-colors">
                            <ShieldCheck className="w-5 h-5 shrink-0" /> Admin Panel
                          </Link>
                        )}
                        <button
                          onClick={() => { logout(); setMobileOpen(false); }}
                          className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-base text-red-400 hover:bg-red-500/8 transition-colors mt-1"
                        >
                          <LogOut className="w-5 h-5 shrink-0" /> Sign Out
                        </button>
                      </>
                    ) : (
                      <Link
                        href="/login"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-base bg-pink-400 text-white font-medium hover:bg-pink-300 transition-colors"
                      >
                        <LogIn className="w-5 h-5 shrink-0" /> Sign In to Your Account
                      </Link>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>

          </div>
        </div>
      </header>

      {/* Spacer — the one and only separator between header and content */}
      <div style={{ height: HEADER_HEIGHT }} aria-hidden />
    </>
  );
}
