import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Track } from "./player-store";
import { useSession } from "./auth";
import { useServerFn } from "@tanstack/react-start";
import { adminBackupLocalLibrary as backupLocalLibrary, restoreLocalLibrary } from "./api/social.functions";

// Lightweight client-side library: liked songs + user playlists, persisted
// in localStorage. Works for every track including iTunes samples and
// YouTube trending entries that aren't in the database.

export type LocalPlaylist = {
  id: string;
  name: string;
  tracks: Track[];
  createdAt: number;
  isPublic: boolean;
};

type Ctx = {
  likes: Record<string, Track>;
  playlists: LocalPlaylist[];
  isLiked: (id: string) => boolean;
  toggleLike: (t: Track) => void;
  createPlaylist: (name: string) => LocalPlaylist;
  addToPlaylist: (playlistId: string, t: Track) => void;
  removeFromPlaylist: (playlistId: string, trackId: string) => void;
  deletePlaylist: (playlistId: string) => void;
  renamePlaylist: (playlistId: string, name: string) => void;
};

const LS_LIKES = "sonexa.likes.v1";
const LS_PL = "sonexa.playlists.v1";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const r = localStorage.getItem(key);
    return r ? (JSON.parse(r) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* */
  }
}

const C = createContext<Ctx | null>(null);

export function LocalLibraryProvider({ children }: { children: ReactNode }) {
  const [likes, setLikes] = useState<Record<string, Track>>(() => read(LS_LIKES, {}));
  const [playlists, setPlaylists] = useState<LocalPlaylist[]>(() =>
    read<LocalPlaylist[]>(LS_PL, []).map((playlist) => ({ ...playlist, isPublic: true })),
  );

  const { session } = useSession();
  const backupFn = useServerFn(backupLocalLibrary);
  const restoreFn = useServerFn(restoreLocalLibrary);
  const [lastBackupSig, setLastBackupSig] = useState("");

  useEffect(() => {
    write(LS_LIKES, likes);
  }, [likes]);
  useEffect(() => {
    write(LS_PL, playlists);
  }, [playlists]);

  // Debounced auto-sync to Firestore (liked tracks, playlists, taste profile, languages)
  useEffect(() => {
    if (!session?.user) return;
    const timer = setTimeout(() => {
      const userKey = session.user.email ?? session.user.id;
      const tasteKey = `sonexa.taste.${userKey}.v1`;
      const tasteRaw = localStorage.getItem(tasteKey) || "";
      const likesRaw = localStorage.getItem(LS_LIKES) || "";
      const plRaw = localStorage.getItem(LS_PL) || "";
      const langKey = `sonexa.languages.${session.user.id}`;
      const langRaw = localStorage.getItem(langKey) || "[]";

      const sig = `${likesRaw.length}-${plRaw.length}-${tasteRaw.length}-${langRaw.length}`;
      if (sig === lastBackupSig) return;
      setLastBackupSig(sig);

      const taste = tasteRaw ? JSON.parse(tasteRaw) : null;
      const languages = langRaw ? JSON.parse(langRaw) : [];

      backupFn({ data: { playlists, likes, taste, languages } }).catch(() => undefined);
    }, 4000);
    return () => clearTimeout(timer);
  }, [likes, playlists, session?.user, backupFn, lastBackupSig]);

  // Auto-restore and merge on login
  useEffect(() => {
    if (!session?.user) return;
    restoreFn()
      .then((res) => {
        if (res.likes) {
          setLikes((prev) => ({ ...prev, ...res.likes }));
        }
        if (res.playlists) {
          setPlaylists((prev) => {
            const merged = [...prev];
            res.playlists.forEach((cloudPl: any) => {
              if (!merged.some((p) => p.id === cloudPl.id)) {
                merged.push(cloudPl);
              }
            });
            return merged;
          });
        }
        if (res.languages) {
          const langKey = `sonexa.languages.${session.user.id}`;
          localStorage.setItem(langKey, JSON.stringify(res.languages));
          // Trigger a storage/state update if possible, or reload
        }
        if (res.taste) {
          const userKey = session.user.email ?? session.user.id;
          const tasteKey = `sonexa.taste.${userKey}.v1`;
          const localTasteRaw = localStorage.getItem(tasteKey);
          const localTaste = localTasteRaw ? JSON.parse(localTasteRaw) : null;

          const mergedTaste = {
            track: { ...res.taste.track, ...localTaste?.track },
            artist: { ...res.taste.artist, ...localTaste?.artist },
            language: { ...res.taste.language, ...localTaste?.language },
            kind: { ...res.taste.kind, ...localTaste?.kind },
            recent: { ...res.taste.recent, ...localTaste?.recent },
            recentTracks: [
              ...(res.taste.recentTracks ?? []),
              ...(localTaste?.recentTracks ?? []),
            ]
              .filter((t, i, self) => self.findIndex((x) => x.id === t.id) === i)
              .slice(0, 24),
          };
          localStorage.setItem(tasteKey, JSON.stringify(mergedTaste));
        }
      })
      .catch(() => undefined);
  }, [session?.user, restoreFn]);

  const isLiked = useCallback((id: string) => !!likes[id], [likes]);
  const toggleLike = useCallback((t: Track) => {
    setLikes((p) => {
      const n = { ...p };
      if (n[t.id]) delete n[t.id];
      else n[t.id] = t;
      return n;
    });
  }, []);
  const createPlaylist = useCallback((name: string) => {
    const pl: LocalPlaylist = {
      id: `pl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: name.trim() || "New playlist",
      tracks: [],
      createdAt: Date.now(),
      isPublic: true,
    };
    setPlaylists((p) => [pl, ...p]);
    return pl;
  }, []);
  const addToPlaylist = useCallback((playlistId: string, t: Track) => {
    setPlaylists((p) =>
      p.map((pl) =>
        pl.id === playlistId
          ? pl.tracks.some((x) => x.id === t.id)
            ? pl
            : { ...pl, tracks: [...pl.tracks, t] }
          : pl,
      ),
    );
  }, []);
  const removeFromPlaylist = useCallback((playlistId: string, trackId: string) => {
    setPlaylists((p) =>
      p.map((pl) =>
        pl.id === playlistId ? { ...pl, tracks: pl.tracks.filter((t) => t.id !== trackId) } : pl,
      ),
    );
  }, []);
  const deletePlaylist = useCallback((playlistId: string) => {
    setPlaylists((p) => p.filter((pl) => pl.id !== playlistId));
  }, []);
  const renamePlaylist = useCallback((playlistId: string, name: string) => {
    setPlaylists((p) => p.map((pl) => (pl.id === playlistId ? { ...pl, name } : pl)));
  }, []);

  return (
    <C.Provider
      value={{
        likes,
        playlists,
        isLiked,
        toggleLike,
        createPlaylist,
        addToPlaylist,
        removeFromPlaylist,
        deletePlaylist,
        renamePlaylist,
      }}
    >
      {children}
    </C.Provider>
  );
}

export function useLocalLibrary() {
  const c = useContext(C);
  if (!c) throw new Error("useLocalLibrary outside LocalLibraryProvider");
  return c;
}
