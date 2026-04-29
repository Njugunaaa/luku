export const DEFAULT_STORE_CATEGORIES = [
  {
    slug: "tops",
    name: "Tops",
    description:
      "Statement blouses, soft knits, everyday tees, and polished separates ready for repeat wear.",
    imageUrl:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900&auto=format&fit=crop&q=80",
    gender: "women" as const,
    sortOrder: 10,
  },
  {
    slug: "skirts",
    name: "Skirts",
    description:
      "Mini, midi, and maxi silhouettes curated for easy styling through workdays and weekends.",
    imageUrl:
      "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=900&auto=format&fit=crop&q=80",
    gender: "women" as const,
    sortOrder: 20,
  },
  {
    slug: "dresses",
    name: "Dresses",
    description:
      "Everyday staples and occasion-ready dresses selected for comfort, shape, and clean finishes.",
    imageUrl:
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=900&auto=format&fit=crop&q=80",
    gender: "women" as const,
    sortOrder: 30,
  },
  {
    slug: "shoes",
    name: "Shoes",
    description:
      "Sneakers, boots, heels, and loafers chosen to anchor a full outfit without overthinking it.",
    imageUrl:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&auto=format&fit=crop&q=80",
    gender: "unisex" as const,
    sortOrder: 40,
  },
  {
    slug: "accessories",
    name: "Accessories",
    description:
      "Bags, belts, scarves, jewelry, and finishing pieces that bring a look together fast.",
    imageUrl:
      "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=900&auto=format&fit=crop&q=80",
    gender: "unisex" as const,
    sortOrder: 50,
  },
] as const;
