import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  Search,
  Library,
  Plus,
  Heart,
  Shield,
  LogOut,
  UserCircle,
  MonitorSmartphone,
  Flame,
  Compass,
  MoreHorizontal,
  Sparkles,
  Zap,
  Music2,
} from "lucide-react";
import { Brand } from "./Brand";
import { firebaseSignOut } from "@/integrations/firebase/client";
import { useLanguagePrefs } from "@/lib/language-prefs";
import { useSession } from "@/lib/auth";
import { useState } from "react";

const nav = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/browse", label: "Browse", icon: Compass },
  { to: "/search", label: "Search", icon: Search },
  { to: "/library", label: "Your Library", icon: Library },
];

const moreNav = [
  { to: "/vaster", label: "Vaster AI", icon: Sparkles },
  { to: "/remote", label: "Remote", icon: MonitorSmartphone },
  { to: "/profile", label: "Profile", icon: UserCircle },
];

export function AppSidebar({ isAdmin }: { isAdmin?: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const { user } = useSession();
  const { languages } = useLanguagePrefs(user?.id);
  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-2 overflow-y-auto border-r border-border bg-sidebar p-4 md:flex">
        <div className="px-2 py-3">
          <Brand />
        </div>

        {/* Language indicator */}
        {languages.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/30 mb-2">
            <Music2 className="h-4 w-4 text-primary shrink-0" />
            <div>
              <div className="text-[10px] uppercase tracking-widest text-primary font-bold">Languages</div>
              <div className="text-xs text-primary/90 truncate">{languages.slice(0, 2).join(", ")}{languages.length > 2 ? ` +${languages.length - 2}` : ""}</div>
            </div>
          </div>
        )}

        <nav className="flex flex-col gap-1 mt-2">
          {[...nav, ...moreNav].map((n) => {
            const active = pathname === n.to;
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${active ? "bg-sidebar-accent text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60"}`}
              >
                <Icon className="h-4 w-4" /> {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="my-3 h-px bg-border" />
        <div className="px-3 text-xs uppercase tracking-wider text-muted-foreground mb-2">
          Quick
        </div>
        <a
          href="/library#create-playlist"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60"
        >
          <Plus className="h-4 w-4" /> Create playlist
        </a>
        <a
          href="/library#liked-songs"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60"
        >
          <Heart className="h-4 w-4" /> Liked songs
        </a>
        {isAdmin && (
          <Link
            to="/admin"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60"
          >
            <Shield className="h-4 w-4" /> Admin
          </Link>
        )}
        <div className="mt-auto pt-4 text-[10px] text-muted-foreground/70 px-3">
          <div>SONEXA</div>
          <div className="opacity-70">Listen Beyond Limits</div>
          <div className="opacity-50 mt-1">By War.Dev</div>
          <button
            onClick={async () => {
              await firebaseSignOut();
              window.location.href = "/";
            }}
            className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-3 w-3" /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 px-2 pb-[calc(env(safe-area-inset-bottom,0px)+0.35rem)] pt-1.5 backdrop-blur-xl md:hidden">
        <nav className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {nav.map((n) => {
            const active = pathname === n.to;
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-medium transition ${active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Icon className="h-5 w-5" />
                <span className="max-w-full truncate">{n.label.replace("Your ", "")}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className={`flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-medium transition ${showMoreMenu ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span>More</span>
          </button>
        </nav>
      </div>

      {/* Mobile more menu */}
      {showMoreMenu && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowMoreMenu(false)}
          />
          <div className="absolute bottom-20 left-2 right-2 bg-card rounded-2xl border border-border p-4 shadow-glow animate-fade-up">
            <nav className="flex flex-col gap-2">
              {moreNav.map((n) => {
                const active = pathname === n.to;
                const Icon = n.icon;
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    onClick={() => setShowMoreMenu(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60"}`}
                  >
                    <Icon className="h-5 w-5" /> {n.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
