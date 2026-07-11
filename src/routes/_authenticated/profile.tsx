import { createFileRoute } from "@tanstack/react-router";
import { Camera, Check, KeyRound, LogOut, Mail, UserCircle, MonitorSmartphone, Globe2, Music2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { LANGUAGES } from "./onboarding";
import { useLanguagePrefs } from "@/lib/language-prefs";
import {
  firebaseSignOut,
  firebaseUpdateUserPassword,
  firebaseUpdateUserProfile,
} from "@/integrations/firebase/client";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { useLocalLibrary } from "@/lib/local-library";
import { type TileSize, useProfilePrefs } from "@/lib/profile-prefs";
import { useServerFn } from "@tanstack/react-start";
import {
  adminBackupLocalLibrary as backupLocalLibrary,
  createProfilePhotoUpload,
  getProfilePhotoUrl,
  restoreLocalLibrary,
} from "@/lib/api/social.functions";
import { CloudUpload, CloudDownload } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile - Sonexa" }] }),
  component: ProfilePage,
});

const tileOptions: Array<{ id: TileSize; label: string; detail: string }> = [
  { id: "compact", label: "Compact", detail: "More songs per row" },
  { id: "normal", label: "Normal", detail: "Balanced grid" },
  { id: "large", label: "Large", detail: "Bigger covers" },
];

