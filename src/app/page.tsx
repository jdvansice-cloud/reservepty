'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plane, Building2, Ship, Navigation2 } from 'lucide-react';

export default function HomePage() {
  const [lang, setLang] = useState<'en' | 'es'>('en');

  useEffect(() => {
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('es')) {
      setLang('es');
    }
  }, []);

  const t = {
    en: {
      title: 'ReservePTY',
      tagline: 'Luxury Asset Management',
      subtitle: 'Coordinate bookings for your private planes, helicopters, residences, and boats in one unified platform.',
      getStarted: 'Get Started',
      signIn: 'Sign In',
      features: 'Features',
      planes: 'Private Planes',
      planesDesc: 'Manage your aircraft fleet with flight routing and turnaround scheduling.',
      helicopters: 'Helicopters',
      helicoptersDesc: 'Helipad directory and flight-hour logging for your rotorcraft.',
      residences: 'Residences & Spaces',
      residencesDesc: 'Vacation homes, villas, and meeting rooms with cleaning buffers.',
      boats: 'Boats',
      boatsDesc: 'Yacht and watercraft management with port directories.',
    },
    es: {
      title: 'ReservePTY',
      tagline: 'Gestión de Activos de Lujo',
      subtitle: 'Coordina reservaciones de tus aviones privados, helicópteros, residencias y embarcaciones en una plataforma unificada.',
      getStarted: 'Comenzar',
      signIn: 'Iniciar Sesión',
      features: 'Características',
      planes: 'Aviones Privados',
      planesDesc: 'Administra tu flota aérea con rutas de vuelo y programación de rotación.',
      helicopters: 'Helicópteros',
      helicoptersDesc: 'Directorio de helipuertos y registro de horas de vuelo.',
      residences: 'Residencias y Espacios',
      residencesDesc: 'Casas vacacionales, villas y salas de reuniones con tiempos de limpieza.',
      boats: 'Embarcaciones',
      boatsDesc: 'Gestión de yates y embarcaciones con directorios de puertos.',
    },
  };

  const text = t[lang];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1628] to-[#1a2b4a]">
      {/* Header */}
      <header className="flex items-center justify-between p-6">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-[#c8b273] rounded-lg flex items-center justify-center">
            <span className="text-[#0a1628] font-bold text-xl">R</span>
          </div>
          <span className="text-white text-xl font-semibold">{text.title}</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setLang(lang === 'en' ? 'es' : 'en')}
            className="text-white/70 hover:text-white text-sm"
          >
            {lang === 'en' ? '🇪🇸 ES' : '🇺🇸 EN'}
          </button>
          <Link
            href="/login"
            className="text-white/70 hover:text-white transition-colors"
          >
            {text.signIn}
          </Link>
          <Link
            href="/signup"
            className="bg-[#c8b273] text-[#0a1628] px-6 py-2 rounded-lg font-semibold hover:bg-[#d4c088] transition-colors"
          >
            {text.getStarted}
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-20">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-4">
            {text.title}
          </h1>
          <p className="text-2xl text-[#c8b273] mb-6">{text.tagline}</p>
          <p className="text-white/70 text-lg max-w-2xl mx-auto mb-10">
            {text.subtitle}
          </p>
          <Link
            href="/signup"
            className="inline-block bg-[#c8b273] text-[#0a1628] px-10 py-4 rounded-lg font-bold text-lg hover:bg-[#d4c088] transition-colors"
          >
            {text.getStarted}
          </Link>
        </div>

        {/* Features */}
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          {text.features}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
            <div className="w-12 h-12 bg-[#c8b273]/20 rounded-lg flex items-center justify-center mb-4">
              <Plane className="w-6 h-6 text-[#c8b273]" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">{text.planes}</h3>
            <p className="text-white/60 text-sm">{text.planesDesc}</p>
          </div>

          <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
            <div className="w-12 h-12 bg-[#c8b273]/20 rounded-lg flex items-center justify-center mb-4">
              <Navigation2 className="w-6 h-6 text-[#c8b273]" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">{text.helicopters}</h3>
            <p className="text-white/60 text-sm">{text.helicoptersDesc}</p>
          </div>

          <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
            <div className="w-12 h-12 bg-[#c8b273]/20 rounded-lg flex items-center justify-center mb-4">
              <Building2 className="w-6 h-6 text-[#c8b273]" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">{text.residences}</h3>
            <p className="text-white/60 text-sm">{text.residencesDesc}</p>
          </div>

          <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
            <div className="w-12 h-12 bg-[#c8b273]/20 rounded-lg flex items-center justify-center mb-4">
              <Ship className="w-6 h-6 text-[#c8b273]" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">{text.boats}</h3>
            <p className="text-white/60 text-sm">{text.boatsDesc}</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-10 text-white/50 text-sm">
        © {new Date().getFullYear()} ReservePTY. All rights reserved.
      </footer>
    </div>
  );
}
