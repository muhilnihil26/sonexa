import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Headphones, MessageCircle, Share2, Sparkles, Download, Play } from "lucide-react";
import { useState } from "react";
import { Brand } from "@/components/sonexa/Brand";
import { MusicClock } from "@/components/sonexa/MusicClock";
import { getIntroConfig } from "@/lib/api/social.functions";
import { useSession } from "@/lib/auth";
import hero from "@/assets/sonexa-hero.jpg";

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
  const [musicStarted, setMusicStarted] = useState(false);
  const videoId = parseYouTubeId(data?.youtubeUrl ?? "");
  const appLink = user ? "/home" : "/auth";
  const appLabel = user ? "Go to Home" : "Sign in";

  return (
    <div className="relative min-h-svh overflow-x-hidden bg-background text-foreground">
      {musicStarted && videoId && (
        <iframe
          title="Sonexa intro music"
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&controls=0&loop=1&playlist=${videoId}&modestbranding=1`}
          allow="autoplay; encrypted-media"
          className="fixed left-0 top-0 h-px w-px opacity-0"
        />
      )}
      <div className="fixed inset-0 -z-10">
        <img src={hero} alt="" className="h-full w-full object-cover opacity-45" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(217,70,239,0.34),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(45,212,191,0.24),transparent_30%),linear-gradient(180deg,rgba(11,9,18,.28),rgba(11,9,18,.92))]" />
        <div className="absolute inset-0 bg-glow opacity-80 animate-gradient-pan" />
      </div>
      <header className="relative z-10 flex items-center justify-between px-6 py-6 md:px-12">
        <Brand />
        <Link
          to={appLink}
          className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background"
        >
          {appLabel}
        </Link>
      </header>
      <main className="relative z-10 mx-auto grid min-h-[calc(100svh-96px)] max-w-7xl items-center gap-8 px-5 pb-24 sm:px-6 md:grid-cols-[1.1fr_.9fr] md:gap-10 md:px-12 2xl:max-w-[92rem]">
        <section>
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Double-click logo intro
          </p>
          <h1 className="text-5xl font-black tracking-tight md:text-7xl">
            {data?.title || "Listen Beyond Limits"}
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
            Sonexa brings admin-approved YouTube full songs, iTunes previews, local backups,
            comments, likes, shares, playlists, and AI-assisted discovery into one player.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={() => setMusicStarted(true)}
              disabled={!videoId || musicStarted}
              className="inline-flex items-center gap-2 rounded-full bg-brand-gradient px-6 py-3 font-semibold text-background shadow-glow disabled:opacity-50"
            >
              <Play className="h-4 w-4 fill-background" />
              {musicStarted ? "Music playing" : "Start intro music"}
            </button>
            <Link
              to={appLink}
              className="inline-flex items-center rounded-full border border-border bg-card/50 px-6 py-3 font-semibold backdrop-blur"
            >
              {appLabel}
            </Link>
          </div>
        </section>
        <section className="grid gap-4">
          <MusicClock />
          <div className="relative overflow-hidden rounded-xl border border-border bg-card/55 p-5 backdrop-blur">
            <div className="absolute inset-0 bg-glow opacity-60 animate-gradient-pan" />
            <div className="relative flex h-28 items-end justify-center gap-2">
              {Array.from({ length: 18 }).map((_, index) => (
                <span
                  key={index}
                  className="music-clock-bar w-2 rounded-full bg-brand-gradient"
                  style={{
                    animationDelay: `${index * 0.07}s`,
                    height: `${24 + (index % 6) * 9}%`,
                  }}
                />
              ))}
            </div>
          </div>
          {[
            {
              icon: Headphones,
              title: "Full song player",
              text: "YouTube tracks play as full video songs in full-screen mode.",
            },
            {
              icon: Download,
              title: "Offline backup",
              text: "Downloads are remembered locally under your email on this device.",
            },
            {
              icon: Share2,
              title: "Shareable links",
              text: "Open a song link without login, with 10 guest plays.",
            },
            {
              icon: MessageCircle,
              title: "Community layer",
              text: "View counts, likes, and comments sit on top of every song.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-border bg-card/55 p-4 backdrop-blur"
            >
              <feature.icon className="mb-3 h-5 w-5 text-primary" />
              <div className="font-semibold">{feature.title}</div>
              <p className="mt-1 text-sm text-muted-foreground">{feature.text}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
