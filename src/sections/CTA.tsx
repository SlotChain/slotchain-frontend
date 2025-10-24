import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function CTA() {
  return (
    <section className="container mx-auto px-6 py-24">
      <div className="max-w-4xl mx-auto">
        <div className="relative overflow-hidden bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl p-12 md:p-16">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="relative z-10 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to monetize your time?
            </h2>
            <p className="text-xl text-cyan-50 mb-8">
              Join thousands of professionals already earning crypto for their expertise.
            </p>
            <Link
              to="/login"
              className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:shadow-xl transition-all inline-flex items-center gap-2 group"
            >
              Start Earning Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