function ProfilePage() {
  const { user } = useSession();
  const { likes, playlists } = useLocalLibrary();
  const { tileSize, setTileSize } = useProfilePrefs();
  const { languages, save: saveLanguages } = useLanguagePrefs(user?.id);
  const [name, setName] = useState(user?.displayName ?? "");

  const [disableBackgroundPlay, setDisableBackgroundPlayState] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sonexa.disableBackgroundPlay") === "true";
    }
    return false;
  });
  const [dontShowDiscovery, setDontShowDiscoveryState] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sonexa.tvRemote.dontShowDiscoveryAgain") === "true";
    }
    return false;
  });

  const setDisableBackgroundPlay = (val: boolean) => {
    setDisableBackgroundPlayState(val);
    if (typeof window !== "undefined") {
      localStorage.setItem("sonexa.disableBackgroundPlay", val ? "true" : "false");
      window.dispatchEvent(new Event("storage"));
    }
  };

  const setDontShowDiscovery = (val: boolean) => {
    setDontShowDiscoveryState(val);
    if (typeof window !== "undefined") {
      localStorage.setItem("sonexa.tvRemote.dontShowDiscoveryAgain", val ? "true" : "false");
    }
  };

  const toggleLanguage = (code: string) => {
    const updated = languages.includes(code)
      ? languages.filter((x) => x !== code)
      : [...languages, code];
    if (updated.length === 0) {
      toast.error("Choose at least one language");
      return;
    }
    saveLanguages(updated);
    toast.success("Languages updated");
  };
  const [photoURL, setPhotoURL] = useState(user?.photoURL ?? "");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const backupFn = useServerFn(backupLocalLibrary);
  const restoreFn = useServerFn(restoreLocalLibrary);
  const createPhotoUpload = useServerFn(createProfilePhotoUpload);
  const getPhotoUrl = useServerFn(getProfilePhotoUrl);
  const initials = useMemo(() => {
    const source = name || user?.email || "S";
    return source
      .split(/[ @._-]/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }, [name, user?.email]);

  useEffect(() => {
    setName(user?.displayName ?? "");
    setPhotoURL(user?.photoURL ?? "");
  }, [user?.displayName, user?.photoURL]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await firebaseUpdateUserProfile({ displayName: name, photoURL });
      toast.success("Profile updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update profile");
    } finally {
      setSaving(false);
    }
  }

  async function uploadProfilePhoto(file: File | null | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Choose an image file");
    setPhotoUploading(true);
    try {
      const upload = await createPhotoUpload({
        data: { fileName: file.name, contentType: file.type },
      });
      const { error } = await supabase.storage
        .from("covers")
        .uploadToSignedUrl(upload.path, upload.token, file);
      if (error) throw error;
      const signed = await getPhotoUrl({ data: { path: upload.path } });
      setPhotoURL(signed.url);
      await firebaseUpdateUserProfile({ displayName: name, photoURL: signed.url });
      toast.success("Profile photo updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not upload profile photo");
    } finally {
      setPhotoUploading(false);
    }
  }

  async function changePassword() {
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    setSaving(true);
    try {
      await firebaseUpdateUserPassword(password);
      setPassword("");
      toast.success("Password updated");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not update password. Sign in again and retry.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleBackup() {
    setSyncing(true);
    try {
      await backupFn({ data: { playlists, likes } });
      toast.success("Library backed up to cloud");
    } catch (e) {
      toast.error("Cloud backup failed");
    } finally {
      setSyncing(false);
    }
  }

  async function handleRestore() {
    if (!confirm("This will overwrite your current local playlists and likes. Proceed?")) return;
    setSyncing(true);
    try {
      const res = await restoreFn();
      if (!res.playlists) {
        toast.info("No cloud backup found");
        return;
      }
      localStorage.setItem("sonexa.playlists.v1", JSON.stringify(res.playlists));
      localStorage.setItem("sonexa.likes.v1", JSON.stringify(res.likes));
      toast.success("Library restored! Please refresh the page.", { duration: 5000 });
      setTimeout(() => window.location.reload(), 2000);
    } catch (e) {
      toast.error("Cloud restore failed");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="min-h-full animate-page-in p-4 sm:p-6 md:p-10">
      <section className="relative overflow-hidden rounded-3xl border border-border bg-card/45 p-6 sm:p-8">
        <div className="absolute inset-0 bg-glow opacity-60" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex items-center gap-5">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border border-border bg-background shadow-glow">
              {photoURL ? (
                <img src={photoURL} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center bg-brand-gradient text-3xl font-black text-background">
                  {initials}
                </div>
              )}
              <span className="absolute bottom-1 right-1 grid h-8 w-8 place-items-center rounded-full bg-background/90 text-primary">
                <Camera className="h-4 w-4" />
              </span>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-primary">Account</p>
              <h1 className="mt-2 text-4xl font-black tracking-tight">
                {name || user?.email?.split("@")[0] || "Sonexa listener"}
              </h1>
              <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" /> {user?.email}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <Stat label="Liked" value={Object.keys(likes).length} />
            <Stat label="Playlists" value={playlists.length} />
            <Stat label="Plan" value="Free" />
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_.9fr]">
        <form onSubmit={saveProfile} className="rounded-2xl border border-border bg-card/45 p-5">
          <div className="mb-4 flex items-center gap-2 font-semibold">
            <UserCircle className="h-5 w-5 text-primary" /> Edit profile
          </div>
          <label className="block text-sm">
            Display name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 w-full rounded-lg border border-border bg-input px-3 py-2"
              placeholder="Your name"
            />
          </label>
          <label className="mt-4 block text-sm">
            Upload profile photo
            <input
              type="file"
              accept="image/*"
              disabled={photoUploading}
              onChange={(event) => uploadProfilePhoto(event.target.files?.[0])}
              className="mt-2 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm"
            />
          </label>
          <label className="mt-4 block text-sm">
            Profile image URL
            <input
              value={photoURL}
              onChange={(event) => setPhotoURL(event.target.value)}
              className="mt-2 w-full rounded-lg border border-border bg-input px-3 py-2"
              placeholder="https://..."
            />
          </label>
          <button
            disabled={saving || photoUploading}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-background shadow-glow disabled:opacity-60"
          >
            <Check className="h-4 w-4" /> {photoUploading ? "Uploading..." : "Save profile"}
          </button>
        </form>

        <section className="rounded-2xl border border-border bg-card/45 p-5">
          <div className="mb-4 flex items-center gap-2 font-semibold">
            <KeyRound className="h-5 w-5 text-primary" /> Security
          </div>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            minLength={6}
            className="w-full rounded-lg border border-border bg-input px-3 py-2"
            placeholder="New password"
          />
          <button
            onClick={changePassword}
            disabled={saving || !password}
            className="mt-3 rounded-full border border-border bg-background/50 px-5 py-2.5 text-sm font-semibold hover:bg-background disabled:opacity-60"
          >
            Update password
          </button>
          <button
            onClick={async () => {
              await firebaseSignOut();
              window.location.href = "/";
            }}
            className="mt-5 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-border bg-card/45 p-5">
        <div className="mb-4 font-semibold">Music tile size</div>
        <div className="grid gap-3 sm:grid-cols-3">
          {tileOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setTileSize(option.id)}
              className={`rounded-xl border p-4 text-left transition ${
                tileSize === option.id
                  ? "border-primary bg-primary/15"
                  : "border-border bg-background/35 hover:bg-background/55"
              }`}
            >
              <div className="font-semibold">{option.label}</div>
              <div className="mt-1 text-xs text-muted-foreground">{option.detail}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card/45 p-5">
        <div className="mb-4 flex items-center gap-2 font-semibold">
          <MonitorSmartphone className="h-5 w-5 text-primary" /> Player & Device Settings
        </div>
        <div className="space-y-4">
          <label className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/35 px-4 py-3 text-sm cursor-pointer hover:bg-background/55 transition">
            <div>
              <div className="font-semibold text-foreground">Disable Background Playback</div>
              <div className="text-xs text-muted-foreground">Pause music automatically when the app is minimized or screen locks.</div>
            </div>
            <input
              type="checkbox"
              checked={disableBackgroundPlay}
              onChange={(e) => setDisableBackgroundPlay(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
          </label>

          <label className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/35 px-4 py-3 text-sm cursor-pointer hover:bg-background/55 transition">
            <div>
              <div className="font-semibold text-foreground">TV WiFi Remote Discovery</div>
              <div className="text-xs text-muted-foreground">Automatically prompt to connect when a paired TV is active on your network.</div>
            </div>
            <input
              type="checkbox"
              checked={!dontShowDiscovery}
              onChange={(e) => setDontShowDiscovery(!e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
          </label>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card/45 p-5">
        <div className="mb-4 flex items-center gap-2 font-semibold">
          <Globe2 className="h-5 w-5 text-primary" /> Music Languages
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Select the languages you want to show on your Home catalog.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {LANGUAGES.map((l) => {
            const active = languages.includes(l.code);
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => toggleLanguage(l.code)}
                className={`flex items-center gap-2.5 rounded-xl border p-3 text-sm font-semibold transition ${
                  active
                    ? "border-primary bg-primary/15 text-foreground shadow-glow"
                    : "border-border bg-background/35 hover:bg-background/55 text-muted-foreground"
                }`}
              >
                <Music2 className={`h-4 w-4 ${active ? "text-primary animate-pulse" : ""}`} />
                {l.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card/45 p-5">
        <div className="mb-4 flex items-center gap-2 font-semibold">
          <CloudUpload className="h-5 w-5 text-primary" /> Cloud Backup
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Save your local playlists and liked songs to the cloud so you can restore them on other
          devices.
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleBackup}
            disabled={syncing}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background/50 px-5 py-2.5 text-sm font-semibold hover:bg-background disabled:opacity-60"
          >
            <CloudUpload className="h-4 w-4" /> Backup to Cloud
          </button>
          <button
            onClick={handleRestore}
            disabled={syncing}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background/50 px-5 py-2.5 text-sm font-semibold hover:bg-background disabled:opacity-60"
          >
            <CloudDownload className="h-4 w-4" /> Restore from Cloud
          </button>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-border bg-background/45 px-5 py-3">
      <div className="text-xl font-black">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
