import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plane, Ship, Home, Navigation2, ChevronRight, Shield, Calendar, Users } from 'lucide-react';

export default function LandingPage() {
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
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">
                Get Started
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
            <span className="text-gold-500 text-sm font-medium">Premium Asset Management Platform</span>
          </div>

          {/* Headline */}
          <h1 className="font-display text-display-lg md:text-display-xl text-white mb-6 animate-fade-up delay-100">
            Manage Your{' '}
            <span className="text-gradient-gold">Luxury Assets</span>
            <br />
            With Elegance
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-muted max-w-2xl mx-auto mb-10 animate-fade-up delay-200">
            Coordinate bookings across private aviation, yachts, and exclusive properties. 
            Built for family offices and discerning asset owners.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up delay-300">
            <Link href="/signup">
              <Button size="xl" className="w-full sm:w-auto">
                Start Free Trial
                <ChevronRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary" size="xl" className="w-full sm:w-auto">
                View Demo
              </Button>
            </Link>
          </div>

          {/* Trust indicators */}
          <p className="text-subtle text-sm mt-8 animate-fade-up delay-400">
            14-day free trial • No credit card required • Cancel anytime
          </p>
        </div>
      </section>

      {/* Asset Sections */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-display-sm text-white mb-4">
              One Platform, All Your Assets
            </h2>
            <p className="text-muted text-lg max-w-2xl mx-auto">
              Modular sections let you manage exactly what you need. 
              Activate any combination of asset types.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Planes */}
            <div className="group card-hover p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center group-hover:bg-gold-500/20 transition-colors">
                <Plane className="w-8 h-8 text-gold-500" />
              </div>
              <h3 className="font-display text-xl font-semibold text-white mb-2">Planes</h3>
              <p className="text-muted text-sm">
                Private jets, turboprops, and aircraft with flight routing and ETA calculations
              </p>
            </div>

            {/* Helicopters */}
            <div className="group card-hover p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                <Navigation2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="font-display text-xl font-semibold text-white mb-2">Helicopters</h3>
              <p className="text-muted text-sm">
                Rotorcraft management with helipad directory and flight-hour logging
              </p>
            </div>

            {/* Residences */}
            <div className="group card-hover p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                <Home className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="font-display text-xl font-semibold text-white mb-2">Residences</h3>
              <p className="text-muted text-sm">
                Homes, villas, and meeting spaces with check-in/out management
              </p>
            </div>

            {/* Boats */}
            <div className="group card-hover p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                <Ship className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="font-display text-xl font-semibold text-white mb-2">Boats</h3>
              <p className="text-muted text-sm">
                Yachts and watercraft with port directory and captain coordination
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
              Built for Complexity, Designed for Simplicity
            </h2>
            <p className="text-muted text-lg max-w-2xl mx-auto">
              Advanced features wrapped in an intuitive interface your entire team can use.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8">
              <div className="w-12 h-12 mb-6 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-gold-500" />
              </div>
              <h3 className="font-display text-lg font-semibold text-white mb-3">
                Unified Calendar
              </h3>
              <p className="text-muted">
                See all assets across all categories in one comprehensive view. 
                No more switching between systems.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8">
              <div className="w-12 h-12 mb-6 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-gold-500" />
              </div>
              <h3 className="font-display text-lg font-semibold text-white mb-3">
                Priority Tiers
              </h3>
              <p className="text-muted">
                Define member tiers with booking priority rules. 
                Ensure principals always have first access.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8">
              <div className="w-12 h-12 mb-6 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-gold-500" />
              </div>
              <h3 className="font-display text-lg font-semibold text-white mb-3">
                Secure & Private
              </h3>
              <p className="text-muted">
                Enterprise-grade security with complete data isolation 
                between organizations.
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
            Ready to Streamline Your Assets?
          </h2>
          <p className="text-muted text-lg mb-10">
            Join discerning families and organizations who trust ReservePTY 
            to manage their most valuable assets.
          </p>
          <Link href="/signup">
            <Button size="xl">
              Start Your Free Trial
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
              © {new Date().getFullYear()} ReservePTY. All rights reserved.
            </p>
            
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-muted hover:text-white text-sm transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="text-muted hover:text-white text-sm transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
