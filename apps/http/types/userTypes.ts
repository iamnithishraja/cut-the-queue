import { UserType } from "@repo/db/client";
import { Request } from "express";

export interface CustomRequest extends Request {
  user?: UserType | null;
}
