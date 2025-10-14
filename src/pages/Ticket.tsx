import { useState } from "react";
import { Wallet, Calendar, Shield, ChevronRight } from "lucide-react";
import {
  connectWallet,
  hasMeetingAccess,
  formatAddress,
} from "../utils/mockWeb3";
import AccessVerificationModal from "../components/AccessVerificationModal";

interface TicketProps {
  onAccessGranted: () => void;
  onLaunchApp?: () => void;
}

export function Ticket({ onAccessGranted, onLaunchApp }: TicketProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleConnectWallet = async () => {
    setIsConnecting(true);
    try {
      const address = await connectWallet();
      setWalletAddress(address);
      setIsConnecting(false);

      setShowModal(true);
      setIsVerifying(true);

      const access = await hasMeetingAccess(address);
      setHasAccess(access);
      setIsVerifying(false);
    } catch (error) {
      console.error("Connection error:", error);
      setIsConnecting(false);
    }
  };

  const handleRetry = () => {
    setShowModal(false);
    setWalletAddress(null);
    setHasAccess(null);
    setIsVerifying(false);
  };

  const handleDisconnect = () => {
    setWalletAddress(null);
    setHasAccess(null);
    setShowModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAgNHYyaDJ2LTJoLTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-40"></div>

      <div className="relative max-w-6xl mx-auto px-4 py-12">
        {walletAddress && (
          <div className="absolute top-8 right-8">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2 flex items-center gap-3">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-white font-mono text-sm">
                {formatAddress(walletAddress)}
              </span>
              <button
                onClick={handleDisconnect}
                className="text-white/60 hover:text-white text-sm transition-colors"
              >
                Disconnect
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-center min-h-[10vh]">
          <div className="text-center max-w-3xl">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/50">
                <Calendar className="w-9 h-9 text-white" />
              </div>
              <h1 className="text-5xl font-bold text-white">SlotChain</h1>
            </div>

            <p className="text-2xl text-yellow-100 mb-4 mt-100">
              Already have a Ticket?
            </p>
            <p className="text-lg text-slate-300 mb-12 max-w-2xl mx-auto">
              Connect your wallet to verify and access your meeting.
            </p>

            {!walletAddress ? (
              <button
                onClick={handleConnectWallet}
                disabled={isConnecting}
                className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold px-8 py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105"
              >
                {isConnecting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Connecting Wallet...
                  </>
                ) : (
                  <>
                    <Wallet className="w-6 h-6" />
                    Connect Wallet
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            ) : null}

            <div className="mt-16 grid md:grid-cols-3 gap-6">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <Shield className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">Secure Access</h3>
                <p className="text-slate-400 text-sm">
                  On-chain verification ensures only authorized participants can
                  join
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <Wallet className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">Web3 Native</h3>
                <p className="text-slate-400 text-sm">Connect with MetaMask</p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <Calendar className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">Instant Join</h3>
                <p className="text-slate-400 text-sm">
                  Seamless meeting access after wallet verification
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AccessVerificationModal
        isOpen={showModal}
        isVerifying={isVerifying}
        hasAccess={hasAccess}
        onRedirect={onAccessGranted}
        onRetry={handleRetry}
      />
    </div>
  );
}
