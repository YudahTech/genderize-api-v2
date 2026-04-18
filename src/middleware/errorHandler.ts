// src/middleware/errorHandler.ts
import type { Request, Response, NextFunction } from "express";

export interface AppError extends Error {
  statusCode?: number;
  isApiError?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  console.error("Error:", err.message);

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    status: "error",
    message: err.message || "Internal server error",
  });
};
