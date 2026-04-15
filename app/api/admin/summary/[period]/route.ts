import type { NextRequest } from "next/server";
import { parseInput } from "@server/_core/api";
import { summaryPeriodSchema } from "@server/_core/schemas";
import * as db from "@server/db";
import {
  getOptionalUser,
  handleRouteError,
  json,
  requireAdmin,
} from "@server/_core/next-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ period: string }> },
) {
  try {
    requireAdmin(await getOptionalUser(request));
    const { period: rawPeriod } = await context.params;
    const period = parseInput(summaryPeriodSchema, rawPeriod);
    const now = new Date();

    if (period === "weekly") {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - 7);
      const prevWeekStart = new Date(weekStart);
      prevWeekStart.setDate(weekStart.getDate() - 7);

      return json({
        current: await db.getOrderSummary(weekStart, now),
        previous: await db.getOrderSummary(prevWeekStart, weekStart),
        period,
      });
    }

    if (period === "monthly") {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      return json({
        current: await db.getOrderSummary(monthStart, now),
        previous: await db.getOrderSummary(prevMonthStart, prevMonthEnd),
        period,
      });
    }

    const yearStart = new Date(now.getFullYear(), 0, 1);
    const prevYearStart = new Date(now.getFullYear() - 1, 0, 1);
    const prevYearEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);

    return json({
      current: await db.getOrderSummary(yearStart, now),
      previous: await db.getOrderSummary(prevYearStart, prevYearEnd),
      period,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
