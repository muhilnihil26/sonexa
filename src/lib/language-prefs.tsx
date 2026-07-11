import { useEffect, useMemo, useState } from "react";

const KEY = "sonexa.languages";

function keyFor(userId: string | undefined) {
  return userId ? `${KEY}.${userId}` : KEY;
}

function readLanguages(key: string) {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(key) || "[]") as string[];
  } catch {
    return [];
  }
}

export function useLanguagePrefs(userId: string | undefined) {
  const storageKey = useMemo(() => keyFor(userId), [userId]);
  const [languages, setLanguages] = useState<string[]>(() => readLanguages(storageKey));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLanguages(readLanguages(storageKey));
    setLoading(false);
  }, [storageKey]);

  async function save(langs: string[]) {
    setLanguages(langs);
    try {
      localStorage.setItem(storageKey, JSON.stringify(langs));
    } catch {
      /* localStorage can be unavailable in private contexts. */
    }
  }

  return { languages, loading, save };
}
