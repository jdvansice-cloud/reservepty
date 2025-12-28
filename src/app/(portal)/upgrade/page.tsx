'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Check, Loader2 } from 'lucide-react';

const sections = [
  { id: 'planes', name: 'Planes', nameEs: 'Aviones', monthlyPrice: 99 },
  { id: 'helicopters', name: 'Helicopters', nameEs: 'Helicópteros', monthlyPrice: 99 },
  { id: 'residences', name: 'Residences & Spaces', nameEs: 'Residencias y Espacios', monthlyPrice: 79 },
  { id: 'boats', name: 'Boats', nameEs: 'Embarcaciones', monthlyPrice: 79 },
];
const seatTiers = [5, 10, 25, 50, 100];

export default function UpgradePage() {
  const { entitlements } = useAuth();
  const { language } = useLanguage();
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedSections, setSelectedSections] = useState<string[]>(entitlements.filter(e => e.is_active).map(e => e.section));
  const [seats, setSeats] = useState(10);

  const t = { en: { title: 'Upgrade Your Plan', monthly: 'Monthly', yearly: 'Yearly', savePercent: 'Save 20%', seats: 'Team Size', perMonth: '/month', total: 'Total', upgrade: 'Upgrade Now' }, es: { title: 'Mejora tu Plan', monthly: 'Mensual', yearly: 'Anual', savePercent: 'Ahorra 20%', seats: 'Tamaño del Equipo', perMonth: '/mes', total: 'Total', upgrade: 'Mejorar Ahora' } };
  const text = t[language];

  const toggleSection = (id: string) => setSelectedSections(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  const sectionsCost = selectedSections.reduce((sum, id) => sum + (sections.find(s => s.id === id)?.monthlyPrice || 0), 0);
  const seatMultiplier = seats <= 5 ? 1 : seats <= 10 ? 1.5 : seats <= 25 ? 2 : seats <= 50 ? 3 : 4;
  const monthlyTotal = Math.round(sectionsCost * seatMultiplier);
  const total = billing === 'yearly' ? Math.round(monthlyTotal * 12 * 0.8) : monthlyTotal;

  return (
    <div className="p-6 pb-24 lg:pb-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">{text.title}</h1>
      <div className="flex justify-center gap-2 mb-8">
        <button onClick={() => setBilling('monthly')} className={`px-6 py-2 rounded-lg ${billing === 'monthly' ? 'bg-[#c8b273] text-[#0a1628]' : 'bg-white/10 text-white'}`}>{text.monthly}</button>
        <button onClick={() => setBilling('yearly')} className={`px-6 py-2 rounded-lg ${billing === 'yearly' ? 'bg-[#c8b273] text-[#0a1628]' : 'bg-white/10 text-white'}`}>{text.yearly} <span className="text-xs ml-1">({text.savePercent})</span></button>
      </div>
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {sections.map(section => (
          <button key={section.id} onClick={() => toggleSection(section.id)} className={`p-4 rounded-xl border-2 text-left ${selectedSections.includes(section.id) ? 'border-[#c8b273] bg-[#c8b273]/20' : 'border-white/20 bg-white/5'}`}>
            <div className="flex items-center justify-between">
              <span className="text-white font-medium">{language === 'en' ? section.name : section.nameEs}</span>
              {selectedSections.includes(section.id) && <Check className="w-5 h-5 text-[#c8b273]" />}
            </div>
            <p className="text-white/50 text-sm mt-1">${section.monthlyPrice}{text.perMonth}</p>
          </button>
        ))}
      </div>
      <div className="bg-white/5 rounded-xl p-6 mb-8">
        <h3 className="text-white font-medium mb-4">{text.seats}</h3>
        <div className="flex gap-2">
          {seatTiers.map(tier => (
            <button key={tier} onClick={() => setSeats(tier)} className={`px-4 py-2 rounded-lg ${seats === tier ? 'bg-[#c8b273] text-[#0a1628]' : 'bg-white/10 text-white'}`}>{tier}</button>
          ))}
        </div>
      </div>
      <div className="bg-white/5 rounded-xl p-6 text-center">
        <p className="text-white/50 mb-2">{text.total}</p>
        <p className="text-4xl font-bold text-white mb-1">${total}<span className="text-lg text-white/50">{billing === 'yearly' ? '/yr' : '/mo'}</span></p>
        <button className="mt-4 bg-[#c8b273] text-[#0a1628] px-8 py-3 rounded-lg font-semibold">{text.upgrade}</button>
      </div>
    </div>
  );
}
