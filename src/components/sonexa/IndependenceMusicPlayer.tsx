import { useState } from "react";
import { Play, Pause, Shuffle, Music, Radio, Mic } from "lucide-react";
import { usePlayer, type Track } from "@/lib/player-store";

interface Song extends Track {
  durationStr: string;
  category: "anthem" | "patriotic" | "classical" | "cinematic";
  lyrics?: string;
}

const independenceSongs: Song[] = [
  {
    id: "ind-1",
    title: "Jana Gana Mana",
    artist: "Rabindranath Tagore",
    durationStr: "0:52",
    cover: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&h=300&fit=crop",
    audio: "",
    kind: "youtube",
    ytId: "vp1HVg_J1Xg",
    category: "anthem",
    lyrics: "Jana-gana-mana-adhinayaka jaya he\nBharata-bhagya-vidhata\nPunjab-Sindhu-Gujarata-Maratha\nDravida-Utkala-Banga"
  },
  {
    id: "ind-2",
    title: "Vande Mataram",
    artist: "Lata Mangeshkar",
    durationStr: "4:15",
    cover: "https://images.unsplash.com/photo-1514525253440-b393452e8d26?w=300&h=300&fit=crop",
    audio: "",
    kind: "youtube",
    ytId: "5bex-7q_uP8",
    category: "patriotic",
    lyrics: "Vande Mataram, Vande Mataram\nSujalam, Sufalam, Malayajasitalam\nShubhrajyothi Pulakita Yaminim\nBhulbhulaya preethi janani"
  },
  {
    id: "ind-3",
    title: "Maa Tujhe Salaam",
    artist: "A.R. Rahman",
    durationStr: "5:20",
    cover: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&h=300&fit=crop",
    audio: "",
    kind: "youtube",
    ytId: "jDn2bn7_YSM",
    category: "patriotic",
    lyrics: "Maa tujhe salaam\nMaa tujhe salaam\nMaa tujhe salaam\nMaa tujhe salaam\nTeri aarzoo jahan le gaye\nMere bharat mahan"
  },
  {
    id: "ind-4",
    title: "Aye Mere Watan Ke Logo",
    artist: "Lata Mangeshkar",
    durationStr: "6:10",
    cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
    audio: "",
    kind: "youtube",
    ytId: "6X2I3M_m0TA",
    category: "patriotic",
    lyrics: "Aye mere watan ke logo\nTum khara ho aansu bahana\nAe khuda ki basti mein\nTeri khuda ki basti mein"
  },
  {
    id: "ind-5",
    title: "Sare Jahan Se Achha",
    artist: "Muhammad Iqbal",
    durationStr: "3:45",
    cover: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&h=300&fit=crop",
    audio: "",
    kind: "youtube",
    ytId: "Ee5fG4C6aMw",
    category: "patriotic",
    lyrics: "Sare jahan se achha\nHindustan hamara\nHam bulbulein hai is li\nHam watan ko yaad karte hain"
  },
  {
    id: "ind-6",
    title: "Bharat Humko Jaan Se",
    artist: "Hariharan",
    durationStr: "5:30",
    cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop",
    audio: "",
    kind: "youtube",
    ytId: "7R2fVhC9B6g",
    category: "cinematic",
    lyrics: "Bharat humko jaan se pyaara\nWatan humko jaan se pyaara\nSabse pyaara taron ki nagar\nPyara hum watan ko"
  },
  {
    id: "ind-7",
    title: "Yeh Jo Desh Hai Tera",
    artist: "A.R. Rahman",
    durationStr: "4:55",
    cover: "https://images.unsplash.com/photo-1501612780327-45045538702b?w=300&h=300&fit=crop",
    audio: "",
    kind: "youtube",
    ytId: "4H8IjZ3eX5Y",
    category: "cinematic",
    lyrics: "Yeh jo desh hai tera\nSwadesh hai tera\nTujhpe saathiye banke\nChalo chalein swadesh"
  },
  {
    id: "ind-8",
    title: "Kadam Kadam Badhaye Ja",
    artist: "Mohan Singh",
    durationStr: "3:35",
    cover: "https://images.unsplash.com/photo-1485579149621-3123dd979885?w=300&h=300&fit=crop",
    audio: "",
    kind: "youtube",
    ytId: "9G3E6f5Z1kU",
    category: "patriotic",
    lyrics: "Kadam kadam badhaye ja\nVijay ki ho na haar\nBharat ke jawan\nSwatantra ki kashar"
  }
];

export function IndependenceMusicPlayer() {
  const { current, isPlaying, play, toggle } = usePlayer();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showLyrics, setShowLyrics] = useState(false);

  const filteredSongs = selectedCategory === "all" 
    ? independenceSongs 
    : independenceSongs.filter(song => song.category === selectedCategory);

  const categories = [
    { id: "all", label: "All Songs" },
    { id: "anthem", label: "National Anthem" },
    { id: "patriotic", label: "Patriotic" },
    { id: "classical", label: "Classical" },
    { id: "cinematic", label: "Cinematic" }
  ];

  const playSong = (song: Song) => {
    play(song, independenceSongs);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Music className="h-6 w-6 text-primary animate-pulse" />
            Independence Music Playlist
          </h3>
          <p className="text-muted-foreground mt-1">Play patriotic songs and the national anthem</p>
        </div>
        <button 
          onClick={() => setShowLyrics(!showLyrics)}
          className="p-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
          title="Show Lyrics"
        >
          <Mic className="h-5 w-5" />
        </button>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wider uppercase transition-all ${
              selectedCategory === category.id
                ? "bg-primary text-background"
                : "bg-card/40 text-muted-foreground hover:bg-card hover:text-foreground"
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Grid of Songs */}
      <div className="grid gap-3 sm:grid-cols-2">
        {filteredSongs.map((song) => {
          const isActive = current?.id === song.id;
          return (
            <div
              key={song.id}
              onClick={() => (isActive ? toggle() : playSong(song))}
              className={`flex items-center gap-4 p-3 rounded-2xl border transition cursor-pointer select-none ${
                isActive
                  ? "border-primary bg-primary/10 shadow-glow"
                  : "border-border bg-card/45 hover:bg-card"
              }`}
            >
              <img
                src={song.cover}
                alt={song.title}
                className="w-14 h-14 rounded-xl object-cover"
              />
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate text-foreground text-sm">{song.title}</div>
                <div className="text-xs text-muted-foreground truncate mt-0.5">{song.artist}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{song.durationStr}</span>
                <button
                  className={`p-2.5 rounded-full ${
                    isActive ? "bg-primary text-background" : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {isActive && isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4 fill-current ml-0.5" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lyrics Panel */}
      {showLyrics && current && (
        <div className="p-6 rounded-2xl border border-border bg-card/40 backdrop-blur animate-fade-up">
          <h4 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <Mic className="h-5 w-5 text-primary" />
            Lyrics - {current.title}
          </h4>
          <div className="whitespace-pre-line text-sm text-muted-foreground">
            {independenceSongs.find(s => s.id === current.id)?.lyrics || "Lyrics not available"}
          </div>
        </div>
      )}
    </div>
  );
}