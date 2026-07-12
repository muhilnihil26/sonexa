import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { PlayerProvider } from "../lib/player-store";
import { Toaster } from "../components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Sonexa — Listen Beyond Limits" },
      {
        name: "description",
        content:
          "Sonexa is a premium AI-powered music streaming experience built around Tamil music. By War.Dev.",
      },
      { name: "author", content: "War.Dev" },
      { property: "og:title", content: "Sonexa — Listen Beyond Limits" },
      {
        property: "og:description",
        content:
          "Sonexa is a premium AI-powered music streaming experience built around Tamil music. By War.Dev.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Sonexa — Listen Beyond Limits" },
      {
        name: "twitter:description",
        content:
          "Sonexa is a premium AI-powered music streaming experience built around Tamil music. By War.Dev.",
      },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/9d9642da-3b16-467c-8fc9-1d141ee40ce5/id-preview-0e11ed6f--213341f7-c2cc-450d-8938-e5c14893c6a1.lovable.app-1781069017736.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/9d9642da-3b16-467c-8fc9-1d141ee40ce5/id-preview-0e11ed6f--213341f7-c2cc-450d-8938-e5c14893c6a1.lovable.app-1781069017736.png",
      },
    ],
    links: [
      {
        rel: "manifest",
        href: "/manifest.webmanifest",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="bg-background text-foreground antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    document.getElementById("sonexa-native-boot")?.remove();
  }, []);

  // Add page transition animations
  useEffect(() => {
    const handleRouteChange = () => {
      // Add fade-in animation to body on route change
      document.body.classList.add('animate-page-in');
      setTimeout(() => {
        document.body.classList.remove('animate-page-in');
      }, 650);
    };

    // Subscribe to router changes
    const unsubscribe = router.subscribe('onBeforeLoad', handleRouteChange);
    
    return () => {
      unsubscribe();
    };
  }, [router]);

  return (
    <QueryClientProvider client={queryClient}>
      <PlayerProvider>
        <TvRemoteFocus />
        <div className="min-h-screen animate-fade-up">
          <Outlet />
        </div>
        <Toaster theme="dark" position="top-center" />
      </PlayerProvider>
    </QueryClientProvider>
  );
}

function TvRemoteFocus() {
  useEffect(() => {
    const selectors = [
      "a[href]",
      "button:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "[role='button']",
      "[tabindex]:not([tabindex='-1'])",
    ].join(",");

    const isVisible = (element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.visibility !== "hidden" &&
        style.display !== "none"
      );
    };

    const focusables = () =>
      Array.from(document.querySelectorAll<HTMLElement>(selectors)).filter(isVisible);

    const focusFirst = () => {
      const active = document.activeElement;
      if (active && active !== document.body) return;
      focusables()[0]?.focus({ preventScroll: false });
    };

    const moveFocus = (direction: "up" | "down" | "left" | "right") => {
      const items = focusables();
      if (!items.length) return;
      const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      if (!active || !items.includes(active)) {
        items[0].focus({ preventScroll: false });
        return;
      }

      const origin = active.getBoundingClientRect();
      const originX = origin.left + origin.width / 2;
      const originY = origin.top + origin.height / 2;

      let best: { element: HTMLElement; score: number } | null = null;
      for (const item of items) {
        if (item === active) continue;
        const rect = item.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        const dx = x - originX;
        const dy = y - originY;
        const inDirection =
          (direction === "up" && dy < -8) ||
          (direction === "down" && dy > 8) ||
          (direction === "left" && dx < -8) ||
          (direction === "right" && dx > 8);
        if (!inDirection) continue;

        const primary = direction === "up" || direction === "down" ? Math.abs(dy) : Math.abs(dx);
        const secondary = direction === "up" || direction === "down" ? Math.abs(dx) : Math.abs(dy);
        const score = primary * 2 + secondary;
        if (!best || score < best.score) best = { element: item, score };
      }

      best?.element.focus({ preventScroll: false });
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key;
      const activeElement =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const isTextEntry =
        activeElement?.matches("input,textarea,select") || activeElement?.isContentEditable;

      if (isTextEntry) return;

      if (key === "ArrowUp" || key === "ArrowDown" || key === "ArrowLeft" || key === "ArrowRight") {
        event.preventDefault();
        moveFocus(key.replace("Arrow", "").toLowerCase() as "up" | "down" | "left" | "right");
      }
      if ((key === "Enter" || key === " ") && activeElement) {
        if (activeElement.matches("a[href],button,[role='button']")) {
          event.preventDefault();
          activeElement.click();
        }
      }
      if (key === "Backspace" || key === "BrowserBack" || key === "Escape") {
        event.preventDefault();
        if (window.history.length > 1) window.history.back();
      }
    };

    const timer = window.setTimeout(focusFirst, 250);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return null;
}
