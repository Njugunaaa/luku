import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const CATEGORIES = [
  {
    slug: "mens-collection",
    name: "Men's Collection",
    description:
      "Curated thrift fits for Nairobi streets, campus hangs, office-casual days, and weekend outings.",
    gender: "men",
    sortOrder: 1,
    imageUrl:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900&auto=format&fit=crop&q=80",
  },
  {
    slug: "womens-collection",
    name: "Women's Collection",
    description:
      "Easy dresses, smart separates, and polished thrift finds for brunch, work, church, and everyday style.",
    gender: "women",
    sortOrder: 2,
    imageUrl:
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=900&auto=format&fit=crop&q=80",
  },
  {
    slug: "shoes",
    name: "Shoes",
    description:
      "Sneakers, loafers, boots, and heels chosen for comfort, durability, and clean styling.",
    gender: "unisex",
    sortOrder: 3,
    imageUrl:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&auto=format&fit=crop&q=80",
  },
  {
    slug: "accessories",
    name: "Accessories",
    description:
      "Bags, belts, scarves, sunglasses, and jewelry that finish the look without overcomplicating it.",
    gender: "unisex",
    sortOrder: 4,
    imageUrl:
      "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=900&auto=format&fit=crop&q=80",
  },
  {
    slug: "official-wear",
    name: "Official Wear",
    description:
      "Tailored pieces for interviews, office days, events, and polished moments that matter.",
    gender: "unisex",
    sortOrder: 5,
    imageUrl:
      "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=900&auto=format&fit=crop&q=80",
  },
];

function jsonArray(values) {
  return JSON.stringify(values);
}

function gallery(primary, secondary) {
  return JSON.stringify([primary, secondary ?? primary]);
}

