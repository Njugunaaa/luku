import type { NextApiHandler } from "next";
import { createApp } from "../../server/_core/app";

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

const app = createApp();

export default app as unknown as NextApiHandler;
