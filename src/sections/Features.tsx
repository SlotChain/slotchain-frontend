import {
  Wallet,
  Shield,
  Globe,
  Lock,
  Zap,
  Calendar,
  LucideIcon,
} from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: Wallet,
    title: "Crypto Payments",
    description:
      "Accept Bitcoin, Ethereum, USDT, and 50+ cryptocurrencies instantly with zero chargebacks.",
  },
  {
    icon: Shield,
    title: "Trustless & Secure",
    description:
      "Smart contracts ensure automatic payment release. No intermediaries, no disputes.",
  },
  {
    icon: Globe,
    title: "Global Access",
    description:
      "Work with clients worldwide without currency conversion or bank restrictions.",
  },
  {
    icon: Lock,
    title: "Privacy First",
    description:
      "Your financial data stays private. No KYC required for basic transactions.",
  },
  {
    icon: Zap,
    title: "Instant Settlement",
    description:
      "Get paid instantly when bookings are confirmed. No waiting for payment processors.",
  },
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description:
      "Automated booking links, timezone detection, and calendar sync across all platforms.",
  },
];

export function Features() {
  return (
    <section id="features" className="container mx-auto px-6 py-24">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Why Choose SlotChain?
          </h2>
          <p className="text-xl text-slate-400">
            Combine the simplicity of scheduling with the power of blockchain
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group p-8 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-2xl hover:border-cyan-500/50 transition-all hover:shadow-xl hover:shadow-cyan-500/10"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <feature.icon className="w-7 h-7 text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-slate-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
