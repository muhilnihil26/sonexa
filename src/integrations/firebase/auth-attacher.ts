import { createMiddleware } from "@tanstack/react-start";
import { firebaseAuth } from "./client";

export const attachFirebaseAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    const token = await firebaseAuth.currentUser?.getIdToken();
    return next({
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
);
