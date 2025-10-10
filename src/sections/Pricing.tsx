import { CheckCircle2, Star } from 'lucide-react';

interface Plan {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  popular?: boolean;
}

const plans: Plan[] = [
  {
    name: 'Starter',
    price: 'Free',
    description: 'Perfect for getting started',
    features: [
      'Unlimited bookings',
      '2.5% transaction fee',
      'Basic calendar sync',
      'Email notifications',
      'Standard support'
    ]
  },
  {
    name: 'Pro',
    price: '0.01 ETH',
    period: '/month',
    description: 'For professionals',
    features: [
      'Everything in Starter',
      '1.5% transaction fee',
      'Advanced calendar sync',
      'Custom branding',
      'Priority support',
      'Analytics dashboard'
    ],
    popular: true
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For teams and organizations',
    features: [
      'Everything in Pro',
      '0.5% transaction fee',
      'Team management',
      'API access',
      'Dedicated support',
      'Custom integrations'
    ]
  }
];

export function Pricing() {
  return (
    <section id="pricing" className="container mx-auto px-6 py-24">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-slate-400">
            Only pay when you get paid. No hidden fees.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative p-8 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border rounded-2xl ${
                plan.popular ? 'border-cyan-500 shadow-xl shadow-cyan-500/20' : 'border-slate-700'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full text-sm font-semibold text-white flex items-center gap-1">
                  <Star className="w-4 h-4" />
                  Most Popular
                </div>
              )}
              <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
              <p className="text-slate-400 mb-6">{plan.description}</p>
              <div className="mb-8">
                <span className="text-5xl font-bold text-white">{plan.price}</span>
                {plan.period && <span className="text-slate-400">{plan.period}</span>}
              </div>
              <button className={`w-full py-3 rounded-lg font-semibold transition-all mb-8 ${
                plan.popular
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-lg hover:shadow-cyan-500/30'
                  : 'bg-slate-700 text-white hover:bg-slate-600'
              }`}>
                Get Started
              </button>
              <ul className="space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
