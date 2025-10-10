import { useState } from "react";
import { ethers } from "ethers";
import { Calendar, Wallet, Shield, Zap } from "lucide-react";

interface LoginProps {
  onLogin: (walletAddress: string) => void;
  onSignupRedirect: (walletAddress: string) => void;
}

export function Login({ onLogin, onSignupRedirect }: LoginProps) {
  const [connecting, setConnecting] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  const wallets = [
    {
      name: "MetaMask",
      icon: "🦊",
      description: "Connect using MetaMask browser extension",
    },
    {
      name: "WalletConnect",
      icon: "🔗",
      description: "Connect using WalletConnect protocol",
    },
    {
      name: "Coinbase Wallet",
      icon: "💼",
      description: "Connect using Coinbase Wallet",
    },
  ];
  const handleWalletConnect = async (walletName: string) => {
    setConnecting(true);
    setSelectedWallet(walletName);

    try {
      if (!window.ethereum) {
        alert("Please install MetaMask!");
        setConnecting(false);
        return;
      }

      // 1️⃣ Connect to the wallet
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const address = accounts[0];

      // 2️⃣ Get message from backend to sign
      const messageRes = await fetch(
        "http://localhost:5000/api/auth/login-message",
        {
          method: "POST",
        }
      );
      const { message } = await messageRes.json();

      // 3️⃣ Sign the message with the wallet
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(message);

      // 4️⃣ Send wallet + signature to backend for verification
      const loginRes = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: address, signature }),
      });

      const data = await loginRes.json();

      // 5️⃣ Handle response
      if (data.status === "existing_user") {
        console.log("✅ User exists:", data.user);
        onLogin(data.user.walletAddress); // send user data to dashboard
      } else if (data.status === "new_user") {
        console.log("🆕 New user detected — redirecting to signup");
        onSignupRedirect(address); // ✅ pass connected wallet address
      } else {
        alert("Unexpected response from server.");
      }
    } catch (err) {
      console.error("❌ Wallet connection error:", err);
      alert("Wallet connection failed. Check console for details.");
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>

      <div className="relative w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Calendar className="w-7 h-7 text-white" />
          </div>
          <span className="text-3xl font-bold text-white">SlotChain</span>
        </div>

        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-slate-400">Connect your wallet to continue</p>
          </div>

          <div className="space-y-4 mb-8">
            {wallets.map((wallet) => (
              <button
                key={wallet.name}
                onClick={() => handleWalletConnect(wallet.name)}
                disabled={connecting}
                className="w-full p-4 bg-slate-800/50 border border-slate-700 rounded-xl hover:border-cyan-500/50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{wallet.icon}</div>
                  <div className="flex-1 text-left">
                    <div className="text-white font-semibold mb-1">
                      {wallet.name}
                    </div>
                    <div className="text-sm text-slate-400">
                      {wallet.description}
                    </div>
                  </div>
                  {connecting && selectedWallet === wallet.name && (
                    <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span>
                Your wallet stays secure. We never access your private keys.
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Instant authentication. No passwords required.</span>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-slate-400 text-sm">
            New to SlotChain?{" "}
            <button
              onClick={onSignupRedirect}
              className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
            >
              Create an account
            </button>
          </p>
        </div>

        <div className="mt-8 text-center text-xs text-slate-500">
          By connecting, you agree to our{" "}
          <a href="#" className="text-cyan-400 hover:text-cyan-300">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="text-cyan-400 hover:text-cyan-300">
            Privacy Policy
          </a>
        </div>
      </div>
    </div>
  );
}
