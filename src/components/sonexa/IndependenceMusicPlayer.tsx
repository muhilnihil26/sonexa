import { useState, useEffect } from "react";
import { Play, Pause, SkipBack, SkipForward, Heart, Shuffle, Repeat, Volume2, List, Radio, Music } from "lucide-react";

interface Song {
  id: string;
  title: string;
  artist: string;
  duration: string;
  cover: string;
  category: "anthem" | "patriotic" | "classical" | "cinematic";
}

const independenceSongs: Song[] = [
  {
    id: "1",
    title: "Jana Gana Mana",
    artist: "Rabindranath Tagore",
    duration: "2:30",
    cover: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&h=300&fit=crop",
    category: "anthem"
  },
  {
    id: "2",
    title: "Vande Mataram",
    artist: "Bankim Chandra Chattopadhyay",
    duration: "4:15",
    cover: "https://images.unsplash.com/photo-1514525253440-b393452e8d26?w=300&h=300&fit=crop",
    category: "patriotic"
  },
  {
    id: "3",
    title: "Maa Tujhe Salaam",
    artist: "A.R. Rahman",
    duration: "5:20",
    cover: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&h=300&fit=crop",
    category: "patriotic"
  },
  {
    id: "4",
    title: "Aye Mere Watan Ke Logo",
    artist: "Lata Mangeshkar",
    duration: "6:10",
    cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
    category: "patriotic"
  },
  {
    id: "5",
    title: "Sare Jahan Se Achha",
    artist: "Muhammad Iqbal",
    duration: "3:45",
    cover: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&h=300&fit=crop",
    category: "patriotic"
  },
  {
    id: "6",
    title: "Bharat Humko Jaan Se",
    artist: "Hariharan",
    duration: "5:30",
    cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop",
    category: "cinematic"
  },
  {
    id: "7",
    title: "Yeh Jo Desh Hai Tera",
    artist: "A.R. Rahman",
    duration: "4:55",
    cover: "https://images.unsplash.com/photo-1501612780327-45045538702b?w=300&h=300&fit=crop",
    category: "cinematic"
  },
  {
    id: "8",
    title: "Kadam Kadam Badhaye Ja",
    artist: "Mohan Singh",
    duration: "3:35",
    cover: "https://images.unsplash.com/photo-1485579149621-3123dd979885?w=300&h=300&fit=crop",
    category: "patriotic"
  }
];

