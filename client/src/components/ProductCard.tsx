import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useCart } from "@/contexts/CartContext";
import { Heart, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

type Product = {
  id: number;
  slug: string;
  name: string;
  price: string;
  originalPrice?: string | null;
  imageUrl: string;
  brand?: string | null;
  productcondition?: string | null;
  inStock: boolean;
  featured?: boolean | null;
  isNew?: boolean | null;
};

type Props = {
  product: Product;
  className?: string;
};

export default function ProductCard({ product, className = "" }: Props) {
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const [adding, setAdding] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  const discount = product.originalPrice
    ? Math.round((1 - parseFloat(product.price) / parseFloat(product.originalPrice)) * 100)
    : null;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    if (!product.inStock) return;
    setAdding(true);
    try {
      await addItem(product.id, 1);
      toast.success("Added to cart!", { description: product.name });
    } catch {
      // error handled in context
    } finally {
      setAdding(false);
    }
  };

  return (
    <Link href={`/product/${product.slug}`} className={`group block ${className}`}>
      <div className="bg-card rounded-2xl overflow-hidden border border-border hover-lift transition-all duration-300">
        {/* Image */}
        <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.isNew && <span className="badge-new">New</span>}
            {discount && discount > 0 && <span className="badge-sale">-{discount}%</span>}
            {!product.inStock && (
              <span className="bg-foreground/80 text-background text-xs font-semibold px-2 py-0.5 rounded-full">
                Sold Out
              </span>
            )}
          </div>

          {/* Wishlist */}
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setWishlisted(!wishlisted); }}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 shadow-sm"
          >
            <Heart className={`w-4 h-4 ${wishlisted ? "fill-red-500 text-red-500" : "text-foreground/60"}`} />
          </button>

          {/* Quick Add */}
          {product.inStock && (
            <button
              onClick={handleAddToCart}
              disabled={adding}
              className="absolute bottom-3 left-3 right-3 bg-primary text-primary-foreground text-xs font-semibold py-2.5 rounded-xl opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              {adding ? "Adding..." : "Quick Add"}
            </button>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          {product.brand && (
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">
              {product.brand}
            </p>
          )}
          <h3 className="font-semibold text-sm text-foreground line-clamp-2 leading-snug mb-2 font-sans">
            {product.name}
          </h3>
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground">
              KES {parseFloat(product.price).toLocaleString()}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                KES {parseFloat(product.originalPrice).toLocaleString()}
              </span>
            )}
          </div>
          {product.productcondition && (
            <p className="text-xs text-muted-foreground mt-1 capitalize">
              {product.productcondition.replace("_", " ")}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
