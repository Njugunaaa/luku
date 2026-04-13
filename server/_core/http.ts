import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodType } from "zod";
import { HttpError } from "../../shared/_core/errors";

export function asyncHandler<
  Req extends Request = Request,
  Res extends Response = Response,
>(
  handler: (req: Req, res: Res, next: NextFunction) => Promise<unknown> | unknown,
) {
  return (req: Req, res: Res, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

export function parseInput<TSchema extends ZodType>(
  schema: TSchema,
  input: unknown,
) {
  try {
    return schema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      const issue = error.issues[0];
      throw new HttpError(400, issue?.message ?? "Invalid request.");
    }

    throw error;
  }
}

export function sendNoContent(res: Response) {
  res.status(204).end();
}

export function errorMiddleware(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (error instanceof HttpError) {
    res.status(error.statusCode).json({ message: error.message });
    return;
  }

  if (error instanceof Error) {
    console.error("[api] unhandled error", error);
    res.status(500).json({ message: error.message || "Internal server error" });
    return;
  }

  console.error("[api] unknown error", error);
  res.status(500).json({ message: "Internal server error" });
}
