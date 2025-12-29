'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowLeft, Mail, MessageSquare, Send, MapPin, Phone, Clock } from 'lucide-react';

export default function ContactPage() {
  const { language } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

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
        <div className="max-w-5xl mx-auto">
          {/* Back link */}
          <Link href="/" className="inline-flex items-center gap-2 text-muted hover:text-white transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />
            {language === 'es' ? 'Volver al inicio' : 'Back to home'}
          </Link>

          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/20 mb-4">
              <MessageSquare className="w-4 h-4 text-gold-500" />
              <span className="text-gold-500 text-xs font-medium uppercase tracking-wider">
                {language === 'es' ? 'Contacto' : 'Contact'}
              </span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-white mb-4">
              {language === 'es' ? 'Hablemos' : 'Let\'s Talk'}
            </h1>
            <p className="text-muted text-lg max-w-xl mx-auto">
              {language === 'es'
                ? '¿Tienes preguntas sobre ReservePTY? Estamos aquí para ayudarte.'
                : 'Have questions about ReservePTY? We\'re here to help.'}
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Contact Info */}
            <div className="space-y-6">
              <div className="card p-6">
                <div className="w-10 h-10 rounded-lg bg-gold-500/10 flex items-center justify-center mb-4">
                  <Mail className="w-5 h-5 text-gold-500" />
                </div>
                <h3 className="font-display font-semibold text-white mb-2">
                  {language === 'es' ? 'Correo Electrónico' : 'Email'}
                </h3>
                <p className="text-muted text-sm mb-2">
                  {language === 'es' ? 'Para consultas generales' : 'For general inquiries'}
                </p>
                <a href="mailto:hello@reservepty.com" className="text-gold-500 hover:text-gold-400 transition-colors">
                  hello@reservepty.com
                </a>
              </div>

              <div className="card p-6">
                <div className="w-10 h-10 rounded-lg bg-gold-500/10 flex items-center justify-center mb-4">
                  <Phone className="w-5 h-5 text-gold-500" />
                </div>
                <h3 className="font-display font-semibold text-white mb-2">
                  {language === 'es' ? 'Teléfono' : 'Phone'}
                </h3>
                <p className="text-muted text-sm mb-2">
                  {language === 'es' ? 'Lunes a Viernes, 9am - 6pm' : 'Monday to Friday, 9am - 6pm'}
                </p>
                <a href="tel:+5073001234" className="text-gold-500 hover:text-gold-400 transition-colors">
                  +507 300-1234
                </a>
              </div>

              <div className="card p-6">
                <div className="w-10 h-10 rounded-lg bg-gold-500/10 flex items-center justify-center mb-4">
                  <MapPin className="w-5 h-5 text-gold-500" />
                </div>
                <h3 className="font-display font-semibold text-white mb-2">
                  {language === 'es' ? 'Ubicación' : 'Location'}
                </h3>
                <p className="text-muted text-sm">
                  Ciudad de Panamá, Panamá
                </p>
              </div>

              <div className="card p-6">
                <div className="w-10 h-10 rounded-lg bg-gold-500/10 flex items-center justify-center mb-4">
                  <Clock className="w-5 h-5 text-gold-500" />
                </div>
                <h3 className="font-display font-semibold text-white mb-2">
                  {language === 'es' ? 'Tiempo de Respuesta' : 'Response Time'}
                </h3>
                <p className="text-muted text-sm">
                  {language === 'es' 
                    ? 'Respondemos dentro de 24 horas hábiles'
                    : 'We respond within 24 business hours'}
                </p>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="card p-8">
                {isSubmitted ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <Send className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h3 className="font-display text-xl font-semibold text-white mb-2">
                      {language === 'es' ? '¡Mensaje Enviado!' : 'Message Sent!'}
                    </h3>
                    <p className="text-muted mb-6">
                      {language === 'es'
                        ? 'Gracias por contactarnos. Te responderemos pronto.'
                        : 'Thank you for contacting us. We\'ll get back to you soon.'}
                    </p>
                    <Button onClick={() => setIsSubmitted(false)} variant="secondary">
                      {language === 'es' ? 'Enviar otro mensaje' : 'Send another message'}
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white">
                          {language === 'es' ? 'Nombre' : 'Name'}
                        </label>
                        <input
                          type="text"
                          required
                          className="input-luxury"
                          placeholder={language === 'es' ? 'Tu nombre' : 'Your name'}
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white">
                          {language === 'es' ? 'Correo Electrónico' : 'Email'}
                        </label>
                        <input
                          type="email"
                          required
                          className="input-luxury"
                          placeholder={language === 'es' ? 'tu@email.com' : 'your@email.com'}
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white">
                        {language === 'es' ? 'Asunto' : 'Subject'}
                      </label>
                      <select
                        className="input-luxury"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        required
                      >
                        <option value="">{language === 'es' ? 'Selecciona un asunto' : 'Select a subject'}</option>
                        <option value="general">{language === 'es' ? 'Consulta General' : 'General Inquiry'}</option>
                        <option value="sales">{language === 'es' ? 'Ventas y Precios' : 'Sales & Pricing'}</option>
                        <option value="support">{language === 'es' ? 'Soporte Técnico' : 'Technical Support'}</option>
                        <option value="partnership">{language === 'es' ? 'Alianzas' : 'Partnerships'}</option>
                        <option value="other">{language === 'es' ? 'Otro' : 'Other'}</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white">
                        {language === 'es' ? 'Mensaje' : 'Message'}
                      </label>
                      <textarea
                        required
                        rows={6}
                        className="input-luxury resize-none"
                        placeholder={language === 'es' ? '¿Cómo podemos ayudarte?' : 'How can we help you?'}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <span className="spinner" />
                          {language === 'es' ? 'Enviando...' : 'Sending...'}
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          {language === 'es' ? 'Enviar Mensaje' : 'Send Message'}
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </div>
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
