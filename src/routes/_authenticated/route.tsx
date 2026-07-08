import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/sonexa/AppSidebar";
import { PlayerBar } from "@/components/sonexa/PlayerBar";
import { MiniPlayer } from "@/components/sonexa/MiniPlayer";
import { YouTubeHost } from "@/components/sonexa/YouTubeHost";
import { LocalLibraryProvider } from "@/lib/local-library";
import { ProfilePrefsProvider } from "@/lib/profile-prefs";
import { useSession, useIsAdmin } from "@/lib/auth";
import { needsEmailVerification } from "@/integrations/firebase/client";
import { TvCastBridge, TvRemoteReceiver, TvWifiConnectPrompt } from "@/lib/tv-remote";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthedLayout,
});

function AuthedLayout() {
  const { session, loading } = useSession();
  const isAdmin = useIsAdmin(session?.user.id);
  const nav = useNavigate();
  const [checked, setChecked] = useState(false);
  const [platformClass, setPlatformClass] = useState("platform-web");
  const [showMiniPlayer, setShowMiniPlayer] = useState(() => {
    // Initialize from localStorage to persist across page reloads
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sonexa.miniPlayer.dismissed");
      return saved !== "true";
    }
    return false;
  });
  const [miniPlayerExpanded, setMiniPlayerExpanded] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!session) nav({ to: "/auth" });
    else if (needsEmailVerification(session.user)) nav({ to: "/auth" });
    else setChecked(true);
  }, [session, loading, nav]);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const wide = window.matchMedia("(min-width: 1200px)").matches;
    const isCar = /\b(android auto|carplay|automotive)\b/.test(ua);
    const isTv = /\b(tv|smart-tv|smarttv|googletv|appletv|hbbtv|netcast|tizen|webos)\b/.test(ua);
    const isAndroid = /\bandroid\b/.test(ua);
    const isWindows = /\bwindows\b/.test(ua);

    if (isCar) setPlatformClass("platform-car");
    else if (isTv || (coarse && wide)) setPlatformClass("platform-tv");
    else if (isAndroid) setPlatformClass("platform-android");
    else if (isWindows) setPlatformClass("platform-windows");
    else setPlatformClass("platform-web");
  }, []);

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <LocalLibraryProvider>
      <ProfilePrefsProvider>
        <div
          className={`app-shell ${platformClass} flex h-dvh w-full max-w-full overflow-hidden bg-background`}
        >
          <AppSidebar isAdmin={isAdmin} />
          <main className="h-dvh min-w-0 flex-1 overflow-x-hidden overflow-y-auto pb-44 pt-0 md:pb-28">
            <Outlet />
          </main>
          <PlayerBar onMiniPlayer={() => setShowMiniPlayer(true)} />
          {showMiniPlayer && (
            <MiniPlayer
              onExpand={() => {
                setShowMiniPlayer(false);
                setMiniPlayerExpanded(true);
              }}
            />
          )}
          <YouTubeHost />
          <TvRemoteReceiver />
          <TvCastBridge />
          <TvWifiConnectPrompt />
        </div>
      </ProfilePrefsProvider>
    </LocalLibraryProvider>
  );
}