const PRODUCTS = [
  {
    slug: "nairobi-denim-trucker-jacket",
    name: "Nairobi Denim Trucker Jacket",
    description:
      "A structured vintage-wash denim jacket that layers easily over tees and hoodies. Ideal for cool Nairobi mornings and late-evening plans.",
    price: "2650",
    originalPrice: "4200",
    category: "mens-collection",
    imageUrl:
      "https://images.unsplash.com/photo-1542272604-787c3835535d?w=900&auto=format&fit=crop&q=80",
    images: gallery(
      "https://images.unsplash.com/photo-1542272604-787c3835535d?w=900&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=900&auto=format&fit=crop&q=80",
    ),
    sizes: jsonArray(["M", "L", "XL"]),
    colors: jsonArray(["Mid Blue", "Stone Wash"]),
    brand: "Levi's",
    productcondition: "like_new",
    stockCount: 4,
    featured: true,
    isNew: true,
    tags: jsonArray(["denim", "streetwear", "layering"]),
  },
  {
    slug: "weekend-cuban-shirt",
    name: "Weekend Cuban Collar Shirt",
    description:
      "A breezy patterned shirt for rooftop hangs, road trips, and easy weekend styling. Lightweight and relaxed without feeling sloppy.",
    price: "1450",
    originalPrice: "2300",
    category: "mens-collection",
    imageUrl:
      "https://images.unsplash.com/photo-1603252109303-2751441dd157?w=900&auto=format&fit=crop&q=80",
    images: gallery(
      "https://images.unsplash.com/photo-1603252109303-2751441dd157?w=900&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=900&auto=format&fit=crop&q=80",
    ),
    sizes: jsonArray(["S", "M", "L", "XL"]),
    colors: jsonArray(["Olive Print", "Sand Print"]),
    brand: "Cotton On",
    productcondition: "good",
    stockCount: 6,
    featured: false,
    isNew: true,
    tags: jsonArray(["casual", "holiday", "men"]),
  },
  {
    slug: "utility-cargo-trousers",
    name: "Utility Cargo Trousers",
    description:
      "Straight-leg cargo trousers with enough structure for daily wear and enough ease for campus, errands, or casual Friday fits.",
    price: "1850",
    originalPrice: "3200",
    category: "mens-collection",
    imageUrl:
      "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=900&auto=format&fit=crop&q=80",
    images: gallery(
      "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=900&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900&auto=format&fit=crop&q=80",
    ),
    sizes: jsonArray(["30", "32", "34", "36"]),
    colors: jsonArray(["Khaki", "Olive", "Black"]),
    brand: "LC Waikiki",
    productcondition: "like_new",
    stockCount: 5,
    featured: true,
    isNew: false,
    tags: jsonArray(["cargo", "casual", "street style"]),
  },
  {
    slug: "striped-rugby-sweatshirt",
    name: "Striped Rugby Sweatshirt",
    description:
      "A thick cotton rugby sweatshirt with a clean athletic feel. Easy to wear with jeans, cargos, or shorts on cooler days.",
    price: "1700",
    originalPrice: "2900",
    category: "mens-collection",
    imageUrl:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900&auto=format&fit=crop&q=80",
    images: gallery(
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=900&auto=format&fit=crop&q=80",
    ),
    sizes: jsonArray(["M", "L", "XL"]),
    colors: jsonArray(["Forest/Navy", "Cream/Navy"]),
    brand: "Woolworths",
    productcondition: "good",
    stockCount: 3,
    featured: false,
    isNew: false,
    tags: jsonArray(["sweatshirt", "preppy", "layering"]),
  },
  {
    slug: "black-carpenter-jeans",
    name: "Black Carpenter Jeans",
    description:
      "Heavy denim with a relaxed fit and practical utility styling. Built for a stronger silhouette and everyday repeat wear.",
    price: "2100",
    originalPrice: "3600",
    category: "mens-collection",
    imageUrl:
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=900&auto=format&fit=crop&q=80",
    images: gallery(
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=900&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=900&auto=format&fit=crop&q=80",
    ),
    sizes: jsonArray(["30", "32", "34", "36", "38"]),
    colors: jsonArray(["Washed Black"]),
    brand: "Pull&Bear",
    productcondition: "like_new",
    stockCount: 4,
    featured: true,
    isNew: true,
    tags: jsonArray(["denim", "black jeans", "streetwear"]),
  },
  {
    slug: "soft-knit-cardigan-set",
    name: "Soft Knit Cardigan Set",
    description:
      "A refined cardigan-and-cami pairing that works for office layering, brunch, and soft weekend dressing without trying too hard.",
    price: "2250",
    originalPrice: "3800",
    category: "womens-collection",
    imageUrl:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900&auto=format&fit=crop&q=80",
    images: gallery(
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=900&auto=format&fit=crop&q=80",
    ),
    sizes: jsonArray(["S", "M", "L"]),
    colors: jsonArray(["Rose", "Oatmeal", "Charcoal"]),
    brand: "Mango",
    productcondition: "like_new",
    stockCount: 5,
    featured: true,
    isNew: true,
    tags: jsonArray(["knitwear", "layering", "women"]),
  },
  {
    slug: "floral-tea-midi-dress",
    name: "Floral Tea Midi Dress",
    description:
      "A flattering midi dress with a light floral print and easy movement. Perfect for day events, Sunday plans, or dressy casual wear.",
    price: "2400",
    originalPrice: "4200",
    category: "womens-collection",
    imageUrl:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900&auto=format&fit=crop&q=80",
    images: gallery(
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=900&auto=format&fit=crop&q=80",
    ),
    sizes: jsonArray(["S", "M", "L", "XL"]),
    colors: jsonArray(["Pink Floral", "Navy Floral"]),
    brand: "River Island",
    productcondition: "like_new",
    stockCount: 6,
    featured: true,
    isNew: true,
    tags: jsonArray(["dress", "floral", "occasion wear"]),
  },
  {
    slug: "washed-denim-maxi-skirt",
    name: "Washed Denim Maxi Skirt",
    description:
      "A clean high-waist denim skirt with a longline shape that works beautifully with crop tops, knits, and tucked shirts.",
    price: "1750",
    originalPrice: "3000",
    category: "womens-collection",
    imageUrl:
      "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=900&auto=format&fit=crop&q=80",
    images: gallery(
      "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=900&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=900&auto=format&fit=crop&q=80",
    ),
    sizes: jsonArray(["8", "10", "12", "14"]),
    colors: jsonArray(["Blue Wash", "Black Wash"]),
    brand: "Mr Price",
    productcondition: "good",
    stockCount: 5,
    featured: false,
    isNew: false,
    tags: jsonArray(["denim skirt", "casual", "street style"]),
  },
  {
    slug: "pleated-work-midi-skirt",
    name: "Pleated Work Midi Skirt",
    description:
      "A polished pleated midi that moves well and styles easily for office days, events, and dressed-up errands.",
    price: "1600",
    originalPrice: "2750",
    category: "womens-collection",
    imageUrl:
      "https://images.unsplash.com/photo-1554412933-514a83d2f3c8?w=900&auto=format&fit=crop&q=80",
    images: gallery(
      "https://images.unsplash.com/photo-1554412933-514a83d2f3c8?w=900&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=900&auto=format&fit=crop&q=80",
    ),
    sizes: jsonArray(["8", "10", "12", "14", "16"]),
    colors: jsonArray(["Chocolate", "Black", "Olive"]),
    brand: "Foschini",
    productcondition: "like_new",
    stockCount: 4,
    featured: false,
    isNew: true,
    tags: jsonArray(["office", "midi skirt", "smart casual"]),
  },
  {
    slug: "satin-tie-neck-blouse",
    name: "Satin Tie-Neck Blouse",
    description:
      "A smooth blouse with just enough shine for work and evening wear. The neckline detail makes it feel elevated without being loud.",
    price: "1500",
    originalPrice: "2600",
    category: "womens-collection",
    imageUrl:
      "https://images.unsplash.com/photo-1551232864-3f0890e580d9?w=900&auto=format&fit=crop&q=80",
    images: gallery(
      "https://images.unsplash.com/photo-1551232864-3f0890e580d9?w=900&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900&auto=format&fit=crop&q=80",
    ),
    sizes: jsonArray(["S", "M", "L", "XL"]),
    colors: jsonArray(["Champagne", "Wine", "Ivory"]),
    brand: "Zara",
    productcondition: "like_new",
    stockCount: 7,
    featured: true,
    isNew: false,
    tags: jsonArray(["blouse", "office wear", "smart"]),
  },
  {
    slug: "wide-leg-palazzo-trousers",
    name: "Wide-Leg Palazzo Trousers",
    description:
      "Tailored enough for work, relaxed enough for everyday wear. A strong base piece for building clean, modern outfits.",
    price: "1900",
    originalPrice: "3200",
    category: "womens-collection",
    imageUrl:
      "https://images.unsplash.com/photo-1506629905607-d405b7a31a94?w=900&auto=format&fit=crop&q=80",
    images: gallery(
      "https://images.unsplash.com/photo-1506629905607-d405b7a31a94?w=900&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=900&auto=format&fit=crop&q=80",
    ),
    sizes: jsonArray(["8", "10", "12", "14"]),
    colors: jsonArray(["Stone", "Black", "Navy"]),
    brand: "Woolworths",
    productcondition: "new",
    stockCount: 6,
    featured: false,
    isNew: true,
    tags: jsonArray(["trousers", "palazzo", "workwear"]),
  },
  {
    slug: "court-vision-sneakers",
    name: "Court Vision Sneakers",
    description:
      "Clean everyday sneakers with the kind of shape that works with denim, dresses, cargos, and relaxed office looks.",
    price: "4200",
    originalPrice: "6800",
    category: "shoes",
    imageUrl:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&auto=format&fit=crop&q=80",
    images: gallery(
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=900&auto=format&fit=crop&q=80",
    ),
    sizes: jsonArray(["38", "39", "40", "41", "42", "43"]),
    colors: jsonArray(["White/Black", "White/Gum"]),
    brand: "Nike",
    productcondition: "like_new",
    stockCount: 3,
    featured: true,
    isNew: false,
    tags: jsonArray(["sneakers", "unisex", "daily wear"]),
  },
  {
    slug: "retro-runner-sneakers",
    name: "Retro Runner Sneakers",
    description:
      "Comfortable retro runners with a softer sole and easy styling. Great for long days in town or on the move.",
    price: "3600",
    originalPrice: "5800",
    category: "shoes",
    imageUrl:
      "https://images.unsplash.com/photo-1543508282-6319a3e2621f?w=900&auto=format&fit=crop&q=80",
    images: gallery(
      "https://images.unsplash.com/photo-1543508282-6319a3e2621f?w=900&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=900&auto=format&fit=crop&q=80",
    ),
    sizes: jsonArray(["37", "38", "39", "40", "41", "42"]),
    colors: jsonArray(["Grey", "Cream", "Rose"]),
    brand: "New Balance",
    productcondition: "good",
    stockCount: 4,
    featured: true,
    isNew: true,
    tags: jsonArray(["retro", "comfort", "trainers"]),
  },
  {
    slug: "polished-leather-loafers",
    name: "Polished Leather Loafers",
    description:
      "Smart loafers that bridge official wear and everyday polish. A dependable pair for office, meetings, and dressed-up casual looks.",
    price: "3900",
    originalPrice: "6200",
    category: "shoes",
    imageUrl:
      "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=900&auto=format&fit=crop&q=80",
    images: gallery(
      "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=900&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=900&auto=format&fit=crop&q=80",
    ),
    sizes: jsonArray(["39", "40", "41", "42", "43", "44"]),
    colors: jsonArray(["Black", "Oxblood"]),
    brand: "Bata",
    productcondition: "like_new",
    stockCount: 5,
    featured: false,
    isNew: false,
    tags: jsonArray(["loafers", "formal", "office"]),
  },
  {
    slug: "block-heel-ankle-boots",
    name: "Block Heel Ankle Boots",
    description:
      "Structured ankle boots with a practical heel and a polished finish. Easy to style with dresses, trousers, and denim.",
    price: "3400",
    originalPrice: "5600",
    category: "shoes",
    imageUrl:
      "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=900&auto=format&fit=crop&q=80",
    images: gallery(
      "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=900&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=900&auto=format&fit=crop&q=80",
    ),
    sizes: jsonArray(["36", "37", "38", "39", "40"]),
    colors: jsonArray(["Black", "Tan"]),
    brand: "Aldo",
    productcondition: "good",
    stockCount: 3,
    featured: true,
    isNew: false,
    tags: jsonArray(["boots", "heels", "smart casual"]),
  },
  {
    slug: "pointed-court-heels",
    name: "Pointed Court Heels",
    description:
      "Classic heels for events, office dressing, and occasions where you need a cleaner finish without overdoing it.",
    price: "2900",
    originalPrice: "4700",
    category: "shoes",
    imageUrl:
      "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=900&auto=format&fit=crop&q=80",
    images: gallery(
      "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=900&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1445205170230-053b83016050?w=900&auto=format&fit=crop&q=80",
    ),
    sizes: jsonArray(["36", "37", "38", "39", "40"]),
    colors: jsonArray(["Nude", "Black", "Wine"]),
    brand: "Charles & Keith",
    productcondition: "like_new",
    stockCount: 4,
    featured: false,
    isNew: true,
    tags: jsonArray(["heels", "occasion", "women"]),
  },
  {
    slug: "structured-city-tote",
    name: "Structured City Tote",
    description:
      "A roomy tote for work, meetings, and moving around town with the essentials. Clean lines and a refined finish.",
    price: "2450",
    originalPrice: "3900",
    category: "accessories",
    imageUrl:
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=900&auto=format&fit=crop&q=80",
    images: gallery(
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=900&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=900&auto=format&fit=crop&q=80",
    ),
    sizes: jsonArray(["One Size"]),
    colors: jsonArray(["Black", "Tan", "Chocolate"]),
    brand: "Fossil",
    productcondition: "like_new",
    stockCount: 5,
    featured: true,
    isNew: false,
    tags: jsonArray(["bag", "tote", "workwear"]),
  },
  {
    slug: "mini-crossbody-sling",
    name: "Mini Crossbody Sling",
    description:
      "Compact and practical with enough room for a phone, keys, cards, and gloss. Perfect for quick errands and weekend looks.",
    price: "1650",
    originalPrice: "2800",
    category: "accessories",
    imageUrl:
      "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=900&auto=format&fit=crop&q=80",
    images: gallery(
      "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=900&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=900&auto=format&fit=crop&q=80",
    ),
    sizes: jsonArray(["One Size"]),
    colors: jsonArray(["Black", "Olive", "Stone"]),
    brand: "Aldo",
    productcondition: "good",
    stockCount: 6,
    featured: false,
    isNew: true,
    tags: jsonArray(["crossbody", "bag", "daily"]),
  },
  {
    slug: "maasai-inspired-beaded-necklace",
    name: "Maasai-Inspired Beaded Necklace",
    description:
      "A bold beaded statement piece that brings color and personality to plain dresses, shirts, and event looks.",
    price: "1100",
    originalPrice: "1800",
    category: "accessories",
    imageUrl:
      "https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=900&auto=format&fit=crop&q=80",
    images: gallery(
      "https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=900&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=900&auto=format&fit=crop&q=80",
    ),
    sizes: jsonArray(["One Size"]),
    colors: jsonArray(["Red Mix", "Blue Mix", "Neutral Mix"]),
    brand: "Artisan Market",
    productcondition: "new",
    stockCount: 7,
    featured: true,
    isNew: true,
    tags: jsonArray(["jewelry", "beaded", "statement"]),
  },
  {
    slug: "layered-gold-hoop-set",
    name: "Layered Gold Hoop Set",
    description:
      "A versatile earring set with easy shine for both daily styling and dressier occasions. Light enough to wear all day.",
    price: "900",
    originalPrice: "1500",
    category: "accessories",
    imageUrl:
      "https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=900&auto=format&fit=crop&q=80",
    images: gallery(
      "https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=900&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=900&auto=format&fit=crop&q=80",
    ),
    sizes: jsonArray(["One Size"]),
    colors: jsonArray(["Gold"]),
    brand: "Accessorize",
    productcondition: "new",
    stockCount: 8,
    featured: false,
    isNew: true,
    tags: jsonArray(["earrings", "jewelry", "gold"]),
  },
  {
    slug: "vintage-leather-belt",
    name: "Vintage Leather Belt",
    description:
      "A dependable real-leather belt that works with denim, tailored trousers, and oversized shirt styling.",
    price: "950",
    originalPrice: "1600",
    category: "accessories",
    imageUrl:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=900&auto=format&fit=crop&q=80",
    images: gallery(
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=900&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=900&auto=format&fit=crop&q=80",
    ),
    sizes: jsonArray(["S/M", "M/L", "L/XL"]),
    colors: jsonArray(["Tan", "Black"]),
    brand: "Handpicked",
    productcondition: "good",
    stockCount: 6,
    featured: false,
    isNew: false,
    tags: jsonArray(["belt", "leather", "unisex"]),
  },
  {
    slug: "printed-silk-head-wrap",
    name: "Printed Silk Head Wrap",
    description:
      "A lightweight scarf for hair styling, neck styling, or adding character to bags and simple outfits.",
    price: "850",
    originalPrice: "1400",
    category: "accessories",
    imageUrl:
      "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=900&auto=format&fit=crop&q=80",
    images: gallery(
      "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=900&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=900&auto=format&fit=crop&q=80",
    ),
    sizes: jsonArray(["One Size"]),
    colors: jsonArray(["Rose Print", "Blue Print", "Terracotta Print"]),
    brand: "Market Find",
    productcondition: "new",
    stockCount: 9,
    featured: true,
    isNew: true,
    tags: jsonArray(["scarf", "head wrap", "accessory"]),
  },
  {
    slug: "oval-tinted-sunglasses",
    name: "Oval Tinted Sunglasses",
    description:
      "Clean vintage-inspired sunglasses that sharpen a simple look fast. A strong finishing piece without taking over.",
    price: "1250",
    originalPrice: "2000",
    category: "accessories",
    imageUrl:
      "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=900&auto=format&fit=crop&q=80",
    images: gallery(
      "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=900&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=900&auto=format&fit=crop&q=80",
    ),
    sizes: jsonArray(["One Size"]),
    colors: jsonArray(["Black", "Amber", "Smoke"]),
    brand: "Ray-Ban",
    productcondition: "like_new",
    stockCount: 5,
    featured: false,
    isNew: false,
    tags: jsonArray(["sunglasses", "eyewear", "unisex"]),
  },
  {
    slug: "navy-interview-suit",
    name: "Navy Interview Suit",
    description:
      "A sharp two-piece suit that feels right for interviews, weddings, and important work presentations. Clean fit and strong structure.",
    price: "8600",
    originalPrice: "14500",
    category: "official-wear",
    imageUrl:
      "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=900&auto=format&fit=crop&q=80",
    images: gallery(
      "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=900&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1594938298603-c8148c4b4a0e?w=900&auto=format&fit=crop&q=80",
    ),
    sizes: jsonArray(["38", "40", "42", "44", "46"]),
    colors: jsonArray(["Navy", "Charcoal"]),
    brand: "Next",
    productcondition: "like_new",
    stockCount: 2,
    featured: true,
    isNew: false,
    tags: jsonArray(["suit", "formal", "men"]),
  },
  {
    slug: "women-power-blazer-set",
    name: "Women's Power Blazer Set",
    description:
      "A tailored blazer and trouser pairing with enough polish for office leadership, events, and smarter formal styling.",
    price: "7200",
    originalPrice: "12500",
    category: "official-wear",
    imageUrl:
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=900&auto=format&fit=crop&q=80",
    images: gallery(
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=900&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900&auto=format&fit=crop&q=80",
    ),
    sizes: jsonArray(["S", "M", "L", "XL"]),
    colors: jsonArray(["Stone", "Black", "Dusty Pink"]),
    brand: "Zara",
    productcondition: "like_new",
    stockCount: 3,
    featured: true,
    isNew: true,
    tags: jsonArray(["blazer set", "formal", "women"]),
  },
  {
    slug: "crisp-office-poplin-shirt",
    name: "Crisp Office Poplin Shirt",
    description:
      "A clean structured shirt for work wardrobes, formal layering, and polished styling across both men's and women's looks.",
    price: "1350",
    originalPrice: "2200",
    category: "official-wear",
    imageUrl:
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=900&auto=format&fit=crop&q=80",
    images: gallery(
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=900&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1551232864-3f0890e580d9?w=900&auto=format&fit=crop&q=80",
    ),
    sizes: jsonArray(["S", "M", "L", "XL", "XXL"]),
    colors: jsonArray(["White", "Sky Blue", "Pinstripe"]),
    brand: "Marks & Spencer",
    productcondition: "like_new",
    stockCount: 7,
    featured: false,
    isNew: false,
    tags: jsonArray(["shirt", "office", "formal"]),
  },
  {
    slug: "sheath-office-midi-dress",
    name: "Sheath Office Midi Dress",
    description:
      "A streamlined midi dress with a neat shape for professional settings, formal lunches, and elegant weekday dressing.",
    price: "3300",
    originalPrice: "5400",
    category: "official-wear",
    imageUrl:
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=900&auto=format&fit=crop&q=80",
    images: gallery(
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=900&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900&auto=format&fit=crop&q=80",
    ),
    sizes: jsonArray(["S", "M", "L", "XL"]),
    colors: jsonArray(["Black", "Navy", "Forest"]),
    brand: "Woolworths",
    productcondition: "good",
    stockCount: 4,
    featured: false,
    isNew: true,
    tags: jsonArray(["dress", "office", "formal"]),
  },
  {
    slug: "charcoal-tailored-blazer",
    name: "Charcoal Tailored Blazer",
    description:
      "A versatile single-breasted blazer that sharpens denim, trousers, dresses, and coordinated work sets with minimal effort.",
    price: "4100",
    originalPrice: "6900",
    category: "official-wear",
    imageUrl:
      "https://images.unsplash.com/photo-1548549557-dbe9155b3a97?w=900&auto=format&fit=crop&q=80",
    images: gallery(
      "https://images.unsplash.com/photo-1548549557-dbe9155b3a97?w=900&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=900&auto=format&fit=crop&q=80",
    ),
    sizes: jsonArray(["S", "M", "L", "XL"]),
    colors: jsonArray(["Charcoal", "Camel", "Black"]),
    brand: "Mango",
    productcondition: "like_new",
    stockCount: 5,
    featured: true,
    isNew: false,
    tags: jsonArray(["blazer", "office", "tailoring"]),
  },
];

