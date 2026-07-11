import type { Track } from "./player-store";

export type SmartPlaylist = {
  id: string;
  name: string;
  description: string;
  tracks: Track[];
  cover: string;
};

// Deterministic year extraction from metadata
export function getTrackYear(track: Track): number {
  const album = track.album?.toLowerCase() ?? "";
  const title = track.title.toLowerCase();

  // Known album year mapping
  if (album.includes("devara") || album.includes("vettaiyan") || album.includes("coolie")) return 2024;
  if (album.includes("varisu") || album.includes("jailer") || album.includes("leo") || album.includes("kingdom") || album.includes("pathu thala")) return 2023;
  if (album.includes("beast") || album.includes("vikram") || album.includes("kaathuvaakula") || album.includes("thiruchitrambalam")) return 2022;
  if (album.includes("doctor") || album.includes("master")) return 2021;
  if (album.includes("petta")) return 2019;
  if (album.includes("kanaa")) return 2018;
  if (album.includes("mersal")) return 2017;
  if (album.includes("remo") || album.includes("achcham")) return 2016;
  if (album.includes("naanum rowdy") || album.includes("maari") || album.includes("thangamagan") || album.includes("o kadhal kanmani")) return 2015;
  if (album.includes("david") || album.includes("vanakkam chennai") || album.includes("maryan") || album.includes("kadal")) return 2013;
  if (album.includes("3 (original")) return 2012;
  if (album.includes("vinnathaandi")) return 2010;
  if (album.includes("sakkarakatti") || album.includes("guru") || album.includes("sivaji")) return 2007;
  if (album.includes("lagaan")) return 2001;
  if (album.includes("alaipayuthey")) return 2000;
  if (album.includes("dil se") || album.includes("jeans")) return 1998;
  if (album.includes("rangeela") || album.includes("bombay") || album.includes("baasha") || album.includes("muthu")) return 1995;
  if (album.includes("roja") || album.includes("annamalai")) return 1992;
  if (album.includes("thalapathi")) return 1991;

  // Search for any 4-digit number in the album name
  const yearMatch = album.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) return parseInt(yearMatch[0], 10);

  // Deterministic fallback based on track ID
  const idNum = parseInt(track.id.replace(/\D/g, ""), 10) || 0;
  return 1990 + (idNum % 36); // years 1990 to 2025
}

// Deterministic genre classification
export function getTrackGenre(track: Track): "Romantic" | "Dance / Kuthu" | "AR Rahman Special" | "Anirudh Special" | "Melody Gold" | "Retro Hits" {
  const artist = track.artist.toLowerCase();
  const title = track.title.toLowerCase();
  const year = getTrackYear(track);

  if (artist.includes("anirudh")) return "Anirudh Special";
  if (artist.includes("rahman")) return "AR Rahman Special";

  if (
    title.includes("kadhal") ||
    title.includes("anbe") ||
    title.includes("neethane") ||
    title.includes("love") ||
    title.includes("romance") ||
    title.includes("kanave") ||
    title.includes("yennai") ||
    title.includes("neeyum") ||
    title.includes("po nee po") ||
    title.includes("oh penne") ||
    title.includes("megham") ||
    title.includes("usure") ||
    title.includes("moongil") ||
    title.includes("nenjukkule") ||
    title.includes("thalli") ||
    title.includes("mannipaaya") ||
    title.includes("munbe")
  ) {
    return "Romantic";
  }

  if (
    title.includes("kuthu") ||
    title.includes("ponnu") ||
    title.includes("hukum") ||
    title.includes("aaluma") ||
    title.includes("vaathi") ||
    title.includes("marana") ||
    title.includes("dippam") ||
    title.includes("kolaveri") ||
    title.includes("ready") ||
    title.includes("kaavaalaa") ||
    title.includes("badass") ||
    title.includes("wasted") ||
    title.includes("powerhouse") ||
    title.includes("pathala") ||
    title.includes("lokiverse") ||
    title.includes("beast mode") ||
    title.includes("jolly") ||
    title.includes("manasilaayo")
  ) {
    return "Dance / Kuthu";
  }

  if (year < 2010) {
    return "Retro Hits";
  }

  return "Melody Gold";
}

