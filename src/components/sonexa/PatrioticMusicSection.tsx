import { useState } from "react";
import { Play, Heart, Plus, Clock, Flame, Music, Headphones, Star } from "lucide-react";

interface PatrioticSong {
  id: string;
  title: string;
  artist: string;
  duration: string;
  image: string;
  language: string;
  category: "classical" | "cinematic" | "folk" | "devotional";
}

const patrioticSongs: PatrioticSong[] = [
  {
    id: "1",
    title: "Vande Mataram",
    artist: "A.R. Rahman",
    duration: "4:32",
    image: "https://images.unsplash.com/photo-1514525253440-b393452e8d26?w=300&h=300&fit=crop",
    language: "Tamil",
    category: "classical"
  },
  {
    id: "2", 
    title: "Maa Tujhe Salaam",
    artist: "A.R. Rahman",
    duration: "5:18",
    image: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&h=300&fit=crop",
    language: "Tamil",
    category: "cinematic"
  },
  {
    id: "3",
    title: "Aye Mere Watan Ke Logo",
    artist: "Lata Mangeshkar",
    duration: "6:45",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
    language: "Tamil",
    category: "classical"
  },
  {
    id: "4",
    title: "Jana Gana Mana",
    artist: "Various Artists",
    duration: "3:52",
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop",
    language: "Tamil",
    category: "devotional"
  },
  {
    id: "5",
    title: "Sare Jahan Se Achha",
    artist: "Mohan Singh",
    duration: "4:15",
    image: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&h=300&fit=crop",
    language: "Tamil",
    category: "folk"
  },
  {
    id: "6",
    title: "Bharat Humko Jaan Se",
    artist: "Hariharan",
    duration: "5:30",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop",
    language: "Tamil",
    category: "cinematic"
  },
  {
    id: "7",
    title: "Yeh Jo Desh Hai Tera",
    artist: "A.R. Rahman",
    duration: "4:55",
    image: "https://images.unsplash.com/photo-1501612780327-45045538702b?w=300&h=300&fit=crop",
    language: "Tamil",
    category: "cinematic"
  },
  {
    id: "8",
    title: "Kadam Kadam Badhaye Ja",
    artist: "Mohan Singh",
    duration: "3:45",
    image: "https://images.unsplash.com/photo-1485579149621-3123dd979885?w=300&h=300&fit=crop",
    language: "Tamil",
    category: "folk"
  }
];

const categories = [
  { id: "all", label: "All Songs", icon: Music },
  { id: "classical", label: "Classical", icon: Headphones },
  { id: "cinematic", label: "Cinematic", icon: Star },
  { id: "folk", label: "Folk", icon: Flame },
  { id: "devotional", label: "Devotional", icon: Heart }
];

export function PatrioticMusicSection() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [hoveredSong, setHoveredSong] = useState<string | null>(null);

  const filteredSongs = selectedCategory === "all" 
    ? patrioticSongs 
    : patrioticSongs.filter(song => song.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Flame className="h-6 w-6 text-orange-400 animate-pulse" />
            Patriotic Tamil Collection
          </h3>
          <p className="text-muted-foreground mt-1">Timeless songs celebrating India's spirit</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-sm font-semibold">
            {patrioticSongs.length} Songs
          </div>
        </div>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`group flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
                selectedCategory === category.id
                  ? "bg-gradient-to-r from-orange-500 to-green-500 text-blue-900 font-semibold shadow-glow"
                  : "bg-card/40 backdrop-blur text-muted-foreground hover:bg-card hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {category.label}
            </button>
          );
        })}
      </div>

      {/* Songs grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredSongs.map((song, index) => (
          <div
            key={song.id}
            className="group relative p-4 rounded-2xl border border-border bg-card/40 backdrop-blur hover:bg-card transition-all duration-300 hover:scale-105 hover:shadow-glow"
            style={{ animationDelay: `${index * 100}ms` }}
            onMouseEnter={() => setHoveredSong(song.id)}
            onMouseLeave={() => setHoveredSong(null)}
          >
            {/* Album art with tricolor border */}
            <div className="relative aspect-square rounded-xl overflow-hidden mb-3">
              <img
                src={song.image}
                alt={song.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              
              {/* Tricolor gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-orange-500/20 via-transparent to-green-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Play button overlay */}
              <div className={`absolute inset-0 flex items-center justify-center bg-black/60 transition-opacity duration-300 ${hoveredSong === song.id ? 'opacity-100' : 'opacity-0'}`}>
                <button className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-green-500 flex items-center justify-center transform transition-transform duration-300 hover:scale-110 shadow-glow">
                  <Play className="h-5 w-5 text-blue-900 ml-1" />
                </button>
              </div>

              {/* Language badge */}
              <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-blue-900/80 backdrop-blur text-xs text-white font-semibold">
                {song.language}
              </div>

              {/* Category badge */}
              <div className="absolute bottom-2 left-2 px-2 py-1 rounded-full bg-orange-500/80 backdrop-blur text-xs text-white font-semibold capitalize">
                {song.category}
              </div>
            </div>

            {/* Song info */}
            <div className="space-y-1">
              <h4 className="font-semibold text-foreground truncate group-hover:text-orange-400 transition-colors">
                {song.title}
              </h4>
              <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {song.duration}
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="hover:text-red-400 transition-colors">
                    <Heart className="h-4 w-4" />
                  </button>
                  <button className="hover:text-primary transition-colors">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Decorative tricolor corner */}
            <div className="absolute top-0 right-0 w-8 h-8">
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-orange-500 rounded-tr-lg" />
              <div className="absolute top-0 right-4 w-4 h-4 border-t-2 border-white" />
              <div className="absolute top-4 right-0 w-4 h-4 border-r-2 border-green-500" />
            </div>
          </div>
        ))}
      </div>

      {/* Load more button */}
      <div className="flex justify-center pt-4">
        <button className="group inline-flex items-center gap-2 px-8 py-3 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 font-semibold hover:bg-orange-500/20 transition-all duration-300">
          <Music className="h-4 w-4 group-hover:animate-pulse" />
          Load More Patriotic Songs
        </button>
      </div>
    </div>
  );
}