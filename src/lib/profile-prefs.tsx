/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useSession } from "./auth";

export type TileSize = "compact" | "normal" | "large";

type ProfilePrefs = {
  tileSize: TileSize;
  setTileSize: (size: TileSize) => void;
  gridClass: string;
};

const Ctx = createContext<ProfilePrefs | null>(null);
const defaultSize: TileSize = "normal";

function keyFor(email?: string | null) {
  return `sonexa.profile.${email ?? "guest"}.v1`;
}

function readSize(key: string): TileSize {
  if (typeof window === "undefined") return defaultSize;
  try {
    const raw = localStorage.getItem(key);
    if (raw === "compact" || raw === "normal" || raw === "large") return raw;
  } catch {
    /* localStorage can be unavailable in private contexts. */
  }
  return defaultSize;
}

function gridFor(size: TileSize) {
  if (size === "compact") {
    return "grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8";
  }
  if (size === "large") {
    return "grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
  }
  return "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6";
}

export function ProfilePrefsProvider({ children }: { children: ReactNode }) {
  const { user } = useSession();
  const storageKey = useMemo(() => keyFor(user?.email), [user?.email]);
  const [tileSize, setTileSizeState] = useState<TileSize>(() => readSize(storageKey));

  useEffect(() => {
    setTileSizeState(readSize(storageKey));
  }, [storageKey]);

  function setTileSize(size: TileSize) {
    setTileSizeState(size);
    try {
      localStorage.setItem(storageKey, size);
    } catch {
      /* ignore */
    }
  }

  return (
    <Ctx.Provider value={{ tileSize, setTileSize, gridClass: gridFor(tileSize) }}>
      {children}
    </Ctx.Provider>
  );
}

export function useProfilePrefs() {
  const value = useContext(Ctx);
  if (!value) throw new Error("useProfilePrefs outside ProfilePrefsProvider");
  return value;
}
