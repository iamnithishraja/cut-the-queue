import { atom } from "recoil";
import { UserType } from "@repo/db";

export const userAtom = atom<UserType | undefined>({
  key: "userAtom",
  default: undefined,
});
