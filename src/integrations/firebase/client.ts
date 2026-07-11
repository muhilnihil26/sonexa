import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  updatePassword,
  signInWithCredential,
  signOut,
  reload,
  type User,
} from "firebase/auth";
import { Capacitor } from "@capacitor/core";
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";
import { getFirestore } from "firebase/firestore";
import { firebaseConfig } from "./config";

export const firebaseApp = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
export const firebaseDb = getFirestore(firebaseApp);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

if (typeof window !== "undefined") {
  isSupported()
    .then((supported) => {
      if (supported) getAnalytics(firebaseApp);
    })
    .catch(() => {
      /* Analytics is optional. */
    });
}

export async function firebaseSignIn(email: string, password: string) {
  return signInWithEmailAndPassword(firebaseAuth, email, password);
}

export async function firebaseSignUp(email: string, password: string, displayName: string) {
  const result = await createUserWithEmailAndPassword(firebaseAuth, email, password);
  if (displayName.trim()) await updateProfile(result.user, { displayName: displayName.trim() });
  await sendEmailVerification(result.user);
  return result;
}

export function needsEmailVerification(user: User | null | undefined) {
  if (!user?.email) return false;
  const usesPassword = user.providerData.some((provider) => provider.providerId === "password");
  return usesPassword && !user.emailVerified;
}

export async function firebaseResendVerification() {
  const user = firebaseAuth.currentUser;
  if (!user) throw new Error("Sign in first");
  await sendEmailVerification(user);
}

export async function firebaseReloadCurrentUser() {
  const user = firebaseAuth.currentUser;
  if (!user) return null;
  await reload(user);
  return firebaseAuth.currentUser;
}

export async function firebaseGoogleSignIn() {
  if (Capacitor.isNativePlatform()) {
    const result = await FirebaseAuthentication.signInWithGoogle({ skipNativeAuth: true });
    if (result.credential?.idToken) {
      const credential = GoogleAuthProvider.credential(
        result.credential.idToken,
        result.credential.accessToken,
      );
      return signInWithCredential(firebaseAuth, credential);
    }
    throw new Error("Google Sign-In failed on device.");
  }

  const isTauriDesktop =
    typeof window !== "undefined" &&
    ("__TAURI_INTERNALS__" in window ||
      "__TAURI__" in window ||
      navigator.userAgent.includes("Tauri"));

  if (isTauriDesktop) {
    window.sessionStorage.setItem("sonexa.googleRedirect.pending", "true");
    await signInWithRedirect(firebaseAuth, googleProvider);
    return null;
  }

  try {
    return await signInWithPopup(firebaseAuth, googleProvider);
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
    if (code === "auth/popup-blocked" || code === "auth/popup-closed-by-user") {
      window.sessionStorage.setItem("sonexa.googleRedirect.pending", "true");
      await signInWithRedirect(firebaseAuth, googleProvider);
      return null;
    }
    throw error;
  }
}

export async function firebaseCompleteRedirectSignIn() {
  const result = await getRedirectResult(firebaseAuth);
  if (result?.user) window.sessionStorage.removeItem("sonexa.googleRedirect.pending");
  return result;
}

export async function firebaseUpdateUserProfile(data: { displayName: string; photoURL?: string }) {
  const user = firebaseAuth.currentUser;
  if (!user) throw new Error("Sign in first");
  await updateProfile(user, {
    displayName: data.displayName.trim() || user.displayName,
    photoURL: data.photoURL?.trim() || user.photoURL,
  });
  await reload(user);
  return firebaseAuth.currentUser;
}

export async function firebaseUpdateUserPassword(password: string) {
  const user = firebaseAuth.currentUser;
  if (!user) throw new Error("Sign in first");
  await updatePassword(user, password);
}

export async function firebaseSignOut() {
  return signOut(firebaseAuth);
}
