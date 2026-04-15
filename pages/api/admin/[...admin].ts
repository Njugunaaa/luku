import type { NextApiResponse } from "next";
import { BadRequestError, NotFoundError } from "../../../shared/_core/errors";
import {
  createApiHandler,
  firstValue,
  getRouteSegments,
  methodNotAllowed,
  parseIdParam,
  parseInput,
  requireAdmin,
  sanitizeText,
  toOptionalNumber,
  toPublicUser,
} from "../../../server/_core/api";
import {
  adminOrdersQuerySchema,
  categoryUpsertSchema,
  manualOrderSchema,
  orderUpdateSchema,
  productUpsertSchema,
  summaryPeriodSchema,
} from "../../../server/_core/schemas";
import * as db from "../../../server/db";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "50mb",
    },
  },
};

export default createApiHandler(async (req, res: NextApiResponse) => {
  requireAdmin(req);
  const [resource, action, subAction] = getRouteSegments(req.query.admin);

  if (resource === "orders" && !action) {
    if (req.method !== "GET") {
      methodNotAllowed(res, ["GET"]);
      return;
    }

    const input = parseInput(adminOrdersQuerySchema, {
      status: sanitizeText(firstValue(req.query.status) as string | undefined),
      limit: toOptionalNumber(req.query.limit),
      offset: toOptionalNumber(req.query.offset),
    });

    const orders = await db.getAllOrders(input);
    const result: Array<NonNullable<Awaited<ReturnType<typeof db.getOrderWithItems>>>> = [];
    for (const order of orders) {
      const full = await db.getOrderWithItems(order.id);
      if (full) result.push(full);
    }

    res.json(result);
    return;
  }

  if (resource === "orders" && action === "manual") {
    if (req.method !== "POST") {
      methodNotAllowed(res, ["POST"]);
      return;
    }

    const input = parseInput(manualOrderSchema, req.body);
    const subtotal = input.items.reduce(
      (sum, item) => sum + Number.parseFloat(item.price) * item.quantity,
      0,
    );
    const deliveryFee = input.needsDelivery ? 50 : 0;
    const total = subtotal + deliveryFee;

    const order = await db.createOrder(
      {
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        needsDelivery: input.needsDelivery,
        deliveryAddress: input.deliveryAddress,
        deliveryCity: input.deliveryCity,
        subtotal: subtotal.toFixed(2),
        deliveryFee: deliveryFee.toFixed(2),
        total: total.toFixed(2),
        source: input.source,
        notes: input.notes,
      },
      input.items,
    );

    res.status(201).json(order);
    return;
  }

  if (resource === "orders" && action) {
    const orderId = parseIdParam(action, "order");

    if (req.method === "PATCH") {
      const input = parseInput(orderUpdateSchema, req.body);
      await db.updateOrderStatus(
        orderId,
        input.status ?? "pending",
        input.paymentStatus,
        input.notes,
      );
      res.json({ success: true });
      return;
    }

    if (req.method === "DELETE") {
      const order = await db.getOrderById(orderId);
      if (!order) {
        throw NotFoundError("Order not found");
      }

      if (order.status !== "pending") {
        throw BadRequestError("Only pending orders can be deleted.");
      }

      await db.deleteOrder(orderId);
      res.json({ success: true });
      return;
    }

    methodNotAllowed(res, ["PATCH", "DELETE"]);
    return;
  }

  if (resource === "summary" && action) {
    if (req.method !== "GET") {
      methodNotAllowed(res, ["GET"]);
      return;
    }

    const period = parseInput(summaryPeriodSchema, action);
    const now = new Date();

    if (period === "weekly") {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - 7);
      const prevWeekStart = new Date(weekStart);
      prevWeekStart.setDate(weekStart.getDate() - 7);

      res.json({
        current: await db.getOrderSummary(weekStart, now),
        previous: await db.getOrderSummary(prevWeekStart, weekStart),
        period,
      });
      return;
    }

    if (period === "monthly") {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      res.json({
        current: await db.getOrderSummary(monthStart, now),
        previous: await db.getOrderSummary(prevMonthStart, prevMonthEnd),
        period,
      });
      return;
    }

    const yearStart = new Date(now.getFullYear(), 0, 1);
    const prevYearStart = new Date(now.getFullYear() - 1, 0, 1);
    const prevYearEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);

    res.json({
      current: await db.getOrderSummary(yearStart, now),
      previous: await db.getOrderSummary(prevYearStart, prevYearEnd),
      period,
    });
    return;
  }

  if (resource === "products" && !action) {
    if (req.method === "GET") {
      res.json(await db.getProducts({ limit: 200 }));
      return;
    }

    if (req.method === "POST") {
      const input = parseInput(productUpsertSchema, req.body);
      await db.upsertProduct(input as any);
      res.json({ success: true });
      return;
    }

    methodNotAllowed(res, ["GET", "POST"]);
    return;
  }

  if (resource === "products" && action) {
    if (req.method !== "DELETE") {
      methodNotAllowed(res, ["DELETE"]);
      return;
    }

    const productId = parseIdParam(action, "product");
    await db.deleteProduct(productId);
    res.json({ success: true });
    return;
  }

  if (resource === "categories" && !action) {
    if (req.method === "GET") {
      res.json(await db.getAllCategories());
      return;
    }

    if (req.method === "POST") {
      const input = parseInput(categoryUpsertSchema, req.body);
      await db.upsertCategory(input);
      res.json({ success: true });
      return;
    }

    methodNotAllowed(res, ["GET", "POST"]);
    return;
  }

  if (resource === "users" && !action && !subAction) {
    if (req.method !== "GET") {
      methodNotAllowed(res, ["GET"]);
      return;
    }

    const users = await db.getAllUsers();
    res.json(users.map((user) => toPublicUser(user)));
    return;
  }

  res.status(404).json({ message: "Not found" });
});
