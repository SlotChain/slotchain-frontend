import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Hero } from '../sections/Hero';
import { Features } from '../sections/Features';
import { HowItWorks } from '../sections/HowItWorks';
import { CTA } from '../sections/CTA';
import { Ticket } from './Ticket';

interface LandingPageProps {
  onLaunchApp: () => void;
}

export function LandingPage({ onLaunchApp }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Navbar onLaunchApp={onLaunchApp} />
      <Ticket onAccessGranted={() => {}} onLaunchApp={onLaunchApp} />
      <Hero />
      <Features />
      <HowItWorks />
      {/* <Pricing /> */}
      <CTA />
      <Footer />
    </div>
  );
}
