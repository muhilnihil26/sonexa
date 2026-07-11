// Curated trending YouTube videos sourced from official music channels
// (Sony Music South, T-Series, Think Music India, Saregama Tamil, YRF,
// Lahari Music, Wunderbar Films, etc). Audio-only embed via the hidden
// YouTubeHost iframe — no API key required.

export type YTVideo = {
  id: string;          // YouTube video id
  title: string;
  artist: string;
  language: string;
  channel?: string;
};

export const YT_TRENDING: YTVideo[] = [
  // ── Tamil — Sony Music South / Think Music / Wunderbar / Lahari ──
  { id: "Way2GholgkU", title: "Naa Ready", artist: "Anirudh · Leo", language: "tamil", channel: "Sony Music South" },
  { id: "Y_LK8jYVnz8", title: "Hukum — Thalaivar Alappara", artist: "Anirudh · Jailer", language: "tamil", channel: "Sun TV" },
  { id: "vY_W-VyVHbo", title: "Vaathi Coming", artist: "Anirudh · Master", language: "tamil", channel: "Sony Music South" },
  { id: "ietGFqHfA1c", title: "Arabic Kuthu — Halamithi Habibo", artist: "Anirudh · Beast", language: "tamil", channel: "Sun TV" },
  { id: "MhSESH9yT-s", title: "Rowdy Baby", artist: "Dhanush, Sai Pallavi · Maari 2", language: "tamil", channel: "Wunderbar Films" },
  { id: "Cw0d-nqSNE8", title: "Why This Kolaveri Di", artist: "Dhanush · 3", language: "tamil", channel: "Sony Music India" },
  { id: "TIqQYn0XAS8", title: "Chaleya (Tamil)", artist: "Anirudh, Arijit · Jawan", language: "tamil", channel: "T-Series" },
  { id: "psP4dB1ZFTk", title: "Munbe Vaa", artist: "A.R. Rahman · Sillunu Oru Kadhal", language: "tamil", channel: "Sony Music India" },
  { id: "B6_iyqzC79w", title: "Ponni Nadhi", artist: "A.R. Rahman · Ponniyin Selvan", language: "tamil", channel: "Madras Talkies" },
  { id: "X8nDXDtosTw", title: "Chaleya (Hindi)", artist: "Arijit, Shilpa · Jawan", language: "hindi", channel: "T-Series" },

  // ── Hindi — T-Series / YRF / Sony Music India ──
  { id: "VHpyZAzNBM4", title: "Heeriye", artist: "Arijit Singh · Jasleen Royal", language: "hindi", channel: "Sony Music India" },
  { id: "BddP6PYo2gs", title: "Apna Bana Le", artist: "Arijit Singh · Bhediya", language: "hindi", channel: "T-Series" },
  { id: "sK7riqg2mr4", title: "Tum Hi Ho", artist: "Arijit Singh · Aashiqui 2", language: "hindi", channel: "T-Series" },
  { id: "Umqb9KENgmk", title: "Kesariya", artist: "Arijit Singh · Brahmāstra", language: "hindi", channel: "Sony Music India" },

  // ── English — official channels ──
  { id: "TUVcZfQe-Kw", title: "As It Was", artist: "Harry Styles", language: "english", channel: "Harry Styles" },
  { id: "ic8j13piAhQ", title: "Cruel Summer", artist: "Taylor Swift", language: "english", channel: "Taylor Swift" },
  { id: "kTJczUoc26U", title: "Believer", artist: "Imagine Dragons", language: "english", channel: "Imagine Dragons" },
  { id: "JGwWNGJdvx8", title: "Shape of You", artist: "Ed Sheeran", language: "english", channel: "Ed Sheeran" },
];

export function ytThumb(id: string, quality: "hq" | "max" = "hq") {
  return quality === "max"
    ? `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`
    : `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}
