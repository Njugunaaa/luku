"use client";

import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useCart } from "@/contexts/CartContext";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageCircle,
  Minus,
  Package,
  Plus,
  RefreshCw,
  Shield,
  ShoppingBag,
  Star,
  Truck,
} from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ProductCard from "@/components/ProductCard";

const WHATSAPP_NUMBER = "254701887586"; // Update with actual number

export default function ProductDetail() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "";
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();

  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [currentImage, setCurrentImage] = useState(0);
  const [adding, setAdding] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  const { data: product, isLoading, error } = api.products.bySlug.useQuery({ slug }, { enabled: !!slug });
  const { data: categories = [] } = api.categories.list.useQuery();

  const { data: relatedProducts } = api.products.list.useQuery(
    { categoryId: product?.categoryId, limit: 4 },
    { enabled: !!product?.categoryId }
  );

  if (isLoading) {
    return (
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-pulse">
          <div className="aspect-[3/4] bg-secondary rounded-2xl" />
          <div className="space-y-4">
            <div className="h-6 bg-secondary rounded w-1/3" />
            <div className="h-10 bg-secondary rounded w-2/3" />
            <div className="h-8 bg-secondary rounded w-1/4" />
            <div className="h-24 bg-secondary rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container py-24 text-center">
        <h2 className="font-display text-2xl font-bold mb-3">Product not found</h2>
        <p className="text-muted-foreground mb-6">This item may have been sold or removed.</p>
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-accent">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </div>
    );
  }

  const images = (() => {
    try { return product.images ? JSON.parse(product.images) : [product.imageUrl]; }
    catch { return [product.imageUrl]; }
  })();

  const sizes = (() => {
    try { return product.sizes ? JSON.parse(product.sizes) : []; }
    catch { return []; }
  })();

  const colors = (() => {
    try { return product.colors ? JSON.parse(product.colors) : []; }
    catch { return []; }
  })();
  const category = categories.find((entry) => entry.id === product.categoryId);

  const discount = product.originalPrice
    ? Math.round((1 - parseFloat(product.price) / parseFloat(product.originalPrice)) * 100)
    : null;

  const handleAddToCart = async () => {
    if (!isAuthenticated) { window.location.href = getLoginUrl(); return; }
    if (sizes.length > 0 && !selectedSize) { toast.error("Please select a size"); return; }
    setAdding(true);
    try {
      await addItem(product.id, quantity, selectedSize || undefined, selectedColor || undefined);
      toast.success("Added to cart!", { description: `${product.name} × ${quantity}` });
    } finally {
      setAdding(false);
    }
  };

  const handleWhatsAppOrder = () => {
    const sizeText = selectedSize ? `\nSize: ${selectedSize}` : "";
    const colorText = selectedColor ? `\nColor: ${selectedColor}` : "";
    const message = encodeURIComponent(
      `Hi Alivella Boutique! I'd like to order:\n\n*${product.name}*\nPrice: KES ${parseFloat(product.price).toLocaleString()}${sizeText}${colorText}\nQty: ${quantity}\n\nProduct link: ${window.location.href}\n\nPlease confirm availability.`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, "_blank");
  };

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <div className="container py-4">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>/</span>
          {category ? (
            <>
              <Link href={`/category/${category.slug}`} className="hover:text-foreground transition-colors">
                {category.name}
              </Link>
              <span>/</span>
            </>
          ) : null}
          <span className="text-foreground font-medium truncate max-w-[200px]">{product.name}</span>
        </nav>
      </div>

      <div className="container pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-16">
          {/* Images */}
          <div className="space-y-3">
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-secondary group">
              <motion.img
                key={currentImage}
                src={images[currentImage] ?? product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.isNew && <span className="badge-new">New</span>}
                {discount && discount > 0 && <span className="badge-sale">-{discount}%</span>}
                {!product.inStock && (
                  <span className="bg-foreground/80 text-background text-xs font-semibold px-2 py-0.5 rounded-full">Sold Out</span>
                )}
              </div>

              {/* Wishlist */}
              <button
                onClick={() => setWishlisted(!wishlisted)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
              >
                <Heart className={`w-5 h-5 ${wishlisted ? "fill-red-500 text-red-500" : "text-foreground/60"}`} />
              </button>

              {/* Image nav */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImage((c) => (c - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentImage((c) => (c + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImage(i)}
                    className={`w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                      currentImage === i ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            {product.brand && (
              <p className="text-sm font-semibold uppercase tracking-widest text-accent mb-2">{product.brand}</p>
            )}
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground leading-tight mb-3">
              {product.name}
            </h1>

            {/* Price */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl font-bold text-foreground">
                KES {parseFloat(product.price).toLocaleString()}
              </span>
              {product.originalPrice && (
                <span className="text-lg text-muted-foreground line-through">
                  KES {parseFloat(product.originalPrice).toLocaleString()}
                </span>
              )}
              {discount && discount > 0 && (
                <span className="text-sm font-bold text-destructive">Save {discount}%</span>
              )}
            </div>

            {/* productcondition */}
            {product.productcondition && (
              <div className="inline-flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-full w-fit mb-5">
                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                <span className="text-xs font-medium capitalize">{product.productcondition.replace("_", " ")} productcondition</span>
              </div>
            )}

            {/* Description */}
            {product.description && (
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">{product.description}</p>
            )}

            {/* Size Selector */}
            {sizes.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold">Size</h3>
                  {!selectedSize && <span className="text-xs text-destructive">Required</span>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size: string) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all ${
                        selectedSize === size
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:border-primary hover:bg-secondary"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selector */}
            {colors.length > 0 && (
              <div className="mb-5">
                <h3 className="text-sm font-semibold mb-2">Color: <span className="font-normal text-muted-foreground">{selectedColor}</span></h3>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color: string) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                        selectedColor === color
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:bg-secondary"
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-2">Quantity</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-9 h-9 rounded-lg border border-border flex items-center justify-center hover:bg-secondary transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(10, quantity + 1))}
                  className="w-9 h-9 rounded-lg border border-border flex items-center justify-center hover:bg-secondary transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Button
                onClick={handleAddToCart}
                disabled={!product.inStock || adding}
                className="flex-1 gap-2 h-12 text-sm font-semibold"
              >
                <ShoppingBag className="w-4 h-4" />
                {!product.inStock ? "Out of Stock" : adding ? "Adding..." : "Add to Cart"}
              </Button>

              <button
                onClick={handleWhatsAppOrder}
                className="btn-whatsapp flex-1 justify-center h-12"
              >
                <MessageCircle className="w-4 h-4" />
                Order on WhatsApp
              </button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-3 pt-5 border-t border-border">
              {[
                { icon: Shield, label: "Authentic", sub: "Verified pieces" },
                { icon: Truck, label: "Fast Delivery", sub: "Nairobi & beyond" },
                { icon: RefreshCw, label: "7-Day Returns", sub: "No questions asked" },
              ].map((badge) => (
                <div key={badge.label} className="flex flex-col items-center text-center gap-1.5">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                    <badge.icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs font-semibold text-foreground">{badge.label}</p>
                  <p className="text-xs text-muted-foreground">{badge.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div className="mt-20">
            <h2 className="font-display text-2xl font-bold mb-6">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {relatedProducts
                .filter(p => p.id !== product.id)
                .slice(0, 4)
                .map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
