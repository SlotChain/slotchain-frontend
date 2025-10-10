interface Step {
  step: string;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    step: '01',
    title: 'Connect Your Wallet',
    description: 'Link your crypto wallet in seconds. We support MetaMask, WalletConnect, and more.'
  },
  {
    step: '02',
    title: 'Set Your Availability',
    description: 'Configure your schedule, set your rates in crypto, and create your booking page.'
  },
  {
    step: '03',
    title: 'Share & Get Paid',
    description: 'Share your link and receive instant crypto payments when clients book with you.'
  }
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="container mx-auto px-6 py-24">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            How It Works
          </h2>
          <p className="text-xl text-slate-400">
            Get started in three simple steps
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={step.step} className="relative">
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8">
                <div className="text-6xl font-bold bg-gradient-to-br from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-6">
                  {step.step}
                </div>
                <h3 className="text-2xl font-semibold text-white mb-4">{step.title}</h3>
                <p className="text-slate-400 leading-relaxed">{step.description}</p>
              </div>
              {index < 2 && (
                <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-cyan-500 to-transparent"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
