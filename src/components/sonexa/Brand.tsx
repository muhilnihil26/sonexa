import { useNavigate } from "@tanstack/react-router";
import { useRef, type MouseEvent } from "react";

export function Brand({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const nav = useNavigate();
  const clickTimer = useRef<number | null>(null);
  const text = size === "lg" ? "text-4xl" : size === "sm" ? "text-xl" : "text-2xl";
  const mark = size === "lg" ? "h-12 w-12" : size === "sm" ? "h-9 w-9" : "h-10 w-10";
  const bar = size === "lg" ? "h-7" : size === "sm" ? "h-4" : "h-5";

  function openHomeOrIntro(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    if (clickTimer.current) {
      window.clearTimeout(clickTimer.current);
      clickTimer.current = null;
      nav({ to: "/intro" });
      return;
    }
    clickTimer.current = window.setTimeout(() => {
      clickTimer.current = null;
      nav({ to: "/" });
    }, 260);
  }

  return (
    <a
      href="/"
      onClick={openHomeOrIntro}
      className="inline-flex min-w-0 items-center gap-2.5 group"
      aria-label="Sonexa"
    >
      <img
        src="/logo-icon.png"
        alt="Sonexa Logo"
        className={`${mark} shrink-0 rounded-xl shadow-card ring-1 ring-white/10 transition group-hover:scale-[1.03] object-cover`}
      />
      <span
        className={`relative min-w-0 truncate ${text} font-black text-white drop-shadow-[0_2px_18px_rgba(217,70,239,0.45)] transition-transform group-hover:scale-[1.02]`}
        style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", letterSpacing: "0" }}
      >
        Sonexa
      </span>
    </a>
  );
}
