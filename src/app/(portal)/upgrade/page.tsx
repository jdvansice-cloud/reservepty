'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth/auth-provider';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Crown,
  Check,
  ArrowLeft,
  Plane,
  Navigation,
  Home,
  Ship,
  Users,
  Calendar,
  Shield,
  Zap,
  Clock,
  Loader2,
} from 'lucide-react';

const SECTIONS = {
  planes: { icon: Plane, label: { es: 'Aviones', en: 'Planes' }, price: 99 },
  helicopters: { icon: Navigation, label: { es: 'Helicópteros', en: 'Helicopters' }, price: 99 },
  residences: { icon: Home, label: { es: 'Residencias', en: 'Residences' }, price: 79 },
  watercraft: { icon: Ship, label: { es: 'Embarcaciones', en: 'Watercraft' }, price: 89 },
};

const SEAT_TIERS = [
  { seats: 5, discount: 0 },
  { seats: 10, discount: 0.05 },
  { seats: 25, discount: 0.10 },
  { seats: 50, discount: 0.15 },
  { seats: 100, discount: 0.20 },
];

export default function UpgradePage() {
  const router = useRouter();
  const { organization, subscription, membership } = useAuth();
  const { language, t } = useLanguage();
  
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [selectedSeats, setSelectedSeats] = useState(5);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const isOwner = membership?.role === 'owner';
  
  // Calculate trial days remaining
  const trialDaysLeft = subscription?.trial_ends_at 
    ? Math.max(0, Math.ceil((new Date(subscription.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  // Calculate pricing
  const seatTier = SEAT_TIERS.find(t => t.seats === selectedSeats) || SEAT_TIERS[0];
  const basePrice = selectedSections.reduce((sum, section) => {
    return sum + (SECTIONS[section as keyof typeof SECTIONS]?.price || 0);
  }, 0);
  
  const yearlyDiscount = billingCycle === 'yearly' ? 0.15 : 0;
  const seatDiscount = seatTier.discount;
  const totalDiscount = yearlyDiscount + seatDiscount;
  
  const monthlyPrice = basePrice * (1 - totalDiscount);
  const displayPrice = billingCycle === 'yearly' ? monthlyPrice * 12 : monthlyPrice;

  const toggleSection = (section: string) => {
    if (selectedSections.includes(section)) {
      setSelectedSections(selectedSections.filter(s => s !== section));
    } else {
      setSelectedSections([...selectedSections, section]);
    }
  };

  const handleUpgrade = async () => {
    if (selectedSections.length === 0) return;
    
    setIsProcessing(true);
    
    // TODO: Integrate with payment provider (Tilopay)
    // For now, just show a confirmation
    setTimeout(() => {
      setIsProcessing(false);
      // This would redirect to payment flow
      alert(language === 'es' 
        ? 'Integración de pago próximamente. Contacte a soporte para activar su suscripción.'
        : 'Payment integration coming soon. Contact support to activate your subscription.');
    }, 1000);
  };

  const features = [
    { icon: Calendar, text: language === 'es' ? 'Calendario unificado' : 'Unified calendar' },
    { icon: Users, text: language === 'es' ? 'Gestión de miembros y niveles' : 'Member & tier management' },
    { icon: Shield, text: language === 'es' ? 'Flujo de aprobaciones' : 'Approval workflows' },
    { icon: Zap, text: language === 'es' ? 'Notificaciones en tiempo real' : 'Real-time notifications' },
  ];

  return (
    <div className="min-h-screen bg-navy-950 pb-24 lg:pb-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 text-muted hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {language === 'es' ? 'Volver al panel' : 'Back to dashboard'}
        </Link>

        {/* Trial banner */}
        {subscription?.status === 'trial' && trialDaysLeft > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-gold-500/10 border border-gold-500/20">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-gold-400" />
              <div>
                <p className="text-gold-400 font-medium">
                  {language === 'es' 
                    ? `Te quedan ${trialDaysLeft} ${trialDaysLeft === 1 ? 'día' : 'días'} de prueba gratuita`
                    : `You have ${trialDaysLeft} ${trialDaysLeft === 1 ? 'day' : 'days'} left in your free trial`}
                </p>
                <p className="text-sm text-muted">
                  {language === 'es' 
                    ? 'Actualiza ahora para mantener el acceso a todas las funciones'
                    : 'Upgrade now to keep access to all features'}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gold-500/20 mb-4">
            <Crown className="w-8 h-8 text-gold-500" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">
            {language === 'es' ? 'Actualiza tu Plan' : 'Upgrade Your Plan'}
          </h1>
          <p className="text-muted max-w-xl mx-auto">
            {language === 'es' 
              ? 'Selecciona las secciones que necesitas y el número de usuarios para tu organización'
              : 'Select the sections you need and the number of users for your organization'}
          </p>
        </div>
      </div>

      {/* Pricing options */}
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        {/* Billing cycle toggle */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={cn(
                  "px-6 py-3 rounded-xl text-sm font-medium transition-all",
                  billingCycle === 'monthly'
                    ? "bg-gold-500 text-navy-950"
                    : "bg-surface text-muted hover:text-white"
                )}
              >
                {language === 'es' ? 'Mensual' : 'Monthly'}
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={cn(
                  "px-6 py-3 rounded-xl text-sm font-medium transition-all relative",
                  billingCycle === 'yearly'
                    ? "bg-gold-500 text-navy-950"
                    : "bg-surface text-muted hover:text-white"
                )}
              >
                {language === 'es' ? 'Anual' : 'Yearly'}
                <span className="absolute -top-2 -right-2 px-2 py-0.5 text-[10px] font-bold bg-emerald-500 text-white rounded-full">
                  -15%
                </span>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Section selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {language === 'es' ? 'Selecciona Secciones' : 'Select Sections'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(SECTIONS).map(([key, section]) => {
                const isSelected = selectedSections.includes(key);
                const Icon = section.icon;
                return (
                  <button
                    key={key}
                    onClick={() => toggleSection(key)}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all text-left",
                      isSelected
                        ? "bg-gold-500/10 border-gold-500/50"
                        : "bg-surface border-border hover:border-gold-500/30"
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        isSelected ? "bg-gold-500/20" : "bg-navy-800"
                      )}>
                        <Icon className={cn("w-5 h-5", isSelected ? "text-gold-500" : "text-muted")} />
                      </div>
                      {isSelected && (
                        <Check className="w-5 h-5 text-gold-500" />
                      )}
                    </div>
                    <p className={cn("font-medium text-sm", isSelected ? "text-white" : "text-muted")}>
                      {section.label[language]}
                    </p>
                    <p className="text-xs text-muted mt-1">
                      ${section.price}/{language === 'es' ? 'mes' : 'mo'}
                    </p>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Seat selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {language === 'es' ? 'Número de Usuarios' : 'Number of Users'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="flex flex-wrap gap-3">
              {SEAT_TIERS.map((tier) => (
                <button
                  key={tier.seats}
                  onClick={() => setSelectedSeats(tier.seats)}
                  className={cn(
                    "px-4 py-3 rounded-xl border-2 transition-all min-w-[80px]",
                    selectedSeats === tier.seats
                      ? "bg-gold-500/10 border-gold-500/50"
                      : "bg-surface border-border hover:border-gold-500/30"
                  )}
                >
                  <p className={cn("font-bold", selectedSeats === tier.seats ? "text-white" : "text-muted")}>
                    {tier.seats}
                  </p>
                  <p className="text-xs text-muted">
                    {language === 'es' ? 'usuarios' : 'users'}
                  </p>
                  {tier.discount > 0 && (
                    <p className="text-[10px] text-emerald-400 mt-1">
                      -{tier.discount * 100}%
                    </p>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {language === 'es' ? 'Incluido en Todos los Planes' : 'Included in All Plans'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="grid grid-cols-2 gap-4">
              {features.map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gold-500/10 flex items-center justify-center">
                    <feature.icon className="w-4 h-4 text-gold-500" />
                  </div>
                  <span className="text-sm text-muted">{feature.text}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pricing summary */}
        <Card className="border-gold-500/30">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-sm text-muted mb-1">
                  {billingCycle === 'yearly' 
                    ? (language === 'es' ? 'Total anual' : 'Yearly total')
                    : (language === 'es' ? 'Total mensual' : 'Monthly total')}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-display font-bold text-white">
                    ${displayPrice.toFixed(2)}
                  </span>
                  <span className="text-muted">
                    /{billingCycle === 'yearly' ? (language === 'es' ? 'año' : 'year') : (language === 'es' ? 'mes' : 'month')}
                  </span>
                </div>
                {totalDiscount > 0 && (
                  <p className="text-sm text-emerald-400 mt-1">
                    {language === 'es' ? 'Ahorro de' : 'Saving'} {(totalDiscount * 100).toFixed(0)}%
                  </p>
                )}
              </div>
              
              <Button
                size="lg"
                onClick={handleUpgrade}
                disabled={selectedSections.length === 0 || isProcessing || !isOwner}
                className="w-full md:w-auto min-w-[200px]"
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {language === 'es' ? 'Procesando...' : 'Processing...'}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Crown className="w-4 h-4" />
                    {language === 'es' ? 'Confirmar y Pagar' : 'Confirm & Pay'}
                  </span>
                )}
              </Button>
            </div>
            
            {!isOwner && (
              <p className="text-sm text-amber-400 mt-4">
                {language === 'es' 
                  ? 'Solo el propietario de la organización puede actualizar el plan.'
                  : 'Only the organization owner can upgrade the plan.'}
              </p>
            )}
            
            {selectedSections.length === 0 && (
              <p className="text-sm text-muted mt-4">
                {language === 'es' 
                  ? 'Selecciona al menos una sección para continuar.'
                  : 'Select at least one section to continue.'}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Support note */}
        <p className="text-center text-sm text-muted pb-4">
          {language === 'es' 
            ? '¿Necesitas ayuda? Contáctanos en soporte@reservepty.com'
            : 'Need help? Contact us at support@reservepty.com'}
        </p>
      </div>
    </div>
  );
}
