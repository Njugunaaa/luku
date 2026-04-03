import { Instagram, Mail, MapPin, MessageCircle, Phone, Twitter } from "lucide-react";
import { Link } from "wouter";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary text-primary-foreground">
      {/* Main Footer */}
      <div className="container py-14 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
                <span className="text-accent-foreground font-display font-bold text-lg leading-none">L</span>
              </div>
              <span className="font-display font-bold text-2xl">Alivella Boutique</span>
            </div>
            <p className="text-primary-foreground/70 text-sm leading-relaxed mb-5">
              Your go-to destination for premium thrifted fashion. Curated pieces for the bold, the stylish, and the conscious.
            </p>
            <div className="flex items-center gap-3">
              <a href="https://wa.me/254700000000" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#25D366] flex items-center justify-center transition-colors">
                <MessageCircle className="w-4 h-4" />
              </a>
              <a href="https://instagram.com/Alivella Boutique_store" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-pink-500 flex items-center justify-center transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="https://twitter.com/Alivella Boutique_store" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-sky-500 flex items-center justify-center transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-widest mb-4 text-primary-foreground/50">Shop</h4>
            <ul className="space-y-2.5">
              {[
                { label: "Men's Collection", href: "/category/mens-collection" },
                { label: "Women's Collection", href: "/category/womens-collection" },
                { label: "Shoes", href: "/category/shoes" },
                { label: "Accessories", href: "/category/accessories" },
                { label: "Official Wear", href: "/category/official-wear" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href}
                    className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-widest mb-4 text-primary-foreground/50">Info</h4>
            <ul className="space-y-2.5">
              {[
                { label: "About Alivella Boutique", href: "/about" },
                { label: "How It Works", href: "/how-it-works" },
                { label: "Sizing Guide", href: "/sizing" },
                { label: "Returns Policy", href: "/returns" },
                { label: "Privacy Policy", href: "/privacy" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href}
                    className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-widest mb-4 text-primary-foreground/50">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-primary-foreground/70">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-accent" />
                <span>Nairobi, Kenya</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-primary-foreground/70">
                <Phone className="w-4 h-4 shrink-0 text-accent" />
                <a href="tel:+254700000000" className="hover:text-primary-foreground transition-colors">
                  +254 700 000 000
                </a>
              </li>
              <li className="flex items-center gap-3 text-sm text-primary-foreground/70">
                <Mail className="w-4 h-4 shrink-0 text-accent" />
                <a href="mailto:hello@Alivella Boutique.com" className="hover:text-primary-foreground transition-colors">
                  hello@Alivella Boutique.com
                </a>
              </li>
              <li className="flex items-center gap-3 text-sm text-primary-foreground/70">
                <MessageCircle className="w-4 h-4 shrink-0 text-[#25D366]" />
                <a href="https://wa.me/254700000000" target="_blank" rel="noopener noreferrer"
                  className="hover:text-primary-foreground transition-colors">
                  WhatsApp Us
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-primary-foreground/50">
            &copy; {currentYear} Alivella Boutique Store. All rights reserved.
          </p>
          <p className="text-xs text-primary-foreground/50">
            Made with ♥ for the youth
          </p>
        </div>
      </div>
    </footer>
  );
}
