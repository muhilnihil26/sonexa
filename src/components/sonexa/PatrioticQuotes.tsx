import { useState, useEffect } from "react";
import { Quote, Star, Sparkles } from "lucide-react";

const patrioticQuotes = [
  {
    quote: "Freedom is not given, it is taken.",
    author: "Netaji Subhas Chandra Bose",
    tamil: "சுதந்திரம் கொடுக்கப்படுவதில்லை, எடுத்துக்கொள்ளப்படுகிறது."
  },
  {
    quote: "Swaraj is my birthright and I shall have it.",
    author: "Bal Gangadhar Tilak",
    tamil: "சுயராஜ்யம் எனது பிறப்புரிமை, அதை நான் பெற்றே தீர்க்கிறேன்."
  },
  {
    quote: "Inquilab Zindabad!",
    author: "Bhagat Singh",
    tamil: "இன்குலாப் ஜிந்தாபாத்!"
  },
  {
    quote: "Give me blood, and I will give you freedom!",
    author: "Subhas Chandra Bose",
    tamil: "எனக்கு இரத்தம் கொடுங்கள், நான் உங்களுக்கு சுதந்திரம் தருவேன்!"
  },
  {
    quote: "Sare Jahan Se Achha Hindustan Hamara",
    author: "Muhammad Iqbal",
    tamil: "எல்லா உலகிலும் சிறந்தது எங்கள் இந்தியா"
  }
];

export function PatrioticQuotes() {
  const [currentQuote, setCurrentQuote] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setCurrentQuote(prev => (prev + 1) % patrioticQuotes.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 via-white/5 to-green-500/10 backdrop-blur-xl p-6 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-white to-green-500 rounded-full blur-3xl animate-pulse" />
      </div>
      
      {/* Floating stars */}
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 text-yellow-400 animate-patriotic-sparkle"
          style={{
            left: `${10 + i * 12}%`,
            top: `${20 + (i % 3) * 20}%`,
            animationDelay: `${i * 0.3}s`
          }}
        >
          <Star className="h-full w-full fill-current" />
        </div>
      ))}

      <div className="relative">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 via-white to-green-500 flex items-center justify-center animate-pulse">
            <Quote className="h-6 w-6 text-blue-900" />
          </div>
          
          <div className="flex-1">
            <div className="relative">
              <p className="text-lg md:text-xl font-semibold text-foreground mb-3 leading-relaxed">
                "{patrioticQuotes[currentQuote].quote}"
              </p>
              
              {/* Tamil translation */}
              <p className="text-sm md:text-base text-muted-foreground mb-4 italic leading-relaxed">
                {patrioticQuotes[currentQuote].tamil}
              </p>
              
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-gradient-to-r from-orange-500/50 to-transparent" />
                <p className="text-sm font-semibold text-orange-400">
                  — {patrioticQuotes[currentQuote].author}
                </p>
                <div className="h-px flex-1 bg-gradient-to-l from-green-500/50 to-transparent" />
              </div>
            </div>
          </div>
        </div>

        {/* Quote navigation dots */}
        <div className="flex justify-center gap-2 mt-6">
          {patrioticQuotes.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuote(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                currentQuote === index
                  ? 'w-6 bg-gradient-to-r from-orange-500 to-green-500'
                  : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
            />
          ))}
        </div>

        {/* Sparkle decoration */}
        <div className="absolute -top-2 -right-2">
          <Sparkles className="h-5 w-5 text-yellow-400 animate-pulse" />
        </div>
      </div>
    </div>
  );
}