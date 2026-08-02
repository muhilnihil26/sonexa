import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Brand } from "@/components/sonexa/Brand";
import { getIntroConfig } from "@/lib/api/social.functions";
import { useSession } from "@/lib/auth";

export const Route = createFileRoute("/intro")({
  head: () => ({ meta: [{ title: "Intro - Sonexa" }] }),
  component: IntroPage,
});

function parseYouTubeId(input: string) {
  try {
    const url = new URL(input);
    if (url.hostname.includes("youtu.be")) return url.pathname.slice(1, 12);
    return url.searchParams.get("v") ?? "";
  } catch {
    return "";
  }
}

function IntroPage() {
  const getIntro = useServerFn(getIntroConfig);
  const { data } = useQuery({ queryKey: ["intro-config"], queryFn: () => getIntro() });
  const { user } = useSession();
  const videoId = parseYouTubeId(data?.youtubeUrl ?? "");
  const appLink = user ? "/home" : "/auth";
  const appLabel = user ? "Go to Home" : "Sign in";

  return (
    <div className="relative min-h-svh overflow-x-hidden bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
      {/* Background music video (hidden) */}
      {videoId && (
        <iframe
          title="Sonexa intro music"
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&controls=0&loop=1&playlist=${videoId}&modestbranding=1`}
          allow="autoplay; encrypted-media"
          className="fixed left-0 top-0 h-px w-px opacity-0"
        />
      )}

      {/* Background decorative elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center gap-8 px-4 py-20">
        {/* Logo only - simple intro */}
        <div className="animate-fade-up">
          <Brand />
        </div>

        {/* Tagline */}
        <p className="text-center text-muted-foreground text-sm max-w-xs animate-fade-up" style={{ animationDelay: '0.2s' }}>
          {data?.title || "Listen Beyond Limits"}
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 animate-fade-up" style={{ animationDelay: '0.4s' }}>
          <Link
            to={appLink}
            className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-brand-gradient text-background font-semibold shadow-glow hover:scale-105 transition-transform touch-manipulation min-h-[44px]"
          >
            {appLabel}
          </Link>
        </div>

        {/* Minimal info text */}
        <div className="text-center text-xs text-muted-foreground/60 mt-8 animate-fade-up" style={{ animationDelay: '0.6s' }}>
          <p>Background music by admin</p>
          <p className="mt-1">Double-click logo to open this page</p>
        </div>
      </div>
    </div>
  );
}