export function IndependenceMusicPlayer() {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [volume, setVolume] = useState(75);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && currentSong) {
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            if (isRepeat) {
              return 0;
            }
            // Auto play next song
            const currentIndex = independenceSongs.findIndex(s => s.id === currentSong.id);
            const nextIndex = isShuffle 
              ? Math.floor(Math.random() * independenceSongs.length)
              : (currentIndex + 1) % independenceSongs.length;
            setCurrentSong(independenceSongs[nextIndex]);
            return 0;
          }
          return prev + 0.5;
        });
        
        // Update current time display
        const [mins, secs] = currentSong.duration.split(':').map(Number);
        const totalSeconds = mins * 60 + secs;
        const currentSeconds = Math.floor((progress / 100) * totalSeconds);
        const currentMins = Math.floor(currentSeconds / 60);
        const currentSecs = currentSeconds % 60;
        setCurrentTime(`${currentMins}:${currentSecs.toString().padStart(2, '0')}`);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentSong, progress, isRepeat, isShuffle]);

  const playSong = (song: Song) => {
    setCurrentSong(song);
    setIsPlaying(true);
    setProgress(0);
  };

  const togglePlay = () => {
    if (currentSong) {
      setIsPlaying(!isPlaying);
    }
  };

  const playNext = () => {
    if (currentSong) {
      const currentIndex = independenceSongs.findIndex(s => s.id === currentSong.id);
      const nextIndex = isShuffle 
        ? Math.floor(Math.random() * independenceSongs.length)
        : (currentIndex + 1) % independenceSongs.length;
      setCurrentSong(independenceSongs[nextIndex]);
      setProgress(0);
    }
  };

  const playPrevious = () => {
    if (currentSong) {
      const currentIndex = independenceSongs.findIndex(s => s.id === currentSong.id);
      const prevIndex = isShuffle 
        ? Math.floor(Math.random() * independenceSongs.length)
        : (currentIndex - 1 + independenceSongs.length) % independenceSongs.length;
      setCurrentSong(independenceSongs[prevIndex]);
      setProgress(0);
    }
  };

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Music className="h-6 w-6 text-primary" />
            Independence Music Player
          </h3>
          <p className="text-muted-foreground mt-1">Listen to patriotic songs and national anthem</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors">
            <Radio className="h-5 w-5" />
          </button>
          <button className="p-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors">
            <List className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-full transition-all ${
              selectedCategory === category.id
                ? "bg-primary text-background font-semibold"
                : "bg-card/40 text-muted-foreground hover:bg-card hover:text-foreground"
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Current Player */}
      {currentSong && (
        <div className="p-6 rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-background to-primary/10 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Album Art */}
            <div className="relative w-full md:w-48 aspect-square rounded-2xl overflow-hidden">
              <img
                src={currentSong.cover}
                alt={currentSong.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-orange-500 text-white text-xs font-bold capitalize">
                {currentSong.category}
              </div>
            </div>

            {/* Player Controls */}
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <h4 className="text-xl font-bold mb-2">{currentSong.title}</h4>
                <p className="text-muted-foreground text-sm mb-4">{currentSong.artist}</p>
                
                {/* Progress Bar */}
                <div className="space-y-4">
                  <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-500 to-green-500 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{currentTime}</span>
                    <span>{currentSong.duration}</span>
                  </div>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setIsShuffle(!isShuffle)}
                  className={`p-2 rounded-full transition-colors ${isShuffle ? 'bg-primary text-background' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Shuffle className="h-5 w-5" />
                </button>
                <button onClick={playPrevious} className="p-3 rounded-full bg-card/60 hover:bg-card transition-colors">
                  <SkipBack className="h-6 w-6" />
                </button>
                <button 
                  onClick={togglePlay}
                  className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 to-green-500 flex items-center justify-center hover:scale-105 transition-transform shadow-glow"
                >
                  {isPlaying ? <Pause className="h-8 w-8 text-blue-900" /> : <Play className="h-8 w-8 text-blue-900 ml-1" />}
                </button>
                <button onClick={playNext} className="p-3 rounded-full bg-card/60 hover:bg-card transition-colors">
                  <SkipForward className="h-6 w-6" />
                </button>
                <button
                  onClick={() => setIsRepeat(!isRepeat)}
                  className={`p-2 rounded-full transition-colors ${isRepeat ? 'bg-primary text-background' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Repeat className="h-5 w-5" />
                </button>
              </div>

              {/* Additional Controls */}
              <div className="flex items-center justify-between">
                <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                  <Heart className="h-4 w-4" />
                  <span className="text-sm">Add to Favorites</span>
                </button>
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                  <div className="w-24 h-1 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all"
                      style={{ width: `${volume}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Song List */}
      <div className="space-y-2">
        {filteredSongs.map((song, index) => (
          <div
            key={song.id}
            onClick={() => playSong(song)}
            className={`flex items-center gap-4 p-4 rounded-xl transition-all cursor-pointer ${
              currentSong?.id === song.id 
                ? 'bg-primary/20 border border-primary/50' 
                : 'bg-card/40 hover:bg-card border border-transparent'
            }`}
          >
            <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={song.cover}
                alt={song.title}
                className="w-full h-full object-cover"
              />
              {currentSong?.id === song.id && isPlaying && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="flex gap-1">
                    <div className="w-1 h-4 bg-primary animate-pulse" />
                    <div className="w-1 h-4 bg-primary animate-pulse" style={{ animationDelay: '0.2s' }} />
                    <div className="w-1 h-4 bg-primary animate-pulse" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h5 className="font-semibold text-foreground truncate">{song.title}</h5>
              <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
            </div>
            
            <div className="text-sm text-muted-foreground">{song.duration}</div>
            
            <button className="p-2 rounded-full hover:bg-card transition-colors">
              <Heart className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}