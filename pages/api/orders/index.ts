import type { NextApiResponse } from "next";
import {
  createApiHandler,
  methodNotAllowed,
  parseInput,
  requireUser,
} from "../../../server/_core/api";
import { websiteOrderSchema } from "../../../server/_core/schemas";
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

  if (req.method === "GET") {
    res.json(await db.getOrdersByUserId(user.id));
    return;
  }

  if (req.method === "POST") {
    const input = parseInput(websiteOrderSchema, req.body);
    const subtotal = input.items.reduce(
      (sum, item) => sum + Number.parseFloat(item.price) * item.quantity,
      0,
    );
    const deliveryFee = input.needsDelivery ? 50 : 0;
    const total = subtotal + deliveryFee;

    const order = await db.createOrder(
      {
        userId: user.id,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        needsDelivery: input.needsDelivery,
        deliveryAddress: input.deliveryAddress,
        deliveryCity: input.deliveryCity,
        deliveryNotes: input.deliveryNotes,
        subtotal: subtotal.toFixed(2),
        deliveryFee: deliveryFee.toFixed(2),
        total: total.toFixed(2),
        source: "website",
      },
      input.items,
    );

    await db.clearCart(user.id);
    res.status(201).json(order);
    return;
  }

  methodNotAllowed(res, ["GET", "POST"]);
});
