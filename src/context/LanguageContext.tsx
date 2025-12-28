'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key,
});

// Common translations used across the app
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    assets: 'Assets',
    calendar: 'Calendar',
    reservations: 'Reservations',
    approvals: 'Approvals',
    settings: 'Settings',
    directories: 'Directories',
    aviationLocations: 'Aviation Locations',
    ports: 'Ports',
    upgrade: 'Upgrade',
    signOut: 'Sign Out',
    
    // Sections
    planes: 'Planes',
    helicopters: 'Helicopters',
    residences: 'Residences & Spaces',
    boats: 'Boats',
    
    // Common actions
    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    close: 'Close',
    search: 'Search',
    filter: 'Filter',
    view: 'View',
    back: 'Back',
    next: 'Next',
    loading: 'Loading...',
    
    // Status
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    canceled: 'Canceled',
    active: 'Active',
    inactive: 'Inactive',
    
    // Time
    today: 'Today',
    tomorrow: 'Tomorrow',
    yesterday: 'Yesterday',
    
    // Messages
    noResults: 'No results found',
    confirmDelete: 'Are you sure you want to delete this?',
    saved: 'Saved successfully',
    error: 'An error occurred',
  },
  es: {
    // Navigation
    dashboard: 'Panel',
    assets: 'Activos',
    calendar: 'Calendario',
    reservations: 'Reservaciones',
    approvals: 'Aprobaciones',
    settings: 'Configuración',
    directories: 'Directorios',
    aviationLocations: 'Ubicaciones de Aviación',
    ports: 'Puertos',
    upgrade: 'Mejorar Plan',
    signOut: 'Cerrar Sesión',
    
    // Sections
    planes: 'Aviones',
    helicopters: 'Helicópteros',
    residences: 'Residencias y Espacios',
    boats: 'Embarcaciones',
    
    // Common actions
    add: 'Agregar',
    edit: 'Editar',
    delete: 'Eliminar',
    save: 'Guardar',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    close: 'Cerrar',
    search: 'Buscar',
    filter: 'Filtrar',
    view: 'Ver',
    back: 'Atrás',
    next: 'Siguiente',
    loading: 'Cargando...',
    
    // Status
    pending: 'Pendiente',
    approved: 'Aprobada',
    rejected: 'Rechazada',
    canceled: 'Cancelada',
    active: 'Activo',
    inactive: 'Inactivo',
    
    // Time
    today: 'Hoy',
    tomorrow: 'Mañana',
    yesterday: 'Ayer',
    
    // Messages
    noResults: 'No se encontraron resultados',
    confirmDelete: '¿Estás seguro de que deseas eliminar esto?',
    saved: 'Guardado exitosamente',
    error: 'Ocurrió un error',
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    // Check localStorage first
    const stored = localStorage.getItem('language') as Language;
    if (stored && (stored === 'en' || stored === 'es')) {
      setLanguageState(stored);
      return;
    }

    // Detect from browser
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('es')) {
      setLanguageState('es');
      localStorage.setItem('language', 'es');
    } else {
      localStorage.setItem('language', 'en');
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
