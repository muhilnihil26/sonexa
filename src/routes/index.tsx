import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Sparkles, Headphones, Radio, ArrowRight, Download } from "lucide-react";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { Capacitor } from "@capacitor/core";
import { firebaseAuth } from "@/integrations/firebase/client";
import hero from "@/assets/sonexa-hero.jpg";
import cover1 from "@/assets/cover-1.jpg";
import cover3 from "@/assets/cover-3.jpg";
import cover5 from "@/assets/cover-5.jpg";
import { Brand } from "@/components/sonexa/Brand";
import { AndroidDownloadChooser } from "@/components/sonexa/AndroidDownloadChooser";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sonexa — Listen Beyond Limits" },
      {
        name: "description",
        content:
          "Premium AI-powered Tamil music streaming. Discover, play, and feel music without limits. By War.Dev.",
      },
      { property: "og:title", content: "Sonexa — Listen Beyond Limits" },
      {
        property: "og:description",
        content: "Premium AI-powered Tamil music streaming. By War.Dev.",
      },
    ],
  }),
  component: Landing,
});

function Splash() {
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-background overflow-hidden">
      <div className="absolute inset-0 bg-glow animate-gradient-pan opacity-80" />
      <div className="absolute -top-40 -left-40 h-[28rem] w-[28rem] rounded-full bg-brand-gradient opacity-30 blur-3xl animate-float" />
      <div
        className="absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-brand-gradient opacity-30 blur-3xl animate-float"
        style={{ animationDelay: "1.5s" }}
      />
      <div className="relative flex flex-col items-center gap-6 animate-fade-up">
        <div className="scale-150 animate-pulse drop-shadow-2xl">
          <Brand />
        </div>
        <div className="flex items-end gap-1.5 h-6">
          <span className="eq-bar w-1.5 h-6 bg-primary" />
          <span className="eq-bar w-1.5 h-6 bg-primary" style={{ animationDelay: "0.15s" }} />
          <span className="eq-bar w-1.5 h-6 bg-accent" style={{ animationDelay: "0.3s" }} />
          <span className="eq-bar w-1.5 h-6 bg-primary" style={{ animationDelay: "0.45s" }} />
          <span className="eq-bar w-1.5 h-6 bg-accent" style={{ animationDelay: "0.6s" }} />
        </div>
      </div>
    </div>
  );
}

function Landing() {
  const nav = useNavigate();
  const [phase, setPhase] = useState<"checking" | "splash" | "landing">("checking");
  const isNativeApp = Capacitor.isNativePlatform();

  useEffect(() => {
    let cancelled = false;
    const minSplash = new Promise((r) => setTimeout(r, 1400));
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      minSplash.then(() => {
        if (cancelled) return;
        if (user) nav({ to: "/home", replace: true });
        else setPhase("landing");
      });
    });
    setPhase("splash");
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [nav]);

  if (phase !== "landing") return <Splash />;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background hero image with glow */}
      <div className="absolute inset-0 -z-10">
        <img
          src={hero}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-50"
          width={1920}
          height={1280}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />
        <div className="absolute inset-0 bg-glow" />
      </div>

      <header className="flex items-center justify-between px-6 md:px-12 py-6">
        <Brand />
        <nav className="flex items-center gap-3">
          <Link
            to="/auth"
            className="text-sm text-muted-foreground hover:text-foreground transition"
          >
            Sign in
          </Link>
          <Link
            to="/auth"
            search={{ mode: "signup" } as never}
            className="px-4 py-2 rounded-full bg-foreground text-background text-sm font-semibold hover:scale-105 transition"
          >
            Get Sonexa
          </Link>
        </nav>
      </header>

      <main className="px-6 md:px-12 pt-16 md:pt-24 pb-32 max-w-7xl mx-auto animate-page-in">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card/40 backdrop-blur text-xs text-muted-foreground mb-6">
            <Sparkles className="h-3 w-3 text-primary" /> AI-powered Tamil music platform
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.95]">
            Listen <br className="hidden md:block" />
            <span className="text-brand-gradient">Beyond Limits.</span>
          </h1>
          <p className="mt-6 text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl">
            Sonexa is a premium streaming experience built for Tamil music — classical, indie,
            cinematic, folk and rap. AI curates every detail so the music flows endlessly.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              to="/auth"
              search={{ mode: "signup" } as never}
              className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-brand-gradient text-background font-semibold shadow-glow hover:scale-105 transition"
            >
              Start listening free{" "}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" />
            </Link>
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-border bg-card/40 backdrop-blur text-foreground font-medium hover:bg-card transition"
            >
              I already have an account
            </Link>
            {!isNativeApp && (
              <>
                <AndroidDownloadChooser
                  label="Android App"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-primary/40 bg-primary/10 backdrop-blur text-foreground font-medium hover:bg-primary/15 transition lg:hidden"
                />
                <div className="hidden lg:flex gap-3">
                  <a
                    href="/sonexa-windows-installer.exe"
                    download
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-primary/40 bg-primary/10 backdrop-blur text-foreground font-medium hover:bg-primary/15 transition"
                  >
                    <Download className="h-4 w-4" />
                    Windows App
                  </a>
                  <AndroidDownloadChooser
                    label="Android App"
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-primary/40 bg-primary/10 backdrop-blur text-foreground font-medium hover:bg-primary/15 transition"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Floating album stack */}
        <div className="mt-24 grid grid-cols-3 gap-4 md:gap-6 max-w-2xl">
          {[cover1, cover3, cover5].map((c, i) => (
            <div
              key={i}
              className="aspect-square rounded-2xl overflow-hidden shadow-card hover:shadow-glow transition-all duration-500"
              style={{
                transform: `rotate(${(i - 1) * 4}deg) translateY(${i === 1 ? "-20px" : "0"})`,
              }}
            >
              <img src={c} alt="" loading="lazy" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>

        {/* Feature triple */}
        <div className="mt-32 grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Sparkles,
              title: "AI Curation",
              desc: "Metadata, mood, descriptions and recommendations — generated and refined automatically.",
            },
            {
              icon: Radio,
              title: "Tamil First",
              desc: "Built around Tamil classical, cinema, indie, folk and rap. Designed for the culture.",
            },
            {
              icon: Headphones,
              title: "Premium Player",
              desc: "Buttery-smooth playback, queue, shuffle, repeat, full-screen mode and cross-device sync.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="p-6 rounded-2xl border border-border bg-card/40 backdrop-blur hover:bg-card transition"
            >
              <f.icon className="h-6 w-6 text-primary mb-3" />
              <div className="font-semibold text-lg">{f.title}</div>
              <div className="mt-2 text-sm text-muted-foreground">{f.desc}</div>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-border px-6 md:px-12 py-8 text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-3">
        <div>© {new Date().getFullYear()} Sonexa</div>
        <div className="opacity-70">SONEXA · Listen Beyond Limits · By War.Dev</div>
      </footer>
    </div>
  );
}
