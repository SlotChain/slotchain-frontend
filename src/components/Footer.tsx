import { Calendar } from "lucide-react";

export function Footer() {
  return (
    <footer className="container mx-auto px-6 py-12 border-t border-slate-800">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">SlotChain</span>
            </div>
            <p className="text-slate-400">
              The future of scheduling meets the power of blockchain.
            </p>
          </div>

          {[
            {
              title: "Product",
              links: ["Features", "Pricing", "Security", "Roadmap"],
            },
            {
              title: "Company",
              links: ["About", "Blog", "Careers", "Press Kit"],
            },
            {
              title: "Resources",
              links: ["Documentation", "API", "Community", "Support"],
            },
          ].map((column) => (
            <div key={column.title}>
              <h4 className="font-semibold text-white mb-4">{column.title}</h4>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-400 text-sm">
            © 2025 SlotChain. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-slate-400">
            <a href="#" className="hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Terms of Service
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
