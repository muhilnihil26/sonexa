import { useState } from "react";
import { Award, Download, Share2, Calendar, User, Flag } from "lucide-react";

export function FlagHoistingCertificate() {
  const [userName, setUserName] = useState("");
  const [certificateGenerated, setCertificateGenerated] = useState(false);
  const [certificateDate] = useState(new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }));

  const generateCertificate = () => {
    if (userName.trim()) {
      setCertificateGenerated(true);
    }
  };

  const downloadCertificate = () => {
    // In a real app, this would generate a PDF
    alert("Certificate downloaded!");
  };

  const shareCertificate = () => {
    // In a real app, this would open share dialog
    alert("Certificate shared!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Award className="h-6 w-6 text-yellow-500" />
            Flag Hoisting Certificate
          </h3>
          <p className="text-muted-foreground mt-1">Receive your certificate for hoisting the flag</p>
        </div>
      </div>

      {!certificateGenerated ? (
        <div className="p-6 rounded-2xl border border-border bg-card/40 backdrop-blur">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 rounded-xl bg-background/60 border border-border text-foreground"
              />
            </div>
            <button
              onClick={generateCertificate}
              disabled={!userName.trim()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-green-500 text-white font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              Generate Certificate
            </button>
          </div>
        </div>
      ) : (
        <div className="relative">
          {/* Certificate */}
          <div className="p-8 rounded-2xl border-4 border-double border-orange-500 bg-gradient-to-br from-orange-50 via-white to-green-50 shadow-2xl">
            {/* Certificate Header */}
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 via-white to-green-500 flex items-center justify-center shadow-lg">
                  <Flag className="h-8 w-8 text-blue-900" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Certificate of Appreciation</h2>
              <p className="text-gray-600">For Hoisting the National Flag</p>
            </div>

            {/* Certificate Body */}
            <div className="space-y-4 mb-6">
              <div className="text-center">
                <p className="text-gray-600 mb-2">This is to certify that</p>
                <h3 className="text-2xl font-bold text-gray-800">{userName}</h3>
                <p className="text-gray-600 mt-2">has successfully hoisted the Indian National Flag</p>
                <p className="text-gray-600">on Independence Day 2026</p>
              </div>

              <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {certificateDate}
                </div>
              </div>
            </div>

            {/* Certificate Footer */}
            <div className="flex justify-between items-end">
              <div className="text-center">
                <div className="w-24 h-0.5 bg-gray-400 mb-2"></div>
                <p className="text-sm text-gray-600">Organizer</p>
              </div>
              <div className="text-center">
                <div className="w-24 h-0.5 bg-gray-400 mb-2"></div>
                <p className="text-sm text-gray-600">Digital Signature</p>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute top-4 left-4 text-4xl opacity-20">🇮🇳</div>
            <div className="absolute top-4 right-4 text-4xl opacity-20">🇮🇳</div>
            <div className="absolute bottom-4 left-4 text-4xl opacity-20">🎖️</div>
            <div className="absolute bottom-4 right-4 text-4xl opacity-20">🎖️</div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={downloadCertificate}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-900 text-white font-semibold hover:bg-blue-800 transition-colors"
            >
              <Download className="h-4 w-4" />
              Download
            </button>
            <button
              onClick={shareCertificate}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors"
            >
              <Share2 className="h-4 w-4" />
              Share
            </button>
            <button
              onClick={() => {
                setCertificateGenerated(false);
                setUserName("");
              }}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-600 text-white font-semibold hover:bg-gray-700 transition-colors"
            >
              Generate New
            </button>
          </div>
        </div>
      )}
    </div>
  );
}