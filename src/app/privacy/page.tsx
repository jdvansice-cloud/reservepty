'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPage() {
  const { language } = useLanguage();

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

      <div className="pt-24 pb-16 px-6">
        <div className="max-w-3xl mx-auto">
          {/* Back link */}
          <Link href="/" className="inline-flex items-center gap-2 text-muted hover:text-white transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />
            {language === 'es' ? 'Volver al inicio' : 'Back to home'}
          </Link>

          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-gold-500" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-semibold text-white">
                {language === 'es' ? 'Política de Privacidad' : 'Privacy Policy'}
              </h1>
              <p className="text-muted text-sm">
                {language === 'es' ? 'Última actualización: Diciembre 2024' : 'Last updated: December 2024'}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-invert max-w-none">
            <div className="space-y-8">
              <section className="card p-6">
                <h2 className="font-display text-xl font-semibold text-white mb-4">
                  {language === 'es' ? '1. Información que Recopilamos' : '1. Information We Collect'}
                </h2>
                <p className="text-muted mb-4">
                  {language === 'es'
                    ? 'Recopilamos información que usted nos proporciona directamente cuando utiliza nuestra plataforma:'
                    : 'We collect information you provide directly when using our platform:'}
                </p>
                <ul className="list-disc list-inside text-muted space-y-2">
                  <li>{language === 'es' ? 'Información de cuenta (nombre, email, teléfono)' : 'Account information (name, email, phone)'}</li>
                  <li>{language === 'es' ? 'Información de la organización (nombre comercial, RUC)' : 'Organization information (business name, tax ID)'}</li>
                  <li>{language === 'es' ? 'Datos de activos y reservas' : 'Asset and booking data'}</li>
                  <li>{language === 'es' ? 'Información de facturación y pagos' : 'Billing and payment information'}</li>
                </ul>
              </section>

              <section className="card p-6">
                <h2 className="font-display text-xl font-semibold text-white mb-4">
                  {language === 'es' ? '2. Uso de la Información' : '2. How We Use Information'}
                </h2>
                <p className="text-muted mb-4">
                  {language === 'es'
                    ? 'Utilizamos la información recopilada para:'
                    : 'We use the collected information to:'}
                </p>
                <ul className="list-disc list-inside text-muted space-y-2">
                  <li>{language === 'es' ? 'Proporcionar y mantener nuestros servicios' : 'Provide and maintain our services'}</li>
                  <li>{language === 'es' ? 'Procesar transacciones y enviar notificaciones' : 'Process transactions and send notifications'}</li>
                  <li>{language === 'es' ? 'Mejorar y personalizar la experiencia del usuario' : 'Improve and personalize user experience'}</li>
                  <li>{language === 'es' ? 'Comunicarnos con usted sobre actualizaciones' : 'Communicate with you about updates'}</li>
                </ul>
              </section>

              <section className="card p-6">
                <h2 className="font-display text-xl font-semibold text-white mb-4">
                  {language === 'es' ? '3. Seguridad de Datos' : '3. Data Security'}
                </h2>
                <p className="text-muted">
                  {language === 'es'
                    ? 'Implementamos medidas de seguridad de nivel empresarial para proteger su información, incluyendo encriptación TLS 1.3 en tránsito, encriptación AES-256 en reposo, y aislamiento completo de datos entre organizaciones.'
                    : 'We implement enterprise-grade security measures to protect your information, including TLS 1.3 encryption in transit, AES-256 encryption at rest, and complete data isolation between organizations.'}
                </p>
              </section>

              <section className="card p-6">
                <h2 className="font-display text-xl font-semibold text-white mb-4">
                  {language === 'es' ? '4. Compartir Información' : '4. Information Sharing'}
                </h2>
                <p className="text-muted">
                  {language === 'es'
                    ? 'No vendemos ni compartimos su información personal con terceros, excepto cuando sea necesario para proporcionar nuestros servicios (como procesadores de pago) o cuando la ley lo requiera.'
                    : 'We do not sell or share your personal information with third parties, except when necessary to provide our services (such as payment processors) or when required by law.'}
                </p>
              </section>

              <section className="card p-6">
                <h2 className="font-display text-xl font-semibold text-white mb-4">
                  {language === 'es' ? '5. Sus Derechos' : '5. Your Rights'}
                </h2>
                <p className="text-muted mb-4">
                  {language === 'es'
                    ? 'Usted tiene derecho a:'
                    : 'You have the right to:'}
                </p>
                <ul className="list-disc list-inside text-muted space-y-2">
                  <li>{language === 'es' ? 'Acceder a sus datos personales' : 'Access your personal data'}</li>
                  <li>{language === 'es' ? 'Corregir información inexacta' : 'Correct inaccurate information'}</li>
                  <li>{language === 'es' ? 'Solicitar la eliminación de sus datos' : 'Request deletion of your data'}</li>
                  <li>{language === 'es' ? 'Exportar sus datos en formato portable' : 'Export your data in portable format'}</li>
                </ul>
              </section>

              <section className="card p-6">
                <h2 className="font-display text-xl font-semibold text-white mb-4">
                  {language === 'es' ? '6. Contacto' : '6. Contact Us'}
                </h2>
                <p className="text-muted">
                  {language === 'es'
                    ? 'Si tiene preguntas sobre esta política de privacidad, puede contactarnos en privacy@reservepty.com'
                    : 'If you have questions about this privacy policy, you can contact us at privacy@reservepty.com'}
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-subtle text-sm">
            © {new Date().getFullYear()} ReservePTY. {language === 'es' ? 'Todos los derechos reservados.' : 'All rights reserved.'}
          </p>
        </div>
      </footer>
    </div>
  );
}