// Deterministic play count generation for "Hits"
export function getTrackPlays(track: Track): number {
  const idNum = parseInt(track.id.replace(/\D/g, ""), 10) || 0;
  return Math.round((5.2 + (idNum % 20) * 0.75) * 10) / 10; // 5.2M to 19.45M plays
}

// Generates smart playlists dynamically from catalog tracks
export function generateSmartPlaylists(allTracks: Track[]): SmartPlaylist[] {
  const playlists: SmartPlaylist[] = [];

  // 1. Decades / Year Playlists
  const year2020s = allTracks.filter((t) => getTrackYear(t) >= 2020);
  const year2010s = allTracks.filter((t) => {
    const y = getTrackYear(t);
    return y >= 2010 && y < 2020;
  });
  const retroHits = allTracks.filter((t) => getTrackYear(t) < 2010);

  if (year2020s.length > 0) {
    playlists.push({
      id: "smart_year_2020s",
      name: "Hits of the 2020s",
      description: "Trending Tamil and Indian releases from the current decade.",
      tracks: year2020s.slice(0, 20),
      cover: year2020s[0].cover,
    });
  }
  if (year2010s.length > 0) {
    playlists.push({
      id: "smart_year_2010s",
      name: "2010s Nostalgia",
      description: "Memories and milestones from the 2010s generation.",
      tracks: year2010s.slice(0, 20),
      cover: year2010s[0].cover,
    });
  }
  if (retroHits.length > 0) {
    playlists.push({
      id: "smart_year_retro",
      name: "Golden Retro Gold",
      description: "Timeless retro gold classics and vintage melodies.",
      tracks: retroHits.slice(0, 20),
      cover: retroHits[0].cover,
    });
  }

  // 2. Hits Playlists (Top Played)
  const sortedByHits = [...allTracks].sort((a, b) => getTrackPlays(b) - getTrackPlays(a));
  if (sortedByHits.length > 0) {
    playlists.push({
      id: "smart_hits_top",
      name: "Sonexa Top 50 Hits",
      description: "The most popular and played tracks on Sonexa, refreshed hourly.",
      tracks: sortedByHits.slice(0, 30),
      cover: sortedByHits[0].cover,
    });
  }

  // 3. Genre Playlists
  const genres = ["Romantic", "Dance / Kuthu", "Anirudh Special", "AR Rahman Special"] as const;
  genres.forEach((g) => {
    const genreTracks = allTracks.filter((t) => {
      const tg = getTrackGenre(t);
      if (g === "Anirudh Special") return tg === "Anirudh Special";
      if (g === "AR Rahman Special") return tg === "AR Rahman Special";
      if (g === "Romantic") return tg === "Romantic" || tg === "Melody Gold";
      if (g === "Dance / Kuthu") return tg === "Dance / Kuthu";
      return false;
    });

    if (genreTracks.length > 0) {
      const descriptions: Record<string, string> = {
        Romantic: "Melodic love ballads, soulful romantic tracks, and soft acoustic tunes.",
        "Dance / Kuthu": "High-octane dance beats, high-energy tracks, and absolute mass kuthu anthems.",
        "Anirudh Special": "High-energy beats, rock fusion, and massive chartbusters composed by Anirudh.",
        "AR Rahman Special": "Oscar-winning tracks and timeless masterworks composed by A.R. Rahman.",
      };

      playlists.push({
        id: `smart_genre_${g.toLowerCase().replace(/\s+/g, "_").replace(/\//g, "")}`,
        name: `${g} Hits`,
        description: descriptions[g] ?? `Curated selection of the best ${g} tracks.`,
        tracks: genreTracks.slice(0, 25),
        cover: genreTracks[0].cover,
      });
    }
  });

  return playlists;
}
