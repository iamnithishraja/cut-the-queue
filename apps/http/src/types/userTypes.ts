import { UserType } from "@cut-the-queue/db/client";
import { Request } from "express";

export interface CustomRequest extends Request {
  user?: UserType | null;
}
