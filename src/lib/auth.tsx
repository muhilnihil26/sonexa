import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { firebaseAuth } from "@/integrations/firebase/client";
import { ADMIN_EMAIL } from "@/integrations/firebase/config";

export type SonexaUser = User & {
  id: string;
  user_metadata?: {
    full_name?: string | null;
    name?: string | null;
    avatar_url?: string | null;
  };
};

function withCompatUser(user: User | null): SonexaUser | null {
  if (!user) return null;
  return Object.assign(user, {
    id: user.uid,
    user_metadata: {
      full_name: user.displayName,
      name: user.displayName,
      avatar_url: user.photoURL,
    },
  }) as SonexaUser;
}

export function useSession() {
  const [user, setUser] = useState<SonexaUser | null>(withCompatUser(firebaseAuth.currentUser));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(firebaseAuth, (nextUser) => {
      setUser(withCompatUser(nextUser));
      setLoading(false);
    });
  }, []);

  return { session: user ? { user } : null, loading, user };
}

export function useIsAdmin(userIdOrEmail: string | undefined | null) {
  const [isAdmin, setAdmin] = useState(false);

  useEffect(() => {
    const email = firebaseAuth.currentUser?.email ?? userIdOrEmail ?? "";
    setAdmin(email.toLowerCase() === ADMIN_EMAIL);
  }, [userIdOrEmail]);

  return isAdmin;
}
