'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { cn, SECTIONS, SEAT_TIERS } from '@/lib/utils';
import { createBrowserClient } from '@supabase/ssr';
import { useAuth } from '@/components/auth/auth-provider';
import { 
  Plane, Ship, Home, Navigation2, 
  ChevronRight, ChevronLeft, Check, 
  Building2, Zap, AlertCircle, Loader2
} from 'lucide-react';

type Step = 'company' | 'sections' | 'seats' | 'payment';

const SECTION_ICONS = {
  planes: Plane,
  helicopters: Navigation2,
  residences: Home,
  boats: Ship,
};

export default function OnboardingPage() {
  const router = useRouter();
  const { user, session, isLoading: authLoading } = useAuth();
  
  // Create Supabase client directly
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  // ALL HOOKS MUST BE AT THE TOP - before any conditional returns
  const [currentStep, setCurrentStep] = useState<Step>('company');
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [companyData, setCompanyData] = useState({
    legalName: '',
    commercialName: '',
    ruc: '',
    dv: '',
    billingEmail: '',
  });
  
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<number>(10);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/onboarding');
    }
  }, [user, authLoading, router]);

  const steps: { id: Step; label: string }[] = [
    { id: 'company', label: 'Company Info' },
    { id: 'sections', label: 'Select Sections' },
    { id: 'seats', label: 'Choose Plan' },
    { id: 'payment', label: 'Payment' },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gold-500 mx-auto mb-4" />
          <p className="text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render onboarding if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gold-500 mx-auto mb-4" />
          <p className="text-muted">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
    }
  };

  const toggleSection = (section: string) => {
    setSelectedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  const handleComplete = async () => {
    if (!user) {
      toast({
        title: 'Not authenticated',
        description: 'Please sign in first.',
        variant: 'error',
      });
      return;
    }

    if (selectedSections.length === 0) {
      toast({
        title: 'No sections selected',
        description: 'Please select at least one section.',
        variant: 'error',
      });
      return;
    }

    setIsLoading(true);

    try {
      const accessToken = session?.access_token;
      
      if (!accessToken) {
        throw new Error('No access token available');
      }

      // Create organization
      const orgResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/organizations`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${accessToken}`,
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({
            legal_name: companyData.legalName,
            commercial_name: companyData.commercialName || null,
            ruc: companyData.ruc || null,
            dv: companyData.dv || null,
            billing_email: companyData.billingEmail || user.email,
          }),
        }
      );
      
      if (!orgResponse.ok) {
        const errorText = await orgResponse.text();
        throw new Error(errorText);
      }
      
      const orgArray = await orgResponse.json();
      const org = orgArray[0];

      // Create organization member (owner)
      const memberResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/organization_members`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            organization_id: org.id,
            user_id: user.id,
            role: 'owner',
          }),
        }
      );
      
      if (!memberResponse.ok) {
        const errorText = await memberResponse.text();
        throw new Error(errorText);
      }

      // Calculate trial end date (14 days from now)
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14);

      // Create subscription with trial status
      const subResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/subscriptions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${accessToken}`,
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({
            organization_id: org.id,
            status: 'trial',
            billing_cycle: billingCycle,
            seat_limit: selectedSeats,
            trial_ends_at: trialEndsAt.toISOString(),
            current_period_start: new Date().toISOString(),
            current_period_end: trialEndsAt.toISOString(),
          }),
        }
      );

      if (!subResponse.ok) {
        const errorText = await subResponse.text();
        throw new Error(errorText);
      }
      
      const subArray = await subResponse.json();
      const sub = subArray[0];

      // Create entitlements for selected sections
      const entitlements = selectedSections.map((section) => ({
        subscription_id: sub.id,
        section,
        is_active: true,
      }));

      const entResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/entitlements`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify(entitlements),
        }
      );

      if (!entResponse.ok) {
        const errorText = await entResponse.text();
        throw new Error(errorText);
      }

      // Create default tiers
      const defaultTiers = [
        { name: 'Principals', priority: 1, color: '#c8b273' },
        { name: 'Family', priority: 2, color: '#22c55e' },
        { name: 'Staff', priority: 3, color: '#3b82f6' },
      ];

      for (const tier of defaultTiers) {
        const tierResponse = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/tiers`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              'Authorization': `Bearer ${accessToken}`,
              'Prefer': 'return=representation',
            },
            body: JSON.stringify({
              organization_id: org.id,
              name: tier.name,
              priority: tier.priority,
              color: tier.color,
            }),
          }
        );

        if (!tierResponse.ok) {
          const errorText = await tierResponse.text();
          throw new Error(errorText);
        }
        
        const tierArray = await tierResponse.json();
        const tierData = tierArray[0];

        // Create tier rules
        await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/tier_rules`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              tier_id: tierData.id,
              requires_approval: tier.priority > 1,
              max_days_per_month: tier.priority === 1 ? null : 30 - (tier.priority * 5),
              min_lead_time_hours: tier.priority * 24,
            }),
          }
        );
      }

      toast({
        title: 'Welcome to ReservePTY! 🎉',
        description: 'Your 14-day free trial has started.',
        variant: 'success',
      });

      window.location.href = '/dashboard';
    } catch (error: any) {
      console.error('Onboarding error:', error);
      toast({
        title: 'Setup failed',
        description: error.message || 'An error occurred during setup.',
        variant: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-950">
      {/* Header */}
      <header className="border-b border-border bg-navy-900/50 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gold-500 rounded-lg flex items-center justify-center">
              <span className="text-navy-950 font-display font-bold text-lg">R</span>
            </div>
            <span className="font-display text-xl font-semibold text-white">
              Reserve<span className="text-gold-500">PTY</span>
            </span>
          </Link>
        </div>
      </header>

      {/* Progress */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-12">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                    index < currentStepIndex
                      ? 'bg-gold-500 text-navy-950'
                      : index === currentStepIndex
                      ? 'bg-gold-500/20 border-2 border-gold-500 text-gold-500'
                      : 'bg-surface border border-border text-muted'
                  )}
                >
                  {index < currentStepIndex ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={cn(
                    'mt-2 text-sm',
                    index <= currentStepIndex ? 'text-white' : 'text-muted'
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'w-24 h-0.5 mx-4',
                    index < currentStepIndex ? 'bg-gold-500' : 'bg-border'
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="max-w-2xl mx-auto">
          {/* Step 1: Company Info */}
          {currentStep === 'company' && (
            <div className="animate-fade-up">
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-gold-500" />
                </div>
                <h2 className="font-display text-2xl font-semibold text-white mb-2">
                  Tell us about your organization
                </h2>
                <p className="text-muted">
                  This information will be used for billing and identification.
                </p>
              </div>

              <Card>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="legalName">Legal Name *</Label>
                    <Input
                      id="legalName"
                      placeholder="Acme Holdings, S.A."
                      value={companyData.legalName}
                      onChange={(e) => setCompanyData({ ...companyData, legalName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="commercialName">Commercial Name</Label>
                    <Input
                      id="commercialName"
                      placeholder="Acme Group"
                      value={companyData.commercialName}
                      onChange={(e) => setCompanyData({ ...companyData, commercialName: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ruc">RUC</Label>
                      <Input
                        id="ruc"
                        placeholder="123456-7"
                        value={companyData.ruc}
                        onChange={(e) => setCompanyData({ ...companyData, ruc: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dv">DV</Label>
                      <Input
                        id="dv"
                        placeholder="89"
                        value={companyData.dv}
                        onChange={(e) => setCompanyData({ ...companyData, dv: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="billingEmail">Billing Email *</Label>
                    <Input
                      id="billingEmail"
                      type="email"
                      placeholder="billing@company.com"
                      value={companyData.billingEmail}
                      onChange={(e) => setCompanyData({ ...companyData, billingEmail: e.target.value })}
                      required
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 2: Select Sections */}
          {currentStep === 'sections' && (
            <div className="animate-fade-up">
              <div className="text-center mb-8">
                <h2 className="font-display text-2xl font-semibold text-white mb-2">
                  Select your asset sections
                </h2>
                <p className="text-muted">
                  Choose which types of assets you want to manage. You can add more later.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {Object.entries(SECTIONS).map(([key, section]) => {
                  const Icon = SECTION_ICONS[key as keyof typeof SECTION_ICONS];
                  const isSelected = selectedSections.includes(key);

                  return (
                    <button
                      key={key}
                      onClick={() => toggleSection(key)}
                      className={cn(
                        'p-6 rounded-xl border text-left transition-all',
                        isSelected
                          ? 'bg-gold-500/10 border-gold-500/50 shadow-glow'
                          : 'bg-surface border-border hover:border-gold-500/30'
                      )}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div
                          className={cn(
                            'w-12 h-12 rounded-xl flex items-center justify-center',
                            isSelected ? 'bg-gold-500/20' : 'bg-navy-800'
                          )}
                          style={{ borderColor: isSelected ? section.color : undefined }}
                        >
                          <Icon
                            className="w-6 h-6"
                            style={{ color: isSelected ? section.color : '#8899aa' }}
                          />
                        </div>
                        <div
                          className={cn(
                            'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
                            isSelected
                              ? 'bg-gold-500 border-gold-500'
                              : 'border-border'
                          )}
                        >
                          {isSelected && <Check className="w-4 h-4 text-navy-950" />}
                        </div>
                      </div>
                      <h3 className="font-display text-lg font-semibold text-white mb-1">
                        {section.label}
                      </h3>
                      <p className="text-sm text-muted">{section.description}</p>
                    </button>
                  );
                })}
              </div>

              {selectedSections.length === 0 && (
                <div className="mt-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-200">
                    Please select at least one section to continue.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Choose Plan */}
          {currentStep === 'seats' && (
            <div className="animate-fade-up">
              <div className="text-center mb-8">
                <h2 className="font-display text-2xl font-semibold text-white mb-2">
                  Choose your plan
                </h2>
                <p className="text-muted">
                  Select the number of seats and billing cycle that works for you.
                </p>
              </div>

              {/* Billing cycle toggle */}
              <div className="flex items-center justify-center gap-4 mb-8">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={cn(
                    'px-6 py-3 rounded-lg font-medium transition-all',
                    billingCycle === 'monthly'
                      ? 'bg-gold-500 text-navy-950'
                      : 'bg-surface border border-border text-muted hover:text-white'
                  )}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={cn(
                    'px-6 py-3 rounded-lg font-medium transition-all relative',
                    billingCycle === 'yearly'
                      ? 'bg-gold-500 text-navy-950'
                      : 'bg-surface border border-border text-muted hover:text-white'
                  )}
                >
                  Yearly
                  <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-emerald-500 text-navy-950 text-xs font-bold">
                    -20%
                  </span>
                </button>
              </div>

              {/* Seat options */}
              <div className="grid grid-cols-5 gap-3">
                {SEAT_TIERS.map((seats) => (
                  <button
                    key={seats}
                    onClick={() => setSelectedSeats(seats)}
                    className={cn(
                      'p-4 rounded-xl border text-center transition-all',
                      selectedSeats === seats
                        ? 'bg-gold-500/10 border-gold-500/50 shadow-glow'
                        : 'bg-surface border-border hover:border-gold-500/30'
                    )}
                  >
                    <div className="font-display text-2xl font-bold text-white mb-1">
                      {seats}
                    </div>
                    <div className="text-xs text-muted">seats</div>
                  </button>
                ))}
              </div>

              {/* Summary */}
              <Card className="mt-8">
                <CardContent className="p-6">
                  <h3 className="font-display text-lg font-semibold text-white mb-4">
                    Plan Summary
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted">Sections</span>
                      <span className="text-white">
                        {selectedSections.length > 0
                          ? selectedSections.map((s) => SECTIONS[s as keyof typeof SECTIONS].label).join(', ')
                          : 'None selected'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted">Seats</span>
                      <span className="text-white">{selectedSeats} users</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted">Billing</span>
                      <span className="text-white capitalize">{billingCycle}</span>
                    </div>
                    <div className="border-t border-border pt-3 mt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-muted">Estimated total</span>
                        <span className="font-display text-xl font-bold text-gold-500">
                          Contact for pricing
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 4: Payment */}
          {currentStep === 'payment' && (
            <div className="animate-fade-up">
              <div className="text-center mb-8">
                <h2 className="font-display text-2xl font-semibold text-white mb-2">
                  Complete your setup
                </h2>
                <p className="text-muted">
                  Start your 14-day free trial. No credit card required.
                </p>
              </div>

              <Card>
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
                    <Zap className="w-8 h-8 text-gold-500" />
                  </div>
                  <h3 className="font-display text-xl font-semibold text-white mb-2">
                    14-Day Free Trial
                  </h3>
                  <p className="text-muted mb-6">
                    Get full access to all selected sections with {selectedSeats} seats.
                    No payment required during trial period.
                  </p>
                  
                  {/* Summary */}
                  <div className="bg-navy-800/50 rounded-lg p-4 mb-6 text-left">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted">Organization</span>
                        <span className="text-white">{companyData.legalName || companyData.commercialName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">Sections</span>
                        <span className="text-white">
                          {selectedSections.map(s => SECTIONS[s as keyof typeof SECTIONS].label).join(', ')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">Seats</span>
                        <span className="text-white">{selectedSeats} users</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">Billing (after trial)</span>
                        <span className="text-white capitalize">{billingCycle}</span>
                      </div>
                    </div>
                  </div>

                  <Button onClick={handleComplete} loading={isLoading} size="lg" className="w-full">
                    Start Free Trial
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                  
                  <p className="text-xs text-muted mt-4">
                    By starting your trial, you agree to our Terms of Service and Privacy Policy.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStepIndex === 0}
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </Button>

            {currentStep !== 'payment' && (
              <Button
                onClick={handleNext}
                disabled={
                  (currentStep === 'company' && !companyData.legalName) ||
                  (currentStep === 'sections' && selectedSections.length === 0)
                }
              >
                Continue
                <ChevronRight className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
