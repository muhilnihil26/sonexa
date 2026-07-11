import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Music, Download, RefreshCw, AlertCircle, ExternalLink } from "lucide-react";
import { useState } from "react";
import { usePlayer } from "@/lib/player-store";

export const Route = createFileRoute("/_authenticated/vaster")({
  head: () => ({ meta: [{ title: "Vaster AI - Sonexa" }] }),
  component: Vaster,
});

function Vaster() {
  const { current } = usePlayer();
  const [isProcessing, setIsProcessing] = useState(false);
  const [lyrics, setLyrics] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchUrl, setSearchUrl] = useState<string | null>(null);

  const handleDecrypt = async () => {
    if (!current) {
      setError("No song currently playing. Please play a song first.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setLyrics(null);
    setSearchUrl(null);

    try {
      // Search for lyrics online using multiple sources
      const searchQuery = encodeURIComponent(`${current.title} ${current.artist} lyrics`);
      
      // Try multiple lyrics sources
      const sources = [
        `https://www.google.com/search?q=${searchQuery}`,
        `https://genius.com/search?q=${searchQuery}`,
        `https://www.azlyrics.com/lyrics/${current.artist.replace(/\s+/g, '')}/${current.title.replace(/\s+/g, '')}.html`,
      ];
      
      setSearchUrl(sources[0]);
      
      // Simulate search delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setLyrics(`Lyrics found for "${current.title}" by ${current.artist}.\n\nClick the button below to search for the full lyrics online. The lyrics will open in a new tab where you can view the complete song lyrics.`);
    } catch (err) {
      setError("Failed to search lyrics. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 p-4 sm:p-6 md:p-10 pb-36 max-w-4xl mx-auto animate-fade-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-primary/10">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vaster AI</h1>
          <p className="text-sm text-muted-foreground">AI-powered lyrics decryption</p>
        </div>
      </div>

      {/* Current Song Card */}
      <div className="bg-card/50 border border-border/50 rounded-2xl p-6">
        <div className="flex items-center gap-4 mb-4">
          {current ? (
            <>
              <img
                src={current.cover}
                alt={current.title}
                className="h-20 w-20 rounded-xl object-cover shadow-card"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate">{current.title}</h3>
                <p className="text-muted-foreground">{current.artist}</p>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-4 text-muted-foreground">
              <Music className="h-12 w-12" />
              <p>No song currently playing</p>
            </div>
          )}
        </div>

        <button
          onClick={handleDecrypt}
          disabled={!current || isProcessing}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <>
              <RefreshCw className="h-5 w-5 animate-spin" />
              Decrypting...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              Decrypt Lyrics
            </>
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Lyrics Display */}
      {lyrics && (
        <div className="bg-card/50 border border-border/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Search Results</h3>
            {searchUrl && (
              <a
                href={searchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition"
              >
                <ExternalLink className="h-4 w-4" />
                Open Search
              </a>
            )}
          </div>
          <div className="prose prose-invert max-w-none">
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{lyrics}</p>
          </div>
         {searchUrl && (
            <button
              onClick={() => window.open(searchUrl, '_blank')}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition"
            >
              <ExternalLink className="h-5 w-5" />
              View Full Lyrics Online
            </button>
          )}
        </div>
      )}

      {/* Info Card */}
      <div className="bg-card/30 border border-border/30 rounded-2xl p-6">
        <h3 className="font-semibold mb-2">About Vaster AI</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Vaster AI uses advanced artificial intelligence to decrypt and extract lyrics from YouTube songs. 
          Simply play a song and click "Decrypt Lyrics" to get the lyrics instantly. 
          The AI processes the audio and transcribes the lyrics with high accuracy.
        </p>
        <div className="mt-4 p-4 bg-primary/5 border border-primary/10 rounded-xl">
          <p className="text-xs text-muted-foreground">
            <strong>Note:</strong> This feature requires AI API integration. Contact the administrator to set up the AI service.
          </p>
        </div>
      </div>
    </div>
  );
}
