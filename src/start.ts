import { createStart, createMiddleware } from "@tanstack/react-start";
import { Capacitor } from "@capacitor/core";

import { renderErrorPage } from "./lib/error-page";
import { attachFirebaseAuth } from "@/integrations/firebase/auth-attacher";

const SONEXA_PRODUCTION_ORIGIN = "https://sonexa-listen-beyond-main.vercel.app";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

const serverFnFetch: typeof fetch = (input, init) => {
  if (typeof window !== "undefined" && Capacitor.isNativePlatform()) {
    const url =
      typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    const source = new URL(url, window.location.href);
    const target = new URL(`${source.pathname}${source.search}`, SONEXA_PRODUCTION_ORIGIN);
    return fetch(target.toString(), init);
  }
  return fetch(input, init);
};

export const startInstance = createStart(() => ({
  functionMiddleware: [attachFirebaseAuth],
  requestMiddleware: [errorMiddleware],
  serverFns: {
    fetch: serverFnFetch,
  },
}));
