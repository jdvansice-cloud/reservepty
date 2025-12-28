'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2, Building2, Plane, Navigation2, Ship, Check } from 'lucide-react';

const sections = [
  { id: 'planes', name: 'Planes', nameEs: 'Aviones', icon: Plane, price: 99 },
  { id: 'helicopters', name: 'Helicopters', nameEs: 'Helicópteros', icon: Navigation2, price: 99 },
  { id: 'residences', name: 'Residences & Spaces', nameEs: 'Residencias y Espacios', icon: Building2, price: 79 },
  { id: 'boats', name: 'Boats', nameEs: 'Embarcaciones', icon: Ship, price: 79 },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { session, refreshAuth } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [selectedSections, setSelectedSections] = useState<string[]>([]);

  const handleComplete = async () => {
    if (!session?.access_token || !orgName || selectedSections.length === 0) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationName: orgName,
          sections: selectedSections,
        }),
      });

      if (response.ok) {
        await refreshAuth();
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Onboarding error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (id: string) => {
    setSelectedSections(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1628] to-[#1a2b4a] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to ReservePTY</h1>
          <p className="text-white/60">Let's set up your organization</p>
        </div>

        <div className="bg-white/5 backdrop-blur rounded-2xl p-8 border border-white/10">
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white">Organization Name</h2>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Enter your organization name"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white"
              />
              <button
                onClick={() => setStep(2)}
                disabled={!orgName}
                className="w-full bg-[#c8b273] text-[#0a1628] py-3 rounded-lg font-semibold disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white">Select Asset Sections</h2>
              <div className="grid grid-cols-2 gap-4">
                {sections.map(section => (
                  <button
                    key={section.id}
                    onClick={() => toggleSection(section.id)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedSections.includes(section.id)
                        ? 'border-[#c8b273] bg-[#c8b273]/20'
                        : 'border-white/20 bg-white/5 hover:border-white/40'
                    }`}
                  >
                    <section.icon className={`w-8 h-8 mb-2 ${
                      selectedSections.includes(section.id) ? 'text-[#c8b273]' : 'text-white/60'
                    }`} />
                    <p className="text-white font-medium">{section.name}</p>
                    <p className="text-white/50 text-sm">${section.price}/mo</p>
                  </button>
                ))}
              </div>
              <button
                onClick={handleComplete}
                disabled={loading || selectedSections.length === 0}
                className="w-full bg-[#c8b273] text-[#0a1628] py-3 rounded-lg font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                Start 14-Day Free Trial
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
