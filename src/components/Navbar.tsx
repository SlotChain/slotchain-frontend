import { Calendar } from "lucide-react";

interface NavbarProps {
  onLaunchApp?: () => void;
}

export function Navbar({ onLaunchApp }: NavbarProps) {
  const handleLaunchClick = () => {
    if (onLaunchApp) {
      onLaunchApp();
    }
  };

  return (
    <nav className="container mx-auto px-6 py-6 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Calendar className="w-6 h-6 text-white" />
        </div>
        <span className="text-2xl font-bold text-white">SlotChain</span>
      </div>

      <div className="hidden md:flex items-center gap-8">
        <a
          href="#features"
          className="text-slate-300 hover:text-white transition-colors"
        >
          Features
        </a>
        <a
          href="#pricing"
          className="text-slate-300 hover:text-white transition-colors"
        >
          Pricing
        </a>
        <a
          href="#how-it-works"
          className="text-slate-300 hover:text-white transition-colors"
        >
          How It Works
        </a>
        <button
          onClick={handleLaunchClick}
          className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-cyan-500/30 transition-all"
        >
          Launch App
        </button>
      </div>
    </nav>
  );
}
