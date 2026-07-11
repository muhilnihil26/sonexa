/**
 * Notification system for Sonexa
 * Handles browser notifications for music playback and app events
 */

import { toast } from "sonner";

export type NotificationType = "playback" | "download" | "error" | "success" | "info";

export interface NotificationOptions {
  title: string;
  body?: string;
  icon?: string;
  type?: NotificationType;
  duration?: number;
}

// Request notification permission
export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    console.log("This browser does not support desktop notification");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
}

// Show browser notification
export function showNotification(options: NotificationOptions) {
  const {
    title,
    body,
    icon = "/logo-icon.png",
    type = "info",
    duration = 4000,
  } = options;

  // Show in-app toast
  const toastOptions = {
    duration,
    icon: type === "error" ? "❌" : type === "success" ? "✅" : type === "playback" ? "🎵" : "ℹ️",
  };

  switch (type) {
    case "error":
      toast.error(title, toastOptions);
      break;
    case "success":
      toast.success(title, toastOptions);
      break;
    case "playback":
      toast(title, { ...toastOptions, description: body });
      break;
    default:
      toast.info(title, toastOptions);
  }

  // Show browser notification if permission granted
  if ("Notification" in window && Notification.permission === "granted") {
    try {
      new Notification(title, {
        body,
        icon,
        badge: icon,
        tag: "sonexa-notification",
      });
    } catch (error) {
      console.error("Failed to show notification:", error);
    }
  }
}

// Music playback notifications
export function notifyTrackChange(track: { title: string; artist: string; cover?: string }) {
  showNotification({
    type: "playback",
    title: `Now Playing: ${track.title}`,
    body: track.artist,
    icon: track.cover || "/logo-icon.png",
    duration: 3000,
  });
}

export function notifyPlaybackState(isPlaying: boolean) {
  showNotification({
    type: "playback",
    title: isPlaying ? "▶️ Playing" : "⏸️ Paused",
    duration: 2000,
  });
}

// Download notifications
export function notifyDownloadStart(filename: string) {
  showNotification({
    type: "info",
    title: "Download Started",
    body: `Downloading ${filename}...`,
    duration: 3000,
  });
}

export function notifyDownloadComplete(filename: string) {
  showNotification({
    type: "success",
    title: "Download Complete",
    body: `${filename} has been downloaded`,
    duration: 4000,
  });
}

export function notifyDownloadError(filename: string) {
  showNotification({
    type: "error",
    title: "Download Failed",
    body: `Could not download ${filename}`,
    duration: 5000,
  });
}

// Error notifications
export function notifyError(message: string) {
  showNotification({
    type: "error",
    title: "Error",
    body: message,
    duration: 5000,
  });
}

// Success notifications
export function notifySuccess(message: string) {
  showNotification({
    type: "success",
    title: "Success",
    body: message,
    duration: 4000,
  });
}

// Info notifications
export function notifyInfo(message: string) {
  showNotification({
    type: "info",
    title: "Info",
    body: message,
    duration: 3000,
  });
}

// Data saving mode notification
export function notifyDataSavingMode(enabled: boolean) {
  showNotification({
    type: "info",
    title: enabled ? "Data Saving Mode On" : "Data Saving Mode Off",
    body: enabled ? "Reducing bandwidth usage" : "Normal bandwidth usage",
    duration: 3000,
  });
}