async function seed() {
  const connection = await mysql.createConnection(DATABASE_URL);

  try {
    console.log("Seeding categories...");

    for (const category of CATEGORIES) {
      await connection.execute(
        `INSERT INTO categories (slug, name, description, imageUrl, gender, sortOrder, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           description = VALUES(description),
           imageUrl = VALUES(imageUrl),
           gender = VALUES(gender),
           sortOrder = VALUES(sortOrder)`,
        [
          category.slug,
          category.name,
          category.description,
          category.imageUrl,
          category.gender,
          category.sortOrder,
        ],
      );
    }

    const [categoryRows] = await connection.execute("SELECT id, slug FROM categories");
    const categoryMap = new Map(categoryRows.map((row) => [row.slug, row.id]));

    console.log(`Seeded ${CATEGORIES.length} categories.`);
    console.log("Seeding products...");

    let seededCount = 0;

    for (const product of PRODUCTS) {
      const categoryId = categoryMap.get(product.category);

      if (!categoryId) {
        console.warn(`Skipping ${product.slug}: category ${product.category} was not found.`);
        continue;
      }

      await connection.execute(
        `INSERT INTO products (
          slug, name, description, price, originalPrice, categoryId, imageUrl, images,
          sizes, colors, brand, productcondition, inStock, stockCount, featured, isNew,
          tags, createdAt, updatedAt
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          description = VALUES(description),
          price = VALUES(price),
          originalPrice = VALUES(originalPrice),
          categoryId = VALUES(categoryId),
          imageUrl = VALUES(imageUrl),
          images = VALUES(images),
          sizes = VALUES(sizes),
          colors = VALUES(colors),
          brand = VALUES(brand),
          productcondition = VALUES(productcondition),
          inStock = VALUES(inStock),
          stockCount = VALUES(stockCount),
          featured = VALUES(featured),
          isNew = VALUES(isNew),
          tags = VALUES(tags),
          updatedAt = NOW()`,
        [
          product.slug,
          product.name,
          product.description,
          product.price,
          product.originalPrice,
          categoryId,
          product.imageUrl,
          product.images,
          product.sizes,
          product.colors,
          product.brand,
          product.productcondition,
          1,
          product.stockCount,
          product.featured ? 1 : 0,
          product.isNew ? 1 : 0,
          product.tags,
        ],
      );

      seededCount += 1;
    }

    const [counts] = await connection.execute(
      `SELECT
         (SELECT COUNT(*) FROM categories) AS categoryCount,
         (SELECT COUNT(*) FROM products) AS productCount`,
    );

    const summary = counts[0];

    console.log(`Seeded ${seededCount} products.`);
    console.log(
      `Database now has ${summary.categoryCount} categories and ${summary.productCount} products.`,
    );
    console.log("Catalog seed complete.");
  } finally {
    await connection.end();
  }
}

seed().catch((error) => {
  console.error("Catalog seed failed:", error);
  process.exit(1);
});
