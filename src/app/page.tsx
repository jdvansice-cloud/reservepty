'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Plane, Ship, Home, Navigation2, ChevronRight, Shield, Calendar, Users,
  Check, Star, Clock, Globe, Zap, Lock, Bell, BarChart3, Settings,
  ChevronDown, ArrowRight, Sparkles, Crown, Building2, Anchor
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LandingPage() {
  const { language } = useLanguage();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  
  // Pricing data (matching admin settings)
  const sectionPricing = {
    planes: 99,
    helicopters: 99,
    residences: 99,
    boats: 99,
  };
  
  const seatPricing = [
    { seats: 5, price: 0, label: language === 'es' ? 'Incluido' : 'Included' },
    { seats: 10, price: 49, label: '+$49' },
    { seats: 25, price: 99, label: '+$99' },
    { seats: 50, price: 199, label: '+$199' },
    { seats: 100, price: 399, label: '+$399' },
  ];
  
  const yearlyDiscount = 0.20; // 20% discount
  
  const features = [
    {
      icon: Calendar,
      title: language === 'es' ? 'Calendario Unificado' : 'Unified Calendar',
      description: language === 'es'
        ? 'Ve todos los activos de todas las categorías en una vista integral.'
        : 'See all assets across all categories in one comprehensive view.',
    },
    {
      icon: Users,
      title: language === 'es' ? 'Niveles de Prioridad' : 'Priority Tiers',
      description: language === 'es'
        ? 'Define niveles de miembros con reglas de prioridad de reserva.'
        : 'Define member tiers with booking priority rules.',
    },
    {
      icon: Shield,
      title: language === 'es' ? 'Seguro y Privado' : 'Secure & Private',
      description: language === 'es'
        ? 'Seguridad de nivel empresarial con aislamiento completo de datos.'
        : 'Enterprise-grade security with complete data isolation.',
    },
    {
      icon: Bell,
      title: language === 'es' ? 'Notificaciones Inteligentes' : 'Smart Notifications',
      description: language === 'es'
        ? 'Alertas personalizables para reservas, aprobaciones y conflictos.'
        : 'Customizable alerts for bookings, approvals, and conflicts.',
    },
    {
      icon: BarChart3,
      title: language === 'es' ? 'Análisis y Reportes' : 'Analytics & Reports',
      description: language === 'es'
        ? 'Métricas detalladas de uso y tendencias de reservas.'
        : 'Detailed usage metrics and booking trends.',
    },
    {
      icon: Globe,
      title: language === 'es' ? 'Acceso Global' : 'Global Access',
      description: language === 'es'
        ? 'Accede desde cualquier dispositivo, en cualquier lugar del mundo.'
        : 'Access from any device, anywhere in the world.',
    },
  ];
  
  const howItWorks = [
    {
      step: '01',
      title: language === 'es' ? 'Crea tu Organización' : 'Create Your Organization',
      description: language === 'es'
        ? 'Regístrate y configura tu familia, empresa o grupo en minutos.'
        : 'Sign up and set up your family, company, or group in minutes.',
    },
    {
      step: '02',
      title: language === 'es' ? 'Activa tus Secciones' : 'Activate Your Sections',
      description: language === 'es'
        ? 'Selecciona los tipos de activos que deseas gestionar: aviones, helicópteros, residencias o embarcaciones.'
        : 'Select the asset types you want to manage: planes, helicopters, residences, or boats.',
    },
    {
      step: '03',
      title: language === 'es' ? 'Agrega tus Activos' : 'Add Your Assets',
      description: language === 'es'
        ? 'Registra tus activos con detalles, fotos y configuraciones personalizadas.'
        : 'Register your assets with details, photos, and custom configurations.',
    },
    {
      step: '04',
      title: language === 'es' ? 'Invita a tu Equipo' : 'Invite Your Team',
      description: language === 'es'
        ? 'Agrega miembros, asigna niveles de prioridad y empieza a coordinar.'
        : 'Add members, assign priority tiers, and start coordinating.',
    },
  ];
  
  const faqs = [
    {
      question: language === 'es' ? '¿Qué incluye la prueba gratis?' : 'What\'s included in the free trial?',
      answer: language === 'es'
        ? 'La prueba gratis de 14 días incluye acceso completo a todas las funciones de la plataforma. No se requiere tarjeta de crédito para comenzar.'
        : 'The 14-day free trial includes full access to all platform features. No credit card required to start.',
    },
    {
      question: language === 'es' ? '¿Puedo cambiar de plan en cualquier momento?' : 'Can I change plans anytime?',
      answer: language === 'es'
        ? 'Sí, puedes agregar o quitar secciones, cambiar tu número de asientos o modificar tu ciclo de facturación en cualquier momento desde tu panel de control.'
        : 'Yes, you can add or remove sections, change your seat count, or modify your billing cycle anytime from your dashboard.',
    },
    {
      question: language === 'es' ? '¿Cómo funcionan los niveles de prioridad?' : 'How do priority tiers work?',
      answer: language === 'es'
        ? 'Los niveles de prioridad te permiten definir quién tiene preferencia al reservar. Los miembros de nivel superior pueden reservar primero o incluso reemplazar reservas de niveles inferiores cuando hay conflictos.'
        : 'Priority tiers let you define who gets preference when booking. Higher-tier members can book first or even override lower-tier bookings when conflicts arise.',
    },
    {
      question: language === 'es' ? '¿Mis datos están seguros?' : 'Is my data secure?',
      answer: language === 'es'
        ? 'Absolutamente. Utilizamos encriptación de nivel bancario, aislamiento completo de datos entre organizaciones, y cumplimos con los más altos estándares de seguridad.'
        : 'Absolutely. We use bank-level encryption, complete data isolation between organizations, and comply with the highest security standards.',
    },
    {
      question: language === 'es' ? '¿Ofrecen soporte personalizado?' : 'Do you offer dedicated support?',
      answer: language === 'es'
        ? 'Sí, todos los clientes tienen acceso a nuestro equipo de soporte. Para organizaciones más grandes, ofrecemos gerentes de cuenta dedicados y onboarding personalizado.'
        : 'Yes, all customers have access to our support team. For larger organizations, we offer dedicated account managers and personalized onboarding.',
    },
  ];

  const testimonials = [
    {
      quote: language === 'es' 
        ? 'ReservePTY ha transformado cómo coordinamos el uso de nuestros activos familiares. Ya no hay confusiones ni conflictos.'
        : 'ReservePTY has transformed how we coordinate our family assets. No more confusion or conflicts.',
      author: 'Carlos M.',
      role: language === 'es' ? 'Family Office Manager' : 'Family Office Manager',
    },
    {
      quote: language === 'es'
        ? 'La interfaz es elegante y fácil de usar. Nuestro equipo la adoptó inmediatamente.'
        : 'The interface is elegant and easy to use. Our team adopted it immediately.',
      author: 'Ana S.',
      role: language === 'es' ? 'COO, Grupo Empresarial' : 'COO, Business Group',
    },
    {
      quote: language === 'es'
        ? 'El sistema de niveles de prioridad es exactamente lo que necesitábamos para nuestras operaciones.'
        : 'The priority tier system is exactly what we needed for our operations.',
      author: 'Roberto L.',
      role: language === 'es' ? 'Director de Operaciones' : 'Operations Director',
    },
  ];

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
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-muted hover:text-white text-sm transition-colors">
              {language === 'es' ? 'Características' : 'Features'}
            </Link>
            <Link href="#pricing" className="text-muted hover:text-white text-sm transition-colors">
              {language === 'es' ? 'Precios' : 'Pricing'}
            </Link>
            <Link href="#how-it-works" className="text-muted hover:text-white text-sm transition-colors">
              {language === 'es' ? 'Cómo Funciona' : 'How It Works'}
            </Link>
            <Link href="#faq" className="text-muted hover:text-white text-sm transition-colors">
              FAQ
            </Link>
          </div>
          
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
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gold-500/10 rounded-full blur-2xl" />
        <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-gold-500/5 rounded-full blur-2xl animate-pulse delay-1000" />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `linear-gradient(rgba(200, 178, 115, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(200, 178, 115, 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-500/10 border border-gold-500/20 mb-8 animate-fade-up">
            <Sparkles className="w-4 h-4 text-gold-500" />
            <span className="text-gold-500 text-sm font-medium">
              {language === 'es' ? 'Plataforma Premium de Gestión de Activos' : 'Premium Asset Management Platform'}
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white mb-6 animate-fade-up delay-100 tracking-tight">
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
          <p className="text-lg sm:text-xl text-muted max-w-2xl mx-auto mb-10 animate-fade-up delay-200">
            {language === 'es'
              ? 'Coordina reservas de aviación privada, yates y propiedades exclusivas. Diseñado para family offices y propietarios exigentes.'
              : 'Coordinate bookings across private aviation, yachts, and exclusive properties. Built for family offices and discerning asset owners.'}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up delay-300">
            <Link href="/signup">
              <Button size="xl" className="w-full sm:w-auto group">
                {language === 'es' ? 'Iniciar Prueba Gratis' : 'Start Free Trial'}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="#pricing">
              <Button variant="secondary" size="xl" className="w-full sm:w-auto">
                {language === 'es' ? 'Ver Precios' : 'View Pricing'}
              </Button>
            </Link>
          </div>

          {/* Trust indicators */}
          <p className="text-subtle text-sm mt-8 animate-fade-up delay-400">
            {language === 'es'
              ? '✓ Prueba gratis de 14 días  •  ✓ Sin tarjeta de crédito  •  ✓ Cancela cuando quieras'
              : '✓ 14-day free trial  •  ✓ No credit card required  •  ✓ Cancel anytime'}
          </p>
          
          {/* Asset icons row */}
          <div className="flex items-center justify-center gap-8 mt-16 animate-fade-up delay-500">
            <div className="flex flex-col items-center gap-2 text-muted">
              <div className="w-12 h-12 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
                <Plane className="w-6 h-6 text-gold-500" />
              </div>
              <span className="text-xs">{language === 'es' ? 'Aviones' : 'Planes'}</span>
            </div>
            <div className="flex flex-col items-center gap-2 text-muted">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Navigation2 className="w-6 h-6 text-emerald-400" />
              </div>
              <span className="text-xs">{language === 'es' ? 'Helicópteros' : 'Helicopters'}</span>
            </div>
            <div className="flex flex-col items-center gap-2 text-muted">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-xs">{language === 'es' ? 'Residencias' : 'Residences'}</span>
            </div>
            <div className="flex flex-col items-center gap-2 text-muted">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <Anchor className="w-6 h-6 text-purple-400" />
              </div>
              <span className="text-xs">{language === 'es' ? 'Embarcaciones' : 'Boats'}</span>
            </div>
          </div>
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-6 h-6 text-gold-500/50" />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-navy-900/50 border-y border-border relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gold-500/5 rounded-full blur-2xl" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/20 mb-4">
              <span className="text-gold-500 text-xs font-medium uppercase tracking-wider">
                {language === 'es' ? 'Características' : 'Features'}
              </span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl text-white mb-4">
              {language === 'es' 
                ? 'Todo lo que Necesitas para Gestionar tus Activos' 
                : 'Everything You Need to Manage Your Assets'}
            </h2>
            <p className="text-muted text-lg max-w-2xl mx-auto">
              {language === 'es'
                ? 'Funciones avanzadas envueltas en una interfaz intuitiva que todo tu equipo puede usar.'
                : 'Advanced features wrapped in an intuitive interface your entire team can use.'}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group p-8 rounded-2xl bg-navy-900/50 border border-border hover:border-gold-500/30 transition-all duration-300 hover:shadow-glow"
              >
                <div className="w-12 h-12 mb-6 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center group-hover:bg-gold-500/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-gold-500" />
                </div>
                <h3 className="font-display text-lg font-semibold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <Link href="/signup">
              <Button variant="secondary" size="lg">
                {language === 'es' ? 'Explorar Todas las Características' : 'Explore All Features'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Asset Sections Showcase */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/20 mb-4">
              <span className="text-gold-500 text-xs font-medium uppercase tracking-wider">
                {language === 'es' ? 'Secciones Modulares' : 'Modular Sections'}
              </span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl text-white mb-4">
              {language === 'es' ? 'Una Plataforma, Todos tus Activos' : 'One Platform, All Your Assets'}
            </h2>
            <p className="text-muted text-lg max-w-2xl mx-auto">
              {language === 'es'
                ? 'Paga solo por lo que necesitas. Activa cualquier combinación de tipos de activos.'
                : 'Pay only for what you need. Activate any combination of asset types.'}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Planes */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-b from-gold-500/10 to-navy-900 border border-gold-500/20 p-8 text-center hover:border-gold-500/40 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/10 rounded-full blur-2xl group-hover:bg-gold-500/20 transition-colors" />
              <div className="relative">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Plane className="w-10 h-10 text-gold-500" />
                </div>
                <h3 className="font-display text-xl font-semibold text-white mb-2">
                  {language === 'es' ? 'Aviones' : 'Planes'}
                </h3>
                <p className="text-muted text-sm mb-4">
                  {language === 'es'
                    ? 'Jets privados, turbohélices y aeronaves con rutas de vuelo y cálculos de ETA'
                    : 'Private jets, turboprops, and aircraft with flight routing and ETA calculations'}
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <span className="px-2 py-1 text-xs rounded-full bg-gold-500/10 text-gold-500">
                    {language === 'es' ? 'Rutas' : 'Routing'}
                  </span>
                  <span className="px-2 py-1 text-xs rounded-full bg-gold-500/10 text-gold-500">
                    ETA
                  </span>
                  <span className="px-2 py-1 text-xs rounded-full bg-gold-500/10 text-gold-500">
                    {language === 'es' ? 'Turnaround' : 'Turnaround'}
                  </span>
                </div>
              </div>
            </div>

            {/* Helicopters */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-b from-emerald-500/10 to-navy-900 border border-emerald-500/20 p-8 text-center hover:border-emerald-500/40 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors" />
              <div className="relative">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Navigation2 className="w-10 h-10 text-emerald-400" />
                </div>
                <h3 className="font-display text-xl font-semibold text-white mb-2">
                  {language === 'es' ? 'Helicópteros' : 'Helicopters'}
                </h3>
                <p className="text-muted text-sm mb-4">
                  {language === 'es'
                    ? 'Gestión de aeronaves de rotor con directorio de helipuertos y registro de horas'
                    : 'Rotorcraft management with helipad directory and flight-hour logging'}
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <span className="px-2 py-1 text-xs rounded-full bg-emerald-500/10 text-emerald-400">
                    {language === 'es' ? 'Helipuertos' : 'Helipads'}
                  </span>
                  <span className="px-2 py-1 text-xs rounded-full bg-emerald-500/10 text-emerald-400">
                    {language === 'es' ? 'Horas' : 'Hours'}
                  </span>
                </div>
              </div>
            </div>

            {/* Residences */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-b from-blue-500/10 to-navy-900 border border-blue-500/20 p-8 text-center hover:border-blue-500/40 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors" />
              <div className="relative">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Building2 className="w-10 h-10 text-blue-400" />
                </div>
                <h3 className="font-display text-xl font-semibold text-white mb-2">
                  {language === 'es' ? 'Residencias' : 'Residences'}
                </h3>
                <p className="text-muted text-sm mb-4">
                  {language === 'es'
                    ? 'Casas, villas y espacios de reunión con gestión de check-in/out'
                    : 'Homes, villas, and meeting spaces with check-in/out management'}
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-500/10 text-blue-400">
                    Check-in
                  </span>
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-500/10 text-blue-400">
                    {language === 'es' ? 'Limpieza' : 'Cleaning'}
                  </span>
                </div>
              </div>
            </div>

            {/* Boats */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-b from-purple-500/10 to-navy-900 border border-purple-500/20 p-8 text-center hover:border-purple-500/40 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-colors" />
              <div className="relative">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Anchor className="w-10 h-10 text-purple-400" />
                </div>
                <h3 className="font-display text-xl font-semibold text-white mb-2">
                  {language === 'es' ? 'Embarcaciones' : 'Boats'}
                </h3>
                <p className="text-muted text-sm mb-4">
                  {language === 'es'
                    ? 'Yates y embarcaciones con directorio de puertos y coordinación de capitanes'
                    : 'Yachts and watercraft with port directory and captain coordination'}
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <span className="px-2 py-1 text-xs rounded-full bg-purple-500/10 text-purple-400">
                    {language === 'es' ? 'Puertos' : 'Ports'}
                  </span>
                  <span className="px-2 py-1 text-xs rounded-full bg-purple-500/10 text-purple-400">
                    {language === 'es' ? 'Tripulación' : 'Crew'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-navy-900/50 border-y border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/20 mb-4">
              <span className="text-gold-500 text-xs font-medium uppercase tracking-wider">
                {language === 'es' ? 'Cómo Funciona' : 'How It Works'}
              </span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl text-white mb-4">
              {language === 'es' ? 'Comienza en Minutos' : 'Get Started in Minutes'}
            </h2>
            <p className="text-muted text-lg max-w-2xl mx-auto">
              {language === 'es'
                ? 'Cuatro simples pasos para transformar cómo gestionas tus activos.'
                : 'Four simple steps to transform how you manage your assets.'}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((step, index) => (
              <div key={index} className="relative">
                {index < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-full w-full h-px bg-gradient-to-r from-gold-500/50 to-transparent z-0" />
                )}
                <div className="relative z-10">
                  <div className="w-24 h-24 mb-6 rounded-2xl bg-gradient-to-br from-gold-500/20 to-gold-500/5 border border-gold-500/30 flex items-center justify-center">
                    <span className="font-display text-3xl font-bold text-gold-500">{step.step}</span>
                  </div>
                  <h3 className="font-display text-lg font-semibold text-white mb-3">
                    {step.title}
                  </h3>
                  <p className="text-muted text-sm">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 relative overflow-hidden">
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-64 h-64 bg-gold-500/5 rounded-full blur-2xl" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/20 mb-4">
              <span className="text-gold-500 text-xs font-medium uppercase tracking-wider">
                {language === 'es' ? 'Precios' : 'Pricing'}
              </span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl text-white mb-4">
              {language === 'es' ? 'Precios Simples y Transparentes' : 'Simple, Transparent Pricing'}
            </h2>
            <p className="text-muted text-lg max-w-2xl mx-auto mb-8">
              {language === 'es'
                ? 'Paga solo por las secciones que necesitas. Sin costos ocultos.'
                : 'Pay only for the sections you need. No hidden fees.'}
            </p>
            
            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-4 p-1 rounded-full bg-navy-800 border border-border">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={cn(
                  'px-6 py-2 rounded-full text-sm font-medium transition-all',
                  billingCycle === 'monthly' 
                    ? 'bg-gold-500 text-navy-950' 
                    : 'text-muted hover:text-white'
                )}
              >
                {language === 'es' ? 'Mensual' : 'Monthly'}
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={cn(
                  'px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2',
                  billingCycle === 'yearly' 
                    ? 'bg-gold-500 text-navy-950' 
                    : 'text-muted hover:text-white'
                )}
              >
                {language === 'es' ? 'Anual' : 'Yearly'}
                <span className={cn(
                  'px-2 py-0.5 text-xs rounded-full',
                  billingCycle === 'yearly'
                    ? 'bg-navy-950/20 text-navy-950'
                    : 'bg-emerald-500/10 text-emerald-400'
                )}>
                  -20%
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Section Pricing */}
            <div className="rounded-2xl bg-navy-900/50 border border-border p-8">
              <h3 className="font-display text-xl font-semibold text-white mb-2">
                {language === 'es' ? 'Por Sección' : 'Per Section'}
              </h3>
              <p className="text-muted text-sm mb-6">
                {language === 'es' ? 'Activa solo las que necesitas' : 'Activate only what you need'}
              </p>
              
              <div className="space-y-4">
                {[
                  { name: language === 'es' ? 'Aviones' : 'Planes', icon: Plane, color: 'gold' },
                  { name: language === 'es' ? 'Helicópteros' : 'Helicopters', icon: Navigation2, color: 'emerald' },
                  { name: language === 'es' ? 'Residencias' : 'Residences', icon: Building2, color: 'blue' },
                  { name: language === 'es' ? 'Embarcaciones' : 'Boats', icon: Anchor, color: 'purple' },
                ].map((section, index) => {
                  const price = billingCycle === 'yearly' 
                    ? Math.round(99 * (1 - yearlyDiscount)) 
                    : 99;
                  return (
                    <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-navy-800/50 border border-border">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center',
                          section.color === 'gold' && 'bg-gold-500/10',
                          section.color === 'emerald' && 'bg-emerald-500/10',
                          section.color === 'blue' && 'bg-blue-500/10',
                          section.color === 'purple' && 'bg-purple-500/10',
                        )}>
                          <section.icon className={cn(
                            'w-5 h-5',
                            section.color === 'gold' && 'text-gold-500',
                            section.color === 'emerald' && 'text-emerald-400',
                            section.color === 'blue' && 'text-blue-400',
                            section.color === 'purple' && 'text-purple-400',
                          )} />
                        </div>
                        <span className="text-white font-medium">{section.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-display font-bold text-white">${price}</span>
                        <span className="text-muted text-sm">/{language === 'es' ? 'mes' : 'mo'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Seat Pricing */}
            <div className="rounded-2xl bg-navy-900/50 border border-border p-8">
              <h3 className="font-display text-xl font-semibold text-white mb-2">
                {language === 'es' ? 'Usuarios por Organización' : 'Users per Organization'}
              </h3>
              <p className="text-muted text-sm mb-6">
                {language === 'es' ? '5 usuarios incluidos gratis' : '5 users included for free'}
              </p>
              
              <div className="space-y-4">
                {seatPricing.map((tier, index) => {
                  const price = billingCycle === 'yearly' && tier.price > 0
                    ? Math.round(tier.price * (1 - yearlyDiscount)) 
                    : tier.price;
                  return (
                    <div key={index} className={cn(
                      'flex items-center justify-between p-4 rounded-xl border',
                      index === 0 
                        ? 'bg-gold-500/5 border-gold-500/20' 
                        : 'bg-navy-800/50 border-border'
                    )}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-navy-700/50 flex items-center justify-center">
                          <Users className="w-5 h-5 text-muted" />
                        </div>
                        <span className="text-white font-medium">{tier.seats} {language === 'es' ? 'usuarios' : 'users'}</span>
                        {index === 0 && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-gold-500/10 text-gold-500 border border-gold-500/20">
                            {language === 'es' ? 'Incluido' : 'Included'}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        {price === 0 ? (
                          <span className="text-emerald-400 font-medium">{language === 'es' ? 'Gratis' : 'Free'}</span>
                        ) : (
                          <>
                            <span className="text-2xl font-display font-bold text-white">+${price}</span>
                            <span className="text-muted text-sm">/{language === 'es' ? 'mes' : 'mo'}</span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12 text-center">
            <Link href="/signup">
              <Button size="xl" className="group">
                {language === 'es' ? 'Comenzar Prueba Gratis de 14 Días' : 'Start 14-Day Free Trial'}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <p className="text-subtle text-sm mt-4">
              {language === 'es' ? 'Sin tarjeta de crédito requerida' : 'No credit card required'}
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-navy-900/50 border-y border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/20 mb-4">
              <Star className="w-4 h-4 text-gold-500" />
              <span className="text-gold-500 text-xs font-medium uppercase tracking-wider">
                {language === 'es' ? 'Testimonios' : 'Testimonials'}
              </span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl text-white mb-4">
              {language === 'es' ? 'Lo que Dicen Nuestros Clientes' : 'What Our Clients Say'}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="p-8 rounded-2xl bg-navy-900/50 border border-border relative">
                <div className="absolute top-6 right-6 opacity-10">
                  <svg className="w-12 h-12 text-gold-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>
                </div>
                <div className="flex gap-1 mb-4">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className="w-4 h-4 text-gold-500 fill-current" />
                  ))}
                </div>
                <p className="text-white mb-6 italic">"{testimonial.quote}"</p>
                <div>
                  <p className="text-white font-semibold">{testimonial.author}</p>
                  <p className="text-muted text-sm">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/20 mb-4">
              <span className="text-gold-500 text-xs font-medium uppercase tracking-wider">
                FAQ
              </span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl text-white mb-4">
              {language === 'es' ? 'Preguntas Frecuentes' : 'Frequently Asked Questions'}
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index}
                className="rounded-xl border border-border overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left bg-navy-900/50 hover:bg-navy-800/50 transition-colors"
                >
                  <span className="text-white font-medium pr-4">{faq.question}</span>
                  <ChevronDown className={cn(
                    'w-5 h-5 text-gold-500 flex-shrink-0 transition-transform',
                    openFaq === index && 'rotate-180'
                  )} />
                </button>
                {openFaq === index && (
                  <div className="p-6 pt-0 bg-navy-900/50">
                    <p className="text-muted">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-gold-500/10 via-transparent to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gold-500/5 rounded-full blur-3xl" />
        
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-500/10 border border-gold-500/20 mb-8">
            <Crown className="w-4 h-4 text-gold-500" />
            <span className="text-gold-500 text-sm font-medium">
              {language === 'es' ? 'Comienza Hoy' : 'Start Today'}
            </span>
          </div>
          
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-white mb-6">
            {language === 'es' ? '¿Listo para Optimizar tus Activos?' : 'Ready to Streamline Your Assets?'}
          </h2>
          <p className="text-muted text-lg mb-10 max-w-xl mx-auto">
            {language === 'es'
              ? 'Únete a familias y organizaciones exigentes que confían en ReservePTY para gestionar sus activos más valiosos.'
              : 'Join discerning families and organizations who trust ReservePTY to manage their most valuable assets.'}
          </p>
          
          <Link href="/signup">
            <Button size="xl" className="group">
              {language === 'es' ? 'Inicia tu Prueba Gratis' : 'Start Your Free Trial'}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          
          <div className="flex items-center justify-center gap-8 mt-12 text-sm text-muted">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{language === 'es' ? '14 días gratis' : '14 days free'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{language === 'es' ? 'Sin tarjeta' : 'No card required'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{language === 'es' ? 'Cancela cuando quieras' : 'Cancel anytime'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t border-border bg-navy-900/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gold-500 rounded-lg flex items-center justify-center">
                  <span className="text-navy-950 font-display font-bold text-xl">R</span>
                </div>
                <span className="font-display text-2xl font-semibold text-white">
                  Reserve<span className="text-gold-500">PTY</span>
                </span>
              </div>
              <p className="text-muted max-w-sm mb-6">
                {language === 'es'
                  ? 'Plataforma premium para la gestión de activos de lujo. Diseñada para family offices y propietarios exigentes.'
                  : 'Premium platform for luxury asset management. Built for family offices and discerning asset owners.'}
              </p>
              <div className="flex items-center gap-4">
                <span className="text-subtle text-sm">
                  © {new Date().getFullYear()} ReservePTY
                </span>
              </div>
            </div>
            
            {/* Quick Links */}
            <div>
              <h4 className="font-display font-semibold text-white mb-4">
                {language === 'es' ? 'Plataforma' : 'Platform'}
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link href="#features" className="text-muted hover:text-white transition-colors text-sm">
                    {language === 'es' ? 'Características' : 'Features'}
                  </Link>
                </li>
                <li>
                  <Link href="#pricing" className="text-muted hover:text-white transition-colors text-sm">
                    {language === 'es' ? 'Precios' : 'Pricing'}
                  </Link>
                </li>
                <li>
                  <Link href="#how-it-works" className="text-muted hover:text-white transition-colors text-sm">
                    {language === 'es' ? 'Cómo Funciona' : 'How It Works'}
                  </Link>
                </li>
                <li>
                  <Link href="#faq" className="text-muted hover:text-white transition-colors text-sm">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* Legal */}
            <div>
              <h4 className="font-display font-semibold text-white mb-4">
                {language === 'es' ? 'Legal' : 'Legal'}
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/privacy" className="text-muted hover:text-white transition-colors text-sm">
                    {language === 'es' ? 'Privacidad' : 'Privacy Policy'}
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-muted hover:text-white transition-colors text-sm">
                    {language === 'es' ? 'Términos de Servicio' : 'Terms of Service'}
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-muted hover:text-white transition-colors text-sm">
                    {language === 'es' ? 'Contacto' : 'Contact'}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-subtle text-sm">
              {language === 'es' ? 'Todos los derechos reservados.' : 'All rights reserved.'}
            </p>
            <div className="flex items-center gap-6">
              <span className="text-subtle text-xs flex items-center gap-2">
                <Lock className="w-3 h-3" />
                {language === 'es' ? 'Datos seguros con encriptación SSL' : 'Data secured with SSL encryption'}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
