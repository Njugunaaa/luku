import postgres from "postgres";
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

const DESIRED_CATEGORIES = [
  {
    slug: "tops",
    name: "Tops",
    description:
      "Statement blouses, soft knits, everyday tees, and polished separates ready for repeat wear.",
    imageUrl:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900&auto=format&fit=crop&q=80",
    gender: "women",
    sortOrder: 10,
  },
  {
    slug: "skirts",
    name: "Skirts",
    description:
      "Mini, midi, and maxi silhouettes curated for easy styling through workdays and weekends.",
    imageUrl:
      "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=900&auto=format&fit=crop&q=80",
    gender: "women",
    sortOrder: 20,
  },
  {
    slug: "dresses",
    name: "Dresses",
    description:
      "Everyday staples and occasion-ready dresses selected for comfort, shape, and clean finishes.",
    imageUrl:
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=900&auto=format&fit=crop&q=80",
    gender: "women",
    sortOrder: 30,
  },
  {
    slug: "shoes",
    name: "Shoes",
    description:
      "Sneakers, boots, heels, and loafers chosen to anchor a full outfit without overthinking it.",
    imageUrl:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&auto=format&fit=crop&q=80",
    gender: "unisex",
    sortOrder: 40,
  },
  {
    slug: "accessories",
    name: "Accessories",
    description:
      "Bags, belts, scarves, jewelry, and finishing pieces that bring a look together fast.",
    imageUrl:
      "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=900&auto=format&fit=crop&q=80",
    gender: "unisex",
    sortOrder: 50,
  },
];

const LEGACY_CATEGORY_SLUGS = ["mens-collection", "womens-collection", "official-wear"];

const LEGACY_PRODUCT_SLUGS = [
  "nairobi-denim-trucker-jacket",
  "weekend-cuban-shirt",
  "utility-cargo-trousers",
  "striped-rugby-sweatshirt",
  "black-carpenter-jeans",
  "soft-knit-cardigan-set",
  "floral-tea-midi-dress",
  "washed-denim-maxi-skirt",
  "pleated-work-midi-skirt",
  "satin-tie-neck-blouse",
  "wide-leg-palazzo-trousers",
  "court-vision-sneakers",
  "retro-runner-sneakers",
  "polished-leather-loafers",
  "block-heel-ankle-boots",
  "pointed-court-heels",
  "structured-city-tote",
  "mini-crossbody-sling",
  "maasai-inspired-beaded-necklace",
  "layered-gold-hoop-set",
  "vintage-leather-belt",
  "printed-silk-head-wrap",
  "oval-tinted-sunglasses",
  "navy-interview-suit",
  "women-power-blazer-set",
  "crisp-office-poplin-shirt",
  "sheath-office-midi-dress",
  "charcoal-tailored-blazer",
];

async function cleanup() {
  const sql = postgres(DATABASE_URL, {
    ssl:
      DATABASE_URL.includes("sslmode=require") ||
      DATABASE_URL.includes("supabase.co") ||
      DATABASE_URL.includes("supabase.com") ||
      DATABASE_URL.includes("pooler.supabase")
        ? "require"
        : undefined,
    prepare: false,
    max: 1,
  });

  try {
    let removedProducts = 0;

    console.log("Removing legacy seeded products...");
    for (const slug of LEGACY_PRODUCT_SLUGS) {
      const result = await sql`DELETE FROM products WHERE "slug" = ${slug}`;
      removedProducts += result.count ?? 0;
    }

    console.log("Restoring desired storefront categories...");
    for (const category of DESIRED_CATEGORIES) {
      await sql`
        INSERT INTO categories ("slug", "name", "description", "imageUrl", "gender", "sortOrder", "createdAt")
        VALUES (
          ${category.slug},
          ${category.name},
          ${category.description},
          ${category.imageUrl},
          ${category.gender},
          ${category.sortOrder},
          NOW()
        )
        ON CONFLICT ("slug") DO UPDATE SET
          "name" = EXCLUDED."name",
          "description" = EXCLUDED."description",
          "imageUrl" = EXCLUDED."imageUrl",
          "gender" = EXCLUDED."gender",
          "sortOrder" = EXCLUDED."sortOrder"
      `;
    }

    let removedCategories = 0;

    console.log("Removing legacy-only categories...");
    for (const slug of LEGACY_CATEGORY_SLUGS) {
      const result = await sql`DELETE FROM categories WHERE "slug" = ${slug}`;
      removedCategories += result.count ?? 0;
    }

    const categories = await sql`
      SELECT "id", "slug", "name", "sortOrder"
      FROM categories
      ORDER BY "sortOrder" ASC, "name" ASC
    `;

    const [summary] = await sql`
      SELECT
        (SELECT COUNT(*) FROM categories) AS "categoryCount",
        (SELECT COUNT(*) FROM products) AS "productCount"
    `;

    console.log(`Removed ${removedProducts} legacy products.`);
    console.log(`Removed ${removedCategories} legacy categories.`);
    console.log(
      `Database now has ${summary.categoryCount} categories and ${summary.productCount} products.`,
    );
    console.log("Remaining categories:");
    categories.forEach((category) => {
      console.log(`- ${category.slug} (${category.name})`);
    });
  } finally {
    await sql.end();
  }
}

cleanup().catch((error) => {
  console.error("Legacy seed cleanup failed:", error);
  process.exit(1);
});
