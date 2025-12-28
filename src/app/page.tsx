'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Plane, Ship, Home, Navigation2, ChevronRight, Shield, Calendar, Users } from 'lucide-react';

export default function LandingPage() {
  const { t, language } = useLanguage();
  
  return (
    <div className="min-h-screen bg-navy-950">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gold-500 rounded-lg flex items-center justify-center">
              <span className="text-navy-950 font-display font-bold text-lg">R</span>
            </div>
            <span className="font-display text-xl font-semibold text-white">
              Reserve<span className="text-gold-500">PTY</span>
            </span>
          </Link>
          
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                {language === 'es' ? 'Iniciar Sesión' : 'Sign In'}
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">
                {language === 'es' ? 'Comenzar' : 'Get Started'}
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-radial from-navy-800/50 via-navy-950 to-navy-950" />
        
        {/* Decorative elements */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gold-500/10 rounded-full blur-2xl" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-500/10 border border-gold-500/20 mb-8 animate-fade-up">
            <span className="w-2 h-2 bg-gold-500 rounded-full animate-pulse" />
            <span className="text-gold-500 text-sm font-medium">
              {language === 'es' ? 'Plataforma Premium de Gestión de Activos' : 'Premium Asset Management Platform'}
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-display text-display-lg md:text-display-xl text-white mb-6 animate-fade-up delay-100">
            {language === 'es' ? (
              <>
                Gestiona tus{' '}
                <span className="text-gradient-gold">Activos de Lujo</span>
                <br />
                con Elegancia
              </>
            ) : (
              <>
                Manage Your{' '}
                <span className="text-gradient-gold">Luxury Assets</span>
                <br />
                With Elegance
              </>
            )}
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-muted max-w-2xl mx-auto mb-10 animate-fade-up delay-200">
            {language === 'es'
              ? 'Coordina reservas de aviación privada, yates y propiedades exclusivas. Diseñado para family offices y propietarios exigentes.'
              : 'Coordinate bookings across private aviation, yachts, and exclusive properties. Built for family offices and discerning asset owners.'}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up delay-300">
            <Link href="/signup">
              <Button size="xl" className="w-full sm:w-auto">
                {language === 'es' ? 'Iniciar Prueba Gratis' : 'Start Free Trial'}
                <ChevronRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary" size="xl" className="w-full sm:w-auto">
                {language === 'es' ? 'Ver Demo' : 'View Demo'}
              </Button>
            </Link>
          </div>

          {/* Trust indicators */}
          <p className="text-subtle text-sm mt-8 animate-fade-up delay-400">
            {language === 'es'
              ? 'Prueba gratis de 14 días • Sin tarjeta de crédito • Cancela cuando quieras'
              : '14-day free trial • No credit card required • Cancel anytime'}
          </p>
        </div>
      </section>

      {/* Asset Sections */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-display-sm text-white mb-4">
              {language === 'es' ? 'Una Plataforma, Todos tus Activos' : 'One Platform, All Your Assets'}
            </h2>
            <p className="text-muted text-lg max-w-2xl mx-auto">
              {language === 'es'
                ? 'Secciones modulares te permiten gestionar exactamente lo que necesitas. Activa cualquier combinación de tipos de activos.'
                : 'Modular sections let you manage exactly what you need. Activate any combination of asset types.'}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Planes */}
            <div className="group card-hover p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center group-hover:bg-gold-500/20 transition-colors">
                <Plane className="w-8 h-8 text-gold-500" />
              </div>
              <h3 className="font-display text-xl font-semibold text-white mb-2">
                {language === 'es' ? 'Aviones' : 'Planes'}
              </h3>
              <p className="text-muted text-sm">
                {language === 'es'
                  ? 'Jets privados, turbohélices y aeronaves con rutas de vuelo y cálculos de ETA'
                  : 'Private jets, turboprops, and aircraft with flight routing and ETA calculations'}
              </p>
            </div>

            {/* Helicopters */}
            <div className="group card-hover p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                <Navigation2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="font-display text-xl font-semibold text-white mb-2">
                {language === 'es' ? 'Helicópteros' : 'Helicopters'}
              </h3>
              <p className="text-muted text-sm">
                {language === 'es'
                  ? 'Gestión de aeronaves de rotor con directorio de helipuertos y registro de horas de vuelo'
                  : 'Rotorcraft management with helipad directory and flight-hour logging'}
              </p>
            </div>

            {/* Residences */}
            <div className="group card-hover p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                <Home className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="font-display text-xl font-semibold text-white mb-2">
                {language === 'es' ? 'Residencias' : 'Residences'}
              </h3>
              <p className="text-muted text-sm">
                {language === 'es'
                  ? 'Casas, villas y espacios de reunión con gestión de check-in/out'
                  : 'Homes, villas, and meeting spaces with check-in/out management'}
              </p>
            </div>

            {/* Boats */}
            <div className="group card-hover p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                <Ship className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="font-display text-xl font-semibold text-white mb-2">
                {language === 'es' ? 'Embarcaciones' : 'Boats'}
              </h3>
              <p className="text-muted text-sm">
                {language === 'es'
                  ? 'Yates y embarcaciones con directorio de puertos y coordinación de capitanes'
                  : 'Yachts and watercraft with port directory and captain coordination'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-navy-900/50 border-y border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-display-sm text-white mb-4">
              {language === 'es' 
                ? 'Diseñado para la Complejidad, Creado para la Simplicidad' 
                : 'Built for Complexity, Designed for Simplicity'}
            </h2>
            <p className="text-muted text-lg max-w-2xl mx-auto">
              {language === 'es'
                ? 'Funciones avanzadas envueltas en una interfaz intuitiva que todo tu equipo puede usar.'
                : 'Advanced features wrapped in an intuitive interface your entire team can use.'}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8">
              <div className="w-12 h-12 mb-6 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-gold-500" />
              </div>
              <h3 className="font-display text-lg font-semibold text-white mb-3">
                {language === 'es' ? 'Calendario Unificado' : 'Unified Calendar'}
              </h3>
              <p className="text-muted">
                {language === 'es'
                  ? 'Ve todos los activos de todas las categorías en una vista integral. Sin más cambios entre sistemas.'
                  : 'See all assets across all categories in one comprehensive view. No more switching between systems.'}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8">
              <div className="w-12 h-12 mb-6 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-gold-500" />
              </div>
              <h3 className="font-display text-lg font-semibold text-white mb-3">
                {language === 'es' ? 'Niveles de Prioridad' : 'Priority Tiers'}
              </h3>
              <p className="text-muted">
                {language === 'es'
                  ? 'Define niveles de miembros con reglas de prioridad de reserva. Asegura que los principales siempre tengan acceso primero.'
                  : 'Define member tiers with booking priority rules. Ensure principals always have first access.'}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8">
              <div className="w-12 h-12 mb-6 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-gold-500" />
              </div>
              <h3 className="font-display text-lg font-semibold text-white mb-3">
                {language === 'es' ? 'Seguro y Privado' : 'Secure & Private'}
              </h3>
              <p className="text-muted">
                {language === 'es'
                  ? 'Seguridad de nivel empresarial con aislamiento completo de datos entre organizaciones.'
                  : 'Enterprise-grade security with complete data isolation between organizations.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-gold-500/5 via-transparent to-transparent" />
        
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-display text-display text-white mb-6">
            {language === 'es' ? '¿Listo para Optimizar tus Activos?' : 'Ready to Streamline Your Assets?'}
          </h2>
          <p className="text-muted text-lg mb-10">
            {language === 'es'
              ? 'Únete a familias y organizaciones exigentes que confían en ReservePTY para gestionar sus activos más valiosos.'
              : 'Join discerning families and organizations who trust ReservePTY to manage their most valuable assets.'}
          </p>
          <Link href="/signup">
            <Button size="xl">
              {language === 'es' ? 'Inicia tu Prueba Gratis' : 'Start Your Free Trial'}
              <ChevronRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gold-500 rounded-lg flex items-center justify-center">
                <span className="text-navy-950 font-display font-bold text-lg">R</span>
              </div>
              <span className="font-display text-lg font-semibold text-white">
                Reserve<span className="text-gold-500">PTY</span>
              </span>
            </div>
            
            <p className="text-subtle text-sm">
              © {new Date().getFullYear()} ReservePTY. {language === 'es' ? 'Todos los derechos reservados.' : 'All rights reserved.'}
            </p>
            
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-muted hover:text-white text-sm transition-colors">
                {language === 'es' ? 'Privacidad' : 'Privacy'}
              </Link>
              <Link href="/terms" className="text-muted hover:text-white text-sm transition-colors">
                {language === 'es' ? 'Términos' : 'Terms'}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
