import { useState } from "react";
import { Play, X } from "lucide-react";

export function SonexaAdVideo() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      {/* Thumbnail Card */}
      <div
        onClick={() => setShowModal(true)}
        className="relative group cursor-pointer rounded-2xl overflow-hidden border border-border shadow-lg hover:shadow-xl transition-all duration-300"
        style={{ aspectRatio: "16/9" }}
      >
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-600 via-white/80 to-green-600" />
        <div className="absolute inset-0 bg-black/40" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full gap-3 p-6">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ring-2 ring-white/30">
            <Play className="h-7 w-7 text-white ml-1" />
          </div>
          <div className="text-center">
            <h3 className="text-white text-lg font-bold tracking-tight">
              Sonexa celebrates India's Independence
            </h3>
            <p className="text-white/70 text-sm mt-1">Click to watch</p>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-3xl animate-fade-up">
            <button
              onClick={() => setShowModal(false)}
              className="absolute -top-10 right-0 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black" style={{ aspectRatio: "16/9" }}>
              <iframe
                src="https://www.youtube.com/embed/vp1HVg_J1Xg?autoplay=1&rel=0"
                title="Sonexa Independence Day"
                allow="autoplay; encrypted-media"
                allowFullScreen
                className="w-full h-full"
                style={{ aspectRatio: "16/9" }}
              />
            </div>

            <p className="text-center text-white/50 text-xs mt-3 tracking-widest uppercase font-semibold">
              Powered by Sonexa — Listen Beyond Limits
            </p>
          </div>
        </div>
      )}
    </>
  );
}