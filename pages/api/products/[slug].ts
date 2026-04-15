import type { NextApiResponse } from "next";
import { NotFoundError } from "../../../shared/_core/errors";
import { createApiHandler, firstValue, methodNotAllowed } from "../../../server/_core/api";
import * as db from "../../../server/db";

export default createApiHandler(async (req, res: NextApiResponse) => {
  if (req.method !== "GET") {
    methodNotAllowed(res, ["GET"]);
    return;
  }

  const slug = firstValue(req.query.slug);
  if (typeof slug !== "string" || !slug.trim()) {
    throw NotFoundError("Product not found");
  }

  const product = await db.getProductBySlug(slug);
  if (!product) {
    throw NotFoundError("Product not found");
  }

  res.json(product);
});

