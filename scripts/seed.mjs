import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);
const db = drizzle(connection);

// ─── Categories ───────────────────────────────────────────────────────────────
const CATEGORIES = [
  { slug: "mens-collection", name: "Men's Collection", description: "Curated streetwear, casual fits, denim, sweaters, hoodies and more for the modern man.", gender: "men", sortOrder: 1, imageUrl: "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=600&q=80" },
  { slug: "womens-collection", name: "Women's Collection", description: "Stunning dresses, elegant tops, chic skirts, co-ords and everything in between.", gender: "women", sortOrder: 2, imageUrl: "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=600&q=80" },
  { slug: "shoes", name: "Shoes", description: "Sneakers, boots, heels, loafers — step out in style with our footwear collection.", gender: "unisex", sortOrder: 3, imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80" },
  { slug: "accessories", name: "Accessories", description: "Hats, belts, bags, scarves, sunglasses — the details that define your look.", gender: "unisex", sortOrder: 4, imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80" },
  { slug: "official-wear", name: "Official Wear", description: "Men's suits, women's trouser suits, blazers, skirt suits — power dressing for every occasion.", gender: "unisex", sortOrder: 5, imageUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=80" },
];

// Insert categories
console.log("Seeding categories...");
for (const cat of CATEGORIES) {
  await connection.execute(
    `INSERT INTO categories (slug, name, description, imageUrl, gender, sortOrder, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description)`,
    [cat.slug, cat.name, cat.description, cat.imageUrl, cat.gender, cat.sortOrder]
  );
}
console.log("✓ Categories seeded");

// Get category IDs
const [catRows] = await connection.execute("SELECT id, slug FROM categories");
const catMap = {};
for (const row of catRows) catMap[row.slug] = row.id;

// ─── Products ─────────────────────────────────────────────────────────────────
const PRODUCTS = [
  // ── Men's Collection ──────────────────────────────────────────────────────
  {
    slug: "vintage-levis-denim-jacket",
    name: "Vintage Levi's Denim Jacket",
    description: "Classic Levi's trucker jacket in medium wash denim. Excellent vintage condition with authentic fading. A timeless wardrobe staple.",
    price: "2800", originalPrice: "4500",
    category: "mens-collection",
    imageUrl: "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=600&q=80",
    sizes: '["S","M","L","XL"]', colors: '["Medium Wash","Dark Wash"]',
    brand: "Levi's", condition: "like_new", featured: true, isNew: false,
  },
  {
    slug: "ralph-lauren-polo-shirt",
    name: "Ralph Lauren Polo Shirt",
    description: "Classic Ralph Lauren polo in navy blue. 100% cotton, slim fit. Perfect for casual or smart-casual occasions.",
    price: "1800", originalPrice: "3200",
    category: "mens-collection",
    imageUrl: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&q=80",
    sizes: '["S","M","L","XL","XXL"]', colors: '["Navy","White","Black"]',
    brand: "Ralph Lauren", condition: "like_new", featured: true, isNew: true,
  },
  {
    slug: "supreme-box-logo-hoodie",
    name: "Supreme Box Logo Hoodie",
    description: "Iconic Supreme box logo hoodie in black. Heavy cotton blend, kangaroo pocket. Streetwear essential.",
    price: "5500", originalPrice: "8000",
    category: "mens-collection",
    imageUrl: "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600&q=80",
    sizes: '["M","L","XL"]', colors: '["Black","Red","Grey"]',
    brand: "Supreme", condition: "good", featured: true, isNew: false,
  },
  {
    slug: "tommy-hilfiger-striped-tee",
    name: "Tommy Hilfiger Striped Tee",
    description: "Classic Tommy Hilfiger striped t-shirt. Lightweight cotton, relaxed fit. Great for everyday wear.",
    price: "1200", originalPrice: "2000",
    category: "mens-collection",
    imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80",
    sizes: '["S","M","L","XL"]', colors: '["Red/White/Blue","Navy/White"]',
    brand: "Tommy Hilfiger", condition: "good", featured: false, isNew: true,
  },
  {
    slug: "mens-slim-fit-chinos",
    name: "Slim Fit Chino Trousers",
    description: "Premium slim fit chinos in khaki. Stretch cotton blend for comfort. Versatile for office or casual wear.",
    price: "1600", originalPrice: "2800",
    category: "mens-collection",
    imageUrl: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&q=80",
    sizes: '["28","30","32","34","36"]', colors: '["Khaki","Navy","Olive"]',
    brand: "Zara", condition: "like_new", featured: false, isNew: false,
  },
  {
    slug: "adidas-track-jacket",
    name: "Adidas Originals Track Jacket",
    description: "Retro Adidas track jacket with iconic three stripes. Lightweight, perfect for layering.",
    price: "2200", originalPrice: "3800",
    category: "mens-collection",
    imageUrl: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80",
    sizes: '["S","M","L","XL"]', colors: '["Black/Gold","Navy/White"]',
    brand: "Adidas", condition: "like_new", featured: true, isNew: false,
  },
  {
    slug: "mens-cable-knit-sweater",
    name: "Cable Knit Crew Neck Sweater",
    description: "Cozy cable knit sweater in cream. 100% wool blend. Perfect for the cool season.",
    price: "2000", originalPrice: "3500",
    category: "mens-collection",
    imageUrl: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&q=80",
    sizes: '["S","M","L","XL"]', colors: '["Cream","Grey","Camel"]',
    brand: "H&M", condition: "new", featured: false, isNew: true,
  },
  {
    slug: "mens-graphic-tee-pack",
    name: "Vintage Graphic Tee",
    description: "Cool vintage-style graphic tee with distressed print. 100% cotton, oversized fit.",
    price: "900", originalPrice: "1500",
    category: "mens-collection",
    imageUrl: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&q=80",
    sizes: '["S","M","L","XL","XXL"]', colors: '["White","Black","Grey"]',
    brand: null, condition: "good", featured: false, isNew: false,
  },

  // ── Women's Collection ────────────────────────────────────────────────────
  {
    slug: "floral-midi-dress",
    name: "Floral Midi Wrap Dress",
    description: "Gorgeous floral print midi dress with wrap silhouette. Lightweight chiffon fabric, perfect for any occasion.",
    price: "2200", originalPrice: "4000",
    category: "womens-collection",
    imageUrl: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&q=80",
    sizes: '["XS","S","M","L","XL"]', colors: '["Floral Blue","Floral Pink"]',
    brand: "Zara", condition: "like_new", featured: true, isNew: true,
  },
  {
    slug: "womens-denim-mini-skirt",
    name: "Denim Mini Skirt",
    description: "Classic denim mini skirt with raw hem. High-waisted, A-line silhouette. A wardrobe essential.",
    price: "1400", originalPrice: "2500",
    category: "womens-collection",
    imageUrl: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=600&q=80",
    sizes: '["XS","S","M","L"]', colors: '["Light Wash","Dark Wash"]',
    brand: "H&M", condition: "good", featured: true, isNew: false,
  },
  {
    slug: "silk-slip-dress",
    name: "Satin Slip Dress",
    description: "Elegant satin slip dress in champagne. Adjustable straps, bias cut. Perfect for evenings out.",
    price: "3200", originalPrice: "5500",
    category: "womens-collection",
    imageUrl: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&q=80",
    sizes: '["XS","S","M","L"]', colors: '["Champagne","Black","Dusty Rose"]',
    brand: "ASOS", condition: "like_new", featured: true, isNew: true,
  },
  {
    slug: "oversized-blazer-women",
    name: "Oversized Blazer",
    description: "Chic oversized blazer in camel. Single button closure, structured shoulders. Dress up or down.",
    price: "3500", originalPrice: "6000",
    category: "womens-collection",
    imageUrl: "https://images.unsplash.com/photo-1548549557-dbe9155b3a97?w=600&q=80",
    sizes: '["XS","S","M","L","XL"]', colors: '["Camel","Black","Cream"]',
    brand: "Zara", condition: "like_new", featured: false, isNew: false,
  },
  {
    slug: "womens-high-waist-jeans",
    name: "High Waist Straight Leg Jeans",
    description: "Classic high-waist straight leg jeans in dark wash. Flattering fit, comfortable stretch denim.",
    price: "2000", originalPrice: "3500",
    category: "womens-collection",
    imageUrl: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&q=80",
    sizes: '["24","26","28","30","32"]', colors: '["Dark Wash","Light Wash","Black"]',
    brand: "Mango", condition: "good", featured: false, isNew: true,
  },
  {
    slug: "womens-knit-sweater",
    name: "Chunky Knit Oversized Sweater",
    description: "Super cozy chunky knit sweater in sage green. Oversized fit, ribbed cuffs and hem.",
    price: "1800", originalPrice: "3200",
    category: "womens-collection",
    imageUrl: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&q=80",
    sizes: '["XS","S","M","L","XL"]', colors: '["Sage Green","Cream","Rust"]',
    brand: "Uniqlo", condition: "new", featured: true, isNew: true,
  },
  {
    slug: "bodycon-evening-dress",
    name: "Bodycon Evening Dress",
    description: "Stunning bodycon dress in deep burgundy. Ruched sides, midi length. Perfect for nights out.",
    price: "2800", originalPrice: "4800",
    category: "womens-collection",
    imageUrl: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600&q=80",
    sizes: '["XS","S","M","L"]', colors: '["Burgundy","Black","Emerald"]',
    brand: "ASOS", condition: "like_new", featured: false, isNew: false,
  },
  {
    slug: "linen-wide-leg-trousers",
    name: "Linen Wide Leg Trousers",
    description: "Breezy linen wide leg trousers in white. High-waisted, relaxed fit. Summer essential.",
    price: "1600", originalPrice: "2800",
    category: "womens-collection",
    imageUrl: "https://images.unsplash.com/photo-1594938298603-c8148c4b4a0e?w=600&q=80",
    sizes: '["XS","S","M","L","XL"]', colors: '["White","Beige","Black"]',
    brand: "Zara", condition: "good", featured: false, isNew: false,
  },

  // ── Shoes ─────────────────────────────────────────────────────────────────
  {
    slug: "nike-air-max-90",
    name: "Nike Air Max 90",
    description: "Iconic Nike Air Max 90 in white/black. Barely worn, excellent condition. Classic silhouette that never goes out of style.",
    price: "4500", originalPrice: "8000",
    category: "shoes",
    imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80",
    sizes: '["39","40","41","42","43","44"]', colors: '["White/Black","Grey/Red"]',
    brand: "Nike", condition: "like_new", featured: true, isNew: false,
  },
  {
    slug: "chelsea-leather-boots",
    name: "Chelsea Leather Boots",
    description: "Premium leather Chelsea boots in tan. Elastic side panels, stacked heel. Timeless and versatile.",
    price: "5500", originalPrice: "9000",
    category: "shoes",
    imageUrl: "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=600&q=80",
    sizes: '["37","38","39","40","41","42"]', colors: '["Tan","Black","Dark Brown"]',
    brand: "Clarks", condition: "like_new", featured: true, isNew: false,
  },
  {
    slug: "adidas-stan-smith",
    name: "Adidas Stan Smith Sneakers",
    description: "Classic Adidas Stan Smith in white/green. Clean, minimal design. Perfect for any casual outfit.",
    price: "3200", originalPrice: "5500",
    category: "shoes",
    imageUrl: "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=600&q=80",
    sizes: '["38","39","40","41","42","43"]', colors: '["White/Green","White/Navy"]',
    brand: "Adidas", condition: "good", featured: true, isNew: true,
  },
  {
    slug: "block-heel-pumps",
    name: "Block Heel Pumps",
    description: "Elegant block heel pumps in nude. Pointed toe, 7cm heel. Perfect for office or evening wear.",
    price: "2800", originalPrice: "4500",
    category: "shoes",
    imageUrl: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&q=80",
    sizes: '["36","37","38","39","40"]', colors: '["Nude","Black","Red"]',
    brand: "Aldo", condition: "like_new", featured: false, isNew: true,
  },
  {
    slug: "timberland-boots",
    name: "Timberland 6-Inch Premium Boots",
    description: "Iconic Timberland wheat nubuck boots. Waterproof, padded collar. A streetwear staple.",
    price: "6500", originalPrice: "12000",
    category: "shoes",
    imageUrl: "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=600&q=80",
    sizes: '["40","41","42","43","44","45"]', colors: '["Wheat","Black","Dark Brown"]',
    brand: "Timberland", condition: "good", featured: true, isNew: false,
  },
  {
    slug: "white-canvas-sneakers",
    name: "Classic White Canvas Sneakers",
    description: "Clean white canvas low-top sneakers. Rubber sole, lace-up closure. Effortlessly cool.",
    price: "1800", originalPrice: "3000",
    category: "shoes",
    imageUrl: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=600&q=80",
    sizes: '["36","37","38","39","40","41","42"]', colors: '["White","Black","Cream"]',
    brand: "Converse", condition: "good", featured: false, isNew: false,
  },

  // ── Accessories ───────────────────────────────────────────────────────────
  {
    slug: "bucket-hat-beige",
    name: "Bucket Hat",
    description: "Trendy bucket hat in beige cotton. Unstructured, packable. Perfect for sunny days.",
    price: "800", originalPrice: "1500",
    category: "accessories",
    imageUrl: "https://images.unsplash.com/photo-1521369909029-2afed882baee?w=600&q=80",
    sizes: '["One Size"]', colors: '["Beige","Black","Olive","Pink"]',
    brand: null, condition: "new", featured: true, isNew: true,
  },
  {
    slug: "leather-belt-brown",
    name: "Genuine Leather Belt",
    description: "Classic genuine leather belt in tan. Silver buckle, 3.5cm width. Fits waist 28-38 inches.",
    price: "1200", originalPrice: "2000",
    category: "accessories",
    imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80",
    sizes: '["S/M","M/L","L/XL"]', colors: '["Tan","Black","Dark Brown"]',
    brand: null, condition: "new", featured: false, isNew: false,
  },
  {
    slug: "crossbody-bag-black",
    name: "Leather Crossbody Bag",
    description: "Compact leather crossbody bag in black. Adjustable strap, multiple compartments. Everyday essential.",
    price: "2500", originalPrice: "4500",
    category: "accessories",
    imageUrl: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80",
    sizes: '["One Size"]', colors: '["Black","Tan","Burgundy"]',
    brand: "Fossil", condition: "like_new", featured: true, isNew: false,
  },
  {
    slug: "snapback-cap",
    name: "Snapback Cap",
    description: "Classic snapback cap with embroidered logo. Adjustable closure, flat brim. Street style essential.",
    price: "900", originalPrice: "1600",
    category: "accessories",
    imageUrl: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&q=80",
    sizes: '["One Size"]', colors: '["Black","White","Navy","Red"]',
    brand: null, condition: "new", featured: false, isNew: true,
  },
  {
    slug: "silk-scarf",
    name: "Silk Print Scarf",
    description: "Luxurious silk scarf with abstract print. Can be worn as headscarf, neck scarf, or bag accessory.",
    price: "1500", originalPrice: "2800",
    category: "accessories",
    imageUrl: "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=600&q=80",
    sizes: '["One Size"]', colors: '["Multicolor","Blue","Pink"]',
    brand: null, condition: "new", featured: false, isNew: true,
  },
  {
    slug: "aviator-sunglasses",
    name: "Aviator Sunglasses",
    description: "Classic aviator sunglasses with gold frame and brown gradient lenses. UV400 protection.",
    price: "1800", originalPrice: "3500",
    category: "accessories",
    imageUrl: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&q=80",
    sizes: '["One Size"]', colors: '["Gold/Brown","Silver/Grey","Black/Black"]',
    brand: "Ray-Ban", condition: "like_new", featured: true, isNew: false,
  },
  {
    slug: "canvas-tote-bag",
    name: "Canvas Tote Bag",
    description: "Large canvas tote bag with leather handles. Perfect for shopping, beach, or everyday use.",
    price: "1100", originalPrice: "2000",
    category: "accessories",
    imageUrl: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&q=80",
    sizes: '["One Size"]', colors: '["Natural","Black","Navy"]',
    brand: null, condition: "new", featured: false, isNew: false,
  },

  // ── Official Wear ─────────────────────────────────────────────────────────
  {
    slug: "mens-navy-suit",
    name: "Men's Navy Blue Suit",
    description: "Sharp two-piece navy blue suit. Slim fit, notch lapel. Perfect for interviews, weddings, and formal events. Jacket + Trousers.",
    price: "8500", originalPrice: "15000",
    category: "official-wear",
    imageUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=80",
    sizes: '["38","40","42","44","46"]', colors: '["Navy","Charcoal","Black"]',
    brand: "Next", condition: "like_new", featured: true, isNew: false,
  },
  {
    slug: "womens-trouser-suit",
    name: "Women's Trouser Suit",
    description: "Elegant women's trouser suit in charcoal grey. Tailored blazer + high-waist trousers. Power dressing at its finest.",
    price: "7500", originalPrice: "13000",
    category: "official-wear",
    imageUrl: "https://images.unsplash.com/photo-1594938298603-c8148c4b4a0e?w=600&q=80",
    sizes: '["XS","S","M","L","XL"]', colors: '["Charcoal","Black","Cream"]',
    brand: "Zara", condition: "like_new", featured: true, isNew: true,
  },
  {
    slug: "womens-skirt-suit",
    name: "Women's Skirt Suit",
    description: "Classic women's skirt suit in black. Structured blazer + pencil skirt. Timeless professional look.",
    price: "6800", originalPrice: "12000",
    category: "official-wear",
    imageUrl: "https://images.unsplash.com/photo-1548549557-dbe9155b3a97?w=600&q=80",
    sizes: '["XS","S","M","L"]', colors: '["Black","Navy","Burgundy"]',
    brand: "Marks & Spencer", condition: "like_new", featured: true, isNew: false,
  },
  {
    slug: "mens-charcoal-suit",
    name: "Men's Charcoal Grey Suit",
    description: "Classic charcoal grey two-piece suit. Regular fit, single-breasted. Versatile for any formal occasion.",
    price: "9000", originalPrice: "16000",
    category: "official-wear",
    imageUrl: "https://images.unsplash.com/photo-1594938298603-c8148c4b4a0e?w=600&q=80",
    sizes: '["38","40","42","44","46","48"]', colors: '["Charcoal","Dark Grey"]',
    brand: "Marks & Spencer", condition: "good", featured: false, isNew: false,
  },
  {
    slug: "mens-dress-shirt-white",
    name: "Men's Dress Shirt",
    description: "Crisp white dress shirt in 100% cotton. Slim fit, spread collar. Essential for any formal wardrobe.",
    price: "1500", originalPrice: "2800",
    category: "official-wear",
    imageUrl: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&q=80",
    sizes: '["S","M","L","XL","XXL"]', colors: '["White","Light Blue","Striped"]',
    brand: "Calvin Klein", condition: "like_new", featured: false, isNew: true,
  },
  {
    slug: "womens-blazer-cream",
    name: "Women's Structured Blazer",
    description: "Chic structured blazer in cream. Single button, padded shoulders. Elevate any outfit instantly.",
    price: "4500", originalPrice: "8000",
    category: "official-wear",
    imageUrl: "https://images.unsplash.com/photo-1548549557-dbe9155b3a97?w=600&q=80",
    sizes: '["XS","S","M","L","XL"]', colors: '["Cream","Black","Camel"]',
    brand: "Zara", condition: "like_new", featured: false, isNew: true,
  },
];

console.log("Seeding products...");
let inserted = 0;
let skipped = 0;

for (const p of PRODUCTS) {
  const catId = catMap[p.category];
  if (!catId) { console.warn(`Category not found: ${p.category}`); continue; }

  try {
    await connection.execute(
      `INSERT INTO products (slug, name, description, price, originalPrice, categoryId, imageUrl, sizes, colors, brand, condition, inStock, stockCount, featured, isNew, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 5, ?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE name=VALUES(name), price=VALUES(price)`,
      [p.slug, p.name, p.description, p.price, p.originalPrice || null, catId, p.imageUrl,
       p.sizes || null, p.colors || null, p.brand || null, p.condition || "like_new",
       p.featured ? 1 : 0, p.isNew ? 1 : 0]
    );
    inserted++;
  } catch (err) {
    console.warn(`Skipped ${p.slug}: ${err.message}`);
    skipped++;
  }
}

console.log(`✓ Products seeded: ${inserted} inserted, ${skipped} skipped`);
await connection.end();
console.log("\n✅ Seed complete!");
