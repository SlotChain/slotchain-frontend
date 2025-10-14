import { useState, useEffect } from "react";
import { LogOut, Video, Users, Calendar } from "lucide-react";
import { formatAddress } from "../utils/mockWeb3";

interface MeetingProps {
  onLeave: () => void;
}

export default function Meeting({ onLeave }: MeetingProps) {
  const [walletAddress] = useState(
    "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
  );
  const [meetingDuration, setMeetingDuration] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setMeetingDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">SlotChain</span>
            </div>

            <div className="h-8 w-px bg-slate-600"></div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-slate-300">
                <Video className="w-5 h-5 text-green-400" />
                <span className="text-sm font-medium">Meeting in progress</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Users className="w-4 h-4" />
                <span className="text-sm">3 participants</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-slate-700 rounded-lg px-4 py-2 flex items-center gap-3">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-white font-mono text-sm">
                {formatAddress(walletAddress)}
              </span>
            </div>

            <div className="bg-slate-700 rounded-lg px-4 py-2 text-slate-300 font-mono text-sm">
              {formatDuration(meetingDuration)}
            </div>

            <button
              onClick={onLeave}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Leave Meeting
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 bg-slate-900">
        <div className="max-w-7xl mx-auto h-full">
          <div className="bg-slate-800 rounded-2xl overflow-hidden shadow-2xl h-full border border-slate-700">
            <div className="relative w-full h-full">
              <iframe
                src="https://meet.google.com/xyz-abcq-pqr"
                className="w-full h-full rounded-2xl"
                allow="camera; microphone; display-capture"
                title="Meeting Room"
              />

              <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/50 to-transparent pointer-events-none">
                <div className="flex items-center justify-between">
                  <div className="bg-black/40 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/10">
                    <p className="text-white text-sm font-medium">
                      Web3 Project Strategy Meeting
                    </p>
                  </div>
                  <div className="bg-red-600/90 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span className="text-white text-xs font-semibold">
                      LIVE
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-slate-800 border-t border-slate-700 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-center">
          <p className="text-slate-400 text-sm">
            Secured by blockchain • Access verified on-chain
          </p>
        </div>
      </footer>
    </div>
  );
}
