import { useEffect, useState } from "react";
import { Flag, Sparkles, Music, Star } from "lucide-react";

export function PatrioticScrollEffects() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [visibleElements, setVisibleElements] = useState<Set<number>>(new Set());

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollTop / docHeight;
      setScrollProgress(progress);

      // Reveal elements on scroll
      const elements = document.querySelectorAll('.patriotic-reveal');
      elements.forEach((el, index) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.85) {
          setVisibleElements(prev => new Set([...prev, index]));
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Top scroll progress bar with tricolor */}
      <div className="fixed top-0 left-0 right-0 h-1 z-50">
        <div 
          className="h-full bg-tricolor-gradient animate-tricolor-sweep transition-all duration-150"
          style={{ width: `${scrollProgress * 100}%` }}
        />
      </div>

      {/* Floating patriotic elements */}
      <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
        {/* Ashoka Chakra decorations */}
        {[...Array(3)].map((_, i) => (
          <div
            key={`chakra-${i}`}
            className="absolute w-24 h-24 opacity-10 animate-ashoka-chakra"
            style={{
              top: `${20 + i * 30}%`,
              right: `${10 + i * 15}%`,
              animationDelay: `${i * 2}s`
            }}
          >
            <div className="relative w-full h-full">
              <div className="absolute inset-0 border-4 border-blue-900 rounded-full" />
              {[...Array(24)].map((_, j) => (
                <div
                  key={j}
                  className="absolute top-1/2 left-1/2 w-0.5 h-3 bg-blue-900 origin-bottom"
                  style={{ 
                    transform: `rotate(${j * 15}deg) translateY(-50%) translateX(-50%)`
                  }}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Floating tricolor particles */}
        {[...Array(15)].map((_, i) => (
          <div
            key={`particle-${i}`}
            className="absolute w-3 h-3 rounded-full animate-independence-float opacity-30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: ['#FF9933', '#FFFFFF', '#138808'][i % 3],
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${4 + Math.random() * 3}s`
            }}
          />
        ))}

        {/* Corner decorations */}
        <div className="absolute top-20 left-4 opacity-20">
          <div className="w-16 h-16 border-l-4 border-t-4 border-orange-500 rounded-tl-2xl animate-flag-wave" />
        </div>
        <div className="absolute top-20 right-4 opacity-20">
          <div className="w-16 h-16 border-r-4 border-t-4 border-green-500 rounded-tr-2xl animate-flag-wave" style={{ animationDelay: '0.5s' }} />
        </div>
        <div className="absolute bottom-20 left-4 opacity-20">
          <div className="w-16 h-16 border-l-4 border-b-4 border-green-500 rounded-bl-2xl animate-flag-wave" style={{ animationDelay: '1s' }} />
        </div>
        <div className="absolute bottom-20 right-4 opacity-20">
          <div className="w-16 h-16 border-r-4 border-b-4 border-orange-500 rounded-br-2xl animate-flag-wave" style={{ animationDelay: '1.5s' }} />
        </div>
      </div>

      {/* Scroll indicator */}
      {scrollProgress < 0.1 && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40 animate-bounce">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <div className="w-6 h-10 rounded-full border-2 border-muted-foreground flex justify-center pt-2">
              <div className="w-1.5 h-3 bg-gradient-to-b from-orange-500 via-white to-green-500 rounded-full animate-pulse" />
            </div>
            <span className="text-xs">Scroll to explore</span>
          </div>
        </div>
      )}
    </>
  );
}

// Reveal component for scroll animations
export function PatrioticReveal({ children, index = 0, className = "" }: { children: React.ReactNode, index?: number, className?: string }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const element = document.currentScript?.previousElementSibling;
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div 
      className={`patriotic-reveal transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {children}
    </div>
  );
}