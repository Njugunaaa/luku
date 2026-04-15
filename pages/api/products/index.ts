import type { NextApiResponse } from "next";
import {
  createApiHandler,
  firstValue,
  methodNotAllowed,
  parseInput,
  sanitizeText,
  toOptionalBoolean,
  toOptionalNumber,
} from "../../../server/_core/api";
import { productListSchema } from "../../../server/_core/schemas";
import * as db from "../../../server/db";

export default createApiHandler(async (req, res: NextApiResponse) => {
  if (req.method !== "GET") {
    methodNotAllowed(res, ["GET"]);
    return;
  }

  const input = parseInput(productListSchema, {
    categoryId: toOptionalNumber(req.query.categoryId),
    featured: toOptionalBoolean(req.query.featured),
    search: sanitizeText(firstValue(req.query.search) as string | undefined),
    limit: toOptionalNumber(req.query.limit),
    offset: toOptionalNumber(req.query.offset),
    inStock: toOptionalBoolean(req.query.inStock),
  });

  res.json(await db.getProducts(input));
});

