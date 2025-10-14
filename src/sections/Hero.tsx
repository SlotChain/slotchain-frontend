import { useState } from "react";
import { Zap, ArrowRight, CheckCircle2 } from "lucide-react";

export function Hero() {
  const [email, setEmail] = useState("");

  const handleGetStarted = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <section className="container mx-auto px-6 pt-20 pb-32">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>

          <div className="relative">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 backdrop-blur-sm border border-cyan-500/20 rounded-full mb-6">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-slate-300">
                Powered by blockchain technology
              </span>
            </div>

            <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Schedule meetings.
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Get paid in crypto.
              </span>
            </h1>

            <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
              The first decentralized scheduling platform where your time has
              real value. Accept crypto payments seamlessly for every booking.
            </p>

            {/* <form onSubmit={handleGetStarted} className="flex flex-col sm:flex-row gap-4 justify-center max-w-xl mx-auto mb-8">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-6 py-4 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                required
              />
              <button
                type="submit"
                className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-semibold hover:shadow-xl hover:shadow-cyan-500/30 transition-all flex items-center justify-center gap-2 group"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </form> */}

            <div className="flex items-center justify-center gap-6 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>Setup in 2 minutes</span>
              </div>
            </div>
          </div>
        </div>
        {/* 
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-16 border-t border-slate-800">
          {[
            { label: "Transactions", value: "1M+" },
            { label: "Active Users", value: "50K+" },
            { label: "Countries", value: "120+" },
            { label: "Uptime", value: "99.9%" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                {stat.value}
              </div>
              <div className="text-slate-400">{stat.label}</div>
            </div>
          ))}
        </div> */}
      </div>
    </section>
  );
}
