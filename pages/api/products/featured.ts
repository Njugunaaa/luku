import type { NextApiResponse } from "next";
import { createApiHandler, methodNotAllowed } from "../../../server/_core/api";
import * as db from "../../../server/db";

export default createApiHandler(async (req, res: NextApiResponse) => {
  if (req.method !== "GET") {
    methodNotAllowed(res, ["GET"]);
    return;
  }

  res.json(await db.getProducts({ featured: true, limit: 8 }));
});

