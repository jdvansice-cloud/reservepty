'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowLeft, FileText } from 'lucide-react';

export default function TermsPage() {
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
              <FileText className="w-6 h-6 text-gold-500" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-semibold text-white">
                {language === 'es' ? 'Términos de Servicio' : 'Terms of Service'}
              </h1>
              <p className="text-muted text-sm">
                {language === 'es' ? 'Última actualización: Diciembre 2024' : 'Last updated: December 2024'}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-8">
            <section className="card p-6">
              <h2 className="font-display text-xl font-semibold text-white mb-4">
                {language === 'es' ? '1. Aceptación de Términos' : '1. Acceptance of Terms'}
              </h2>
              <p className="text-muted">
                {language === 'es'
                  ? 'Al acceder o utilizar la plataforma ReservePTY, usted acepta estar sujeto a estos términos de servicio. Si no está de acuerdo con estos términos, no utilice nuestros servicios.'
                  : 'By accessing or using the ReservePTY platform, you agree to be bound by these terms of service. If you do not agree to these terms, do not use our services.'}
              </p>
            </section>

            <section className="card p-6">
              <h2 className="font-display text-xl font-semibold text-white mb-4">
                {language === 'es' ? '2. Descripción del Servicio' : '2. Service Description'}
              </h2>
              <p className="text-muted">
                {language === 'es'
                  ? 'ReservePTY es una plataforma SaaS para la gestión de activos de lujo que permite a organizaciones coordinar reservas de aviones, helicópteros, residencias y embarcaciones. El servicio incluye calendario unificado, gestión de miembros, niveles de prioridad y herramientas de coordinación.'
                  : 'ReservePTY is a SaaS platform for luxury asset management that allows organizations to coordinate bookings for planes, helicopters, residences, and boats. The service includes unified calendar, member management, priority tiers, and coordination tools.'}
              </p>
            </section>

            <section className="card p-6">
              <h2 className="font-display text-xl font-semibold text-white mb-4">
                {language === 'es' ? '3. Cuentas y Registro' : '3. Accounts and Registration'}
              </h2>
              <p className="text-muted mb-4">
                {language === 'es'
                  ? 'Para utilizar nuestros servicios, debe:'
                  : 'To use our services, you must:'}
              </p>
              <ul className="list-disc list-inside text-muted space-y-2">
                <li>{language === 'es' ? 'Proporcionar información precisa y completa' : 'Provide accurate and complete information'}</li>
                <li>{language === 'es' ? 'Mantener la seguridad de su cuenta' : 'Maintain the security of your account'}</li>
                <li>{language === 'es' ? 'Ser mayor de 18 años' : 'Be at least 18 years old'}</li>
                <li>{language === 'es' ? 'Tener autoridad para actuar en nombre de su organización' : 'Have authority to act on behalf of your organization'}</li>
              </ul>
            </section>

            <section className="card p-6">
              <h2 className="font-display text-xl font-semibold text-white mb-4">
                {language === 'es' ? '4. Facturación y Pagos' : '4. Billing and Payments'}
              </h2>
              <p className="text-muted mb-4">
                {language === 'es'
                  ? 'Los términos de facturación incluyen:'
                  : 'Billing terms include:'}
              </p>
              <ul className="list-disc list-inside text-muted space-y-2">
                <li>{language === 'es' ? 'Período de prueba gratuito de 14 días' : '14-day free trial period'}</li>
                <li>{language === 'es' ? 'Facturación mensual o anual según su elección' : 'Monthly or annual billing as per your choice'}</li>
                <li>{language === 'es' ? 'Precios basados en secciones activadas y número de usuarios' : 'Pricing based on activated sections and user count'}</li>
                <li>{language === 'es' ? 'Los pagos se procesan a través de proveedores seguros' : 'Payments are processed through secure providers'}</li>
              </ul>
            </section>

            <section className="card p-6">
              <h2 className="font-display text-xl font-semibold text-white mb-4">
                {language === 'es' ? '5. Uso Aceptable' : '5. Acceptable Use'}
              </h2>
              <p className="text-muted mb-4">
                {language === 'es'
                  ? 'Usted acepta no utilizar el servicio para:'
                  : 'You agree not to use the service to:'}
              </p>
              <ul className="list-disc list-inside text-muted space-y-2">
                <li>{language === 'es' ? 'Violar leyes o regulaciones aplicables' : 'Violate applicable laws or regulations'}</li>
                <li>{language === 'es' ? 'Infringir derechos de terceros' : 'Infringe on third-party rights'}</li>
                <li>{language === 'es' ? 'Transmitir malware o código malicioso' : 'Transmit malware or malicious code'}</li>
                <li>{language === 'es' ? 'Intentar acceder sin autorización a sistemas' : 'Attempt unauthorized access to systems'}</li>
              </ul>
            </section>

            <section className="card p-6">
              <h2 className="font-display text-xl font-semibold text-white mb-4">
                {language === 'es' ? '6. Propiedad Intelectual' : '6. Intellectual Property'}
              </h2>
              <p className="text-muted">
                {language === 'es'
                  ? 'Todos los derechos de propiedad intelectual sobre la plataforma ReservePTY, incluyendo software, diseño, marcas y contenido, son propiedad de ReservePTY o sus licenciantes. Usted retiene todos los derechos sobre sus datos.'
                  : 'All intellectual property rights in the ReservePTY platform, including software, design, trademarks, and content, are owned by ReservePTY or its licensors. You retain all rights to your data.'}
              </p>
            </section>

            <section className="card p-6">
              <h2 className="font-display text-xl font-semibold text-white mb-4">
                {language === 'es' ? '7. Limitación de Responsabilidad' : '7. Limitation of Liability'}
              </h2>
              <p className="text-muted">
                {language === 'es'
                  ? 'En la máxima medida permitida por la ley, ReservePTY no será responsable por daños indirectos, incidentales, especiales o consecuentes que resulten del uso o la imposibilidad de usar el servicio.'
                  : 'To the maximum extent permitted by law, ReservePTY shall not be liable for any indirect, incidental, special, or consequential damages arising from the use or inability to use the service.'}
              </p>
            </section>

            <section className="card p-6">
              <h2 className="font-display text-xl font-semibold text-white mb-4">
                {language === 'es' ? '8. Cancelación' : '8. Cancellation'}
              </h2>
              <p className="text-muted">
                {language === 'es'
                  ? 'Puede cancelar su suscripción en cualquier momento desde su panel de control. La cancelación entrará en vigencia al final de su período de facturación actual. No se proporcionan reembolsos por períodos parciales.'
                  : 'You may cancel your subscription at any time from your dashboard. Cancellation will take effect at the end of your current billing period. No refunds are provided for partial periods.'}
              </p>
            </section>

            <section className="card p-6">
              <h2 className="font-display text-xl font-semibold text-white mb-4">
                {language === 'es' ? '9. Modificaciones' : '9. Modifications'}
              </h2>
              <p className="text-muted">
                {language === 'es'
                  ? 'Nos reservamos el derecho de modificar estos términos en cualquier momento. Le notificaremos sobre cambios materiales con al menos 30 días de anticipación. El uso continuado del servicio después de las modificaciones constituye su aceptación de los nuevos términos.'
                  : 'We reserve the right to modify these terms at any time. We will notify you of material changes at least 30 days in advance. Continued use of the service after modifications constitutes your acceptance of the new terms.'}
              </p>
            </section>

            <section className="card p-6">
              <h2 className="font-display text-xl font-semibold text-white mb-4">
                {language === 'es' ? '10. Ley Aplicable' : '10. Governing Law'}
              </h2>
              <p className="text-muted">
                {language === 'es'
                  ? 'Estos términos se regirán e interpretarán de acuerdo con las leyes de la República de Panamá. Cualquier disputa se resolverá en los tribunales competentes de la Ciudad de Panamá.'
                  : 'These terms shall be governed by and construed in accordance with the laws of the Republic of Panama. Any disputes shall be resolved in the competent courts of Panama City.'}
              </p>
            </section>

            <section className="card p-6">
              <h2 className="font-display text-xl font-semibold text-white mb-4">
                {language === 'es' ? '11. Contacto' : '11. Contact'}
              </h2>
              <p className="text-muted">
                {language === 'es'
                  ? 'Para preguntas sobre estos términos de servicio, contáctenos en legal@reservepty.com'
                  : 'For questions about these terms of service, contact us at legal@reservepty.com'}
              </p>
            </section>
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
