import type { NextApiResponse } from "next";
import { BadRequestError, NotFoundError } from "../../../shared/_core/errors";
import {
  createApiHandler,
  methodNotAllowed,
  parseInput,
  requireUser,
} from "../../../server/_core/api";
import { cartAddSchema } from "../../../server/_core/schemas";
import * as db from "../../../server/db";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "50mb",
    },
  },
};

export default createApiHandler(async (req, res: NextApiResponse) => {
  if (req.method === "GET") {
    const user = requireUser(req);
    res.json(await db.getCartItems(user.id));
    return;
  }

  if (req.method === "POST") {
    const user = requireUser(req);
    const input = parseInput(cartAddSchema, req.body);
    const product = await db.getProductById(input.productId);

    if (!product) {
      throw NotFoundError("Product not found");
    }

    if (!product.inStock) {
      throw BadRequestError("Product is out of stock");
    }

    await db.addToCart({ userId: user.id, ...input });
    res.status(201).json({ success: true });
    return;
  }

  if (req.method === "DELETE") {
    const user = requireUser(req);
    await db.clearCart(user.id);
    res.json({ success: true });
    return;
  }

  methodNotAllowed(res, ["GET", "POST", "DELETE"]);
});
