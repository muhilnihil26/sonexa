import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Music2, Radio, Sparkles, Play, Pause, Headphones } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { Brand } from "@/components/sonexa/Brand";
import { toast } from "sonner";
import {
  firebaseAuth,
  firebaseCompleteRedirectSignIn,
  firebaseGoogleSignIn,
  firebaseReloadCurrentUser,
  firebaseResendVerification,
  firebaseSignIn,
  firebaseSignUp,
  needsEmailVerification,
} from "@/integrations/firebase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in - Sonexa" },
      { name: "description", content: "Sign in to Sonexa to start listening." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState("");
  const [isPlayingTrial, setIsPlayingTrial] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    firebaseCompleteRedirectSignIn()
      .then((result) => {
        if (result?.user && !needsEmailVerification(result.user)) {
          nav({ to: "/onboarding" });
        }
      })
      .catch(() => {
        /* Redirect result is optional and can be empty on normal page loads. */
      });
    if (firebaseAuth.currentUser && !needsEmailVerification(firebaseAuth.currentUser)) {
      nav({ to: "/home" });
    } else if (needsEmailVerification(firebaseAuth.currentUser)) {
      setVerifyEmail(firebaseAuth.currentUser?.email ?? email);
    }
  }, [email, nav]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        await firebaseSignUp(email, password, name);
        setVerifyEmail(email);
        toast.success("Verification email sent");
      } else {
        const result = await firebaseSignIn(email, password);
        if (needsEmailVerification(result.user)) {
          setVerifyEmail(result.user.email ?? email);
          toast.info("Verify your email before opening Sonexa");
          return;
        }
        nav({ to: "/home" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setBusy(true);
    try {
      const result = await firebaseGoogleSignIn();
      if (result?.user && !needsEmailVerification(result.user)) nav({ to: "/onboarding" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Google sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  async function resendVerification() {
    setBusy(true);
    try {
      await firebaseResendVerification();
      toast.success("Verification email sent again");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not resend verification");
    } finally {
      setBusy(false);
    }
  }

  function playAudioTrial() {
    if (isPlayingTrial) {
      audioRef.current?.pause();
      setIsPlayingTrial(false);
    } else {
      // Use a sample audio from a free source or a demo track
      const demoAudioUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
      if (!audioRef.current) {
        audioRef.current = new Audio(demoAudioUrl);
        audioRef.current.volume = 0.5;
        audioRef.current.onended = () => setIsPlayingTrial(false);
      }
      audioRef.current.play();
      setIsPlayingTrial(true);
      toast.success("Playing demo track");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Brand />
        </div>

        {!verifyEmail ? (
          <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-xl p-6 shadow-2xl">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Music2 className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">{mode === "signin" ? "Welcome back" : "Create account"}</h1>
            </div>

            {/* Audio Trial Button */}
            <button
              onClick={playAudioTrial}
              className="w-full mb-6 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/30 transition"
            >
              {isPlayingTrial ? (
                <>
                  <Pause className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-primary">Pause Demo</span>
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-primary">Hear a Demo Track</span>
                </>
              )}
            </button>

            <form onSubmit={submit} className="space-y-4">
              {mode === "signup" && (
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-input focus:border-primary focus:outline-none transition"
                    required
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-input focus:border-primary focus:outline-none transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-input focus:border-primary focus:outline-none transition"
                  required
                  minLength={6}
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="w-full py-3 rounded-xl bg-brand-gradient text-background font-bold shadow-glow hover:scale-[1.02] transition disabled:opacity-50"
              >
                {busy ? "Processing..." : mode === "signin" ? "Sign in" : "Create account"}
              </button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-card/40 text-muted-foreground">Or continue with</span>
                </div>
              </div>
              <button
                onClick={google}
                disabled={busy}
                className="mt-4 w-full py-3 rounded-xl border border-border bg-background/60 hover:bg-background transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </button>
            </div>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                className="text-primary font-semibold hover:underline"
              >
                {mode === "signin" ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-xl p-6 shadow-2xl text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Verify your email</h1>
            </div>
            <p className="text-muted-foreground mb-6">
              We sent a verification link to <strong>{verifyEmail}</strong>. Click it to activate your account.
            </p>
            <button
              onClick={resendVerification}
              disabled={busy}
              className="px-6 py-3 rounded-xl bg-brand-gradient text-background font-bold shadow-glow hover:scale-[1.02] transition disabled:opacity-50"
            >
              {busy ? "Sending..." : "Resend verification email"}
            </button>
            <p className="mt-4 text-sm text-muted-foreground">
              Already verified?{" "}
              <button
                onClick={() => {
                  firebaseReloadCurrentUser().then((user) => {
                    if (user && !needsEmailVerification(user)) nav({ to: "/home" });
                  });
                }}
                className="text-primary font-semibold hover:underline"
              >
                Continue to Sonexa
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function LoginMusicAnimation({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`mt-8 overflow-hidden rounded-3xl border border-border bg-card/55 p-5 ${
        compact ? "p-4" : ""
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-primary">
          <Sparkles className="h-4 w-4" /> Live mix
        </span>
        <span className="text-xs text-muted-foreground">Sonexa</span>
      </div>
      <div className="flex h-28 items-end justify-between gap-2">
        {Array.from({ length: compact ? 18 : 28 }).map((_, index) => (
          <span
            key={index}
            className="music-clock-bar w-full rounded-full bg-brand-gradient"
            style={{
              animationDelay: `${(index % 9) * 0.08}s`,
              height: `${22 + ((index * 13) % 68)}%`,
            }}
          />
        ))}
      </div>
      <div className="mt-5 flex w-max gap-3 animate-marquee-left">
        {["Tamil hits", "YouTube full songs", "BGM previews", "AI search", "Offline backups"].map(
          (item) => (
            <span
              key={item}
              className="rounded-full border border-border bg-background/55 px-3 py-1 text-xs text-muted-foreground"
            >
              {item}
            </span>
          ),
        )}
        {["Tamil hits", "YouTube full songs", "BGM previews", "AI search", "Offline backups"].map(
          (item) => (
            <span
              key={`${item}-2`}
              className="rounded-full border border-border bg-background/55 px-3 py-1 text-xs text-muted-foreground"
            >
              {item}
            </span>
          ),
        )}
      </div>
    </div>
  );
}
