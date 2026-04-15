import type { NextApiResponse } from "next";
import {
  createApiHandler,
  methodNotAllowed,
  parseIdParam,
  parseInput,
  requireUser,
} from "../../../server/_core/api";
import { cartUpdateSchema } from "../../../server/_core/schemas";
import * as db from "../../../server/db";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "50mb",
    },
  },
};

export default createApiHandler(async (req, res: NextApiResponse) => {
  const user = requireUser(req);
  const itemId = parseIdParam(req.query.itemId, "cart item");

  if (req.method === "PATCH") {
    const input = parseInput(cartUpdateSchema, req.body);
    await db.updateCartItem(itemId, user.id, input.quantity);
    res.json({ success: true });
    return;
  }

  if (req.method === "DELETE") {
    await db.removeCartItem(itemId, user.id);
    res.json({ success: true });
    return;
  }

  methodNotAllowed(res, ["PATCH", "DELETE"]);
});
