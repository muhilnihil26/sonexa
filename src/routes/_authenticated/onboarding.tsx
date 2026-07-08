import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Brand } from "@/components/sonexa/Brand";
import { useLanguagePrefs } from "@/lib/language-prefs";
import { useSession } from "@/lib/auth";

export const LANGUAGES = [
  { code: "tamil", label: "Tamil" },
  { code: "hindi", label: "Hindi" },
  { code: "telugu", label: "Telugu" },
  { code: "malayalam", label: "Malayalam" },
  { code: "kannada", label: "Kannada" },
  { code: "english", label: "English" },
  { code: "punjabi", label: "Punjabi" },
  { code: "bengali", label: "Bengali" },
  { code: "marathi", label: "Marathi" },
  { code: "gujarati", label: "Gujarati" },
];
import { Check, Music2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Pick your languages — Sonexa" }] }),
  component: Onboarding,
});

function Onboarding() {
  const { user } = useSession();
  const { save } = useLanguagePrefs(user?.id);
  const nav = useNavigate();
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  function toggle(code: string) {
    setPicked((p) => p.includes(code) ? p.filter((x) => x !== code) : [...p, code]);
  }

  async function done() {
    if (picked.length === 0) { toast.error("Pick at least one language"); return; }
    setBusy(true);
    await save(picked);
    toast.success("Tuning your library…");
    nav({ to: "/home" });
  }

  return (
    <div className="min-h-full relative overflow-hidden">
      <div className="absolute inset-0 bg-glow opacity-60 pointer-events-none" />
      <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-brand-gradient opacity-30 blur-3xl animate-float" />
      <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-brand-gradient opacity-20 blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />

      <div className="relative max-w-3xl mx-auto px-6 py-12 md:py-20">
        <div className="animate-fade-up"><Brand size="lg" /></div>
        <h1 className="mt-8 text-4xl md:text-5xl font-black tracking-tight animate-fade-up" style={{ animationDelay: "0.1s" }}>
          What do you <span className="text-brand-gradient">vibe</span> to?
        </h1>
        <p className="mt-3 text-muted-foreground text-lg animate-fade-up" style={{ animationDelay: "0.2s" }}>
          Pick the languages you love — we'll fill your home with real songs from those scenes.
        </p>

        <div className="mt-10 grid grid-cols-2 md:grid-cols-5 gap-3 animate-fade-up" style={{ animationDelay: "0.3s" }}>
          {LANGUAGES.map((l, i) => {
            const on = picked.includes(l.code);
            return (
              <button key={l.code} onClick={() => toggle(l.code)}
                style={{ animationDelay: `${0.3 + i * 0.05}s` }}
                className={`relative animate-fade-up group aspect-square rounded-2xl border transition-all duration-300 overflow-hidden ${on ? "border-primary bg-primary/15 scale-[1.02] shadow-glow" : "border-border bg-card/40 hover:bg-card hover:-translate-y-1"}`}>
                <div className={`absolute inset-0 bg-brand-gradient transition-opacity ${on ? "opacity-20" : "opacity-0 group-hover:opacity-10"}`} />
                <div className="relative h-full flex flex-col items-center justify-center gap-2 p-3">
                  <Music2 className={`h-7 w-7 transition ${on ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
                  <div className="font-bold">{l.label}</div>
                </div>
                {on && (
                  <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center animate-fade-up">
                    <Check className="h-4 w-4" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-10 flex items-center justify-between gap-4 animate-fade-up" style={{ animationDelay: "0.6s" }}>
          <div className="text-sm text-muted-foreground">{picked.length} selected · pick as many as you like</div>
          <button onClick={done} disabled={busy} className="px-8 py-3 rounded-full bg-brand-gradient text-background font-bold shadow-glow hover:scale-105 transition disabled:opacity-50 animate-gradient-pan">
            {busy ? "Saving…" : "Continue →"}
          </button>
        </div>
      </div>
    </div>
  );
}