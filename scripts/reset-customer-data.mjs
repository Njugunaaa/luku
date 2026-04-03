import dotenv from "dotenv";
import mysql from "mysql2/promise";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const TABLES = ["order_items", "orders", "cart_items", "users"];

const connection = await mysql.createConnection(DATABASE_URL);

async function getCounts() {
  const counts = {};

  for (const table of TABLES) {
    const [rows] = await connection.query(`SELECT COUNT(*) AS count FROM \`${table}\``);
    counts[table] = rows[0]?.count ?? 0;
  }

  return counts;
}

try {
  const before = await getCounts();
  console.log("Before reset:", before);

  await connection.beginTransaction();

  for (const table of TABLES) {
    await connection.query(`DELETE FROM \`${table}\``);
  }

  await connection.commit();

  const after = await getCounts();
  console.log("After reset:", after);
  console.log("Customer data reset complete.");
} catch (error) {
  await connection.rollback();
  console.error("Customer data reset failed:", error);
  process.exitCode = 1;
} finally {
  await connection.end();
}
