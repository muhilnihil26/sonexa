/**
 * Service Worker for Sonexa
 * Handles background audio playback and media controls
 */

self.addEventListener("install", (event) => {
  console.log("Service Worker installing...");
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker activating...");
  event.waitUntil(self.clients.claim());
});

// Handle messages from the main app
self.addEventListener("message", (event) => {
  const { type, data } = event.data;

  switch (type) {
    case "TRACK_PLAYING":
      // Update media session metadata
      if ("mediaSession" in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: data.title,
          artist: data.artist,
          album: data.album || "Sonexa",
          artwork: [
            {
              src: data.cover || "/logo-icon.png",
              sizes: "256x256",
              type: "image/png",
            },
          ],
        });

        // Set action handlers
        navigator.mediaSession.setActionHandler("play", () => {
          event.ports[0].postMessage({ type: "PLAY" });
        });

        navigator.mediaSession.setActionHandler("pause", () => {
          event.ports[0].postMessage({ type: "PAUSE" });
        });

        navigator.mediaSession.setActionHandler("nexttrack", () => {
          event.ports[0].postMessage({ type: "NEXT" });
        });

        navigator.mediaSession.setActionHandler("previoustrack", () => {
          event.ports[0].postMessage({ type: "PREV" });
        });
      }
      break;

    case "TRACK_STOPPED":
      if ("mediaSession" in navigator) {
        navigator.mediaSession.metadata = null;
      }
      break;
  }
});

// Fetch event - cache strategy for audio files
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Cache audio files
  if (event.request.method === "GET" && url.pathname.includes("/audio")) {
    event.respondWith(
      caches
        .open("sonexa-audio-v1")
        .then((cache) => {
          return cache.match(event.request).then((response) => {
            if (response) return response;

            return fetch(event.request).then((response) => {
              if (response.ok) {
                cache.put(event.request, response.clone());
              }
              return response;
            });
          });
        })
        .catch(() => {
          // Return offline response if needed
          return new Response("Audio offline", { status: 503 });
        })
    );
  }
});

console.log("Sonexa Service Worker loaded");
