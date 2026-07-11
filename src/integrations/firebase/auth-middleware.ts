import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { ADMIN_EMAIL, FIREBASE_PROJECT_ID } from "./config";

const jwks = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
  ),
);

export type FirebaseClaims = {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
  email_verified?: boolean;
};

export const requireFirebaseAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const request = getRequest();
    const authHeader = request?.headers?.get("authorization");
    if (!authHeader?.startsWith("Bearer "))
      throw new Error("Unauthorized: No Firebase token provided");

    const token = authHeader.replace("Bearer ", "");
    const { payload } = await jwtVerify(token, jwks, {
      issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
      audience: FIREBASE_PROJECT_ID,
    });

    const claims = payload as FirebaseClaims;
    if (!claims.sub) throw new Error("Unauthorized: No Firebase user id found");

    return next({
      context: {
        firebaseToken: token,
        userId: claims.sub,
        userEmail: claims.email ?? "",
        isAdmin: (claims.email ?? "").toLowerCase() === ADMIN_EMAIL,
        claims,
      },
    });
  },
);
