'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'es' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  es: {
    // Navigation
    'nav.dashboard': 'Panel',
    'nav.assets': 'Activos',
    'nav.calendar': 'Calendario',
    'nav.history': 'Historial',
    'nav.approvals': 'Aprobaciones',
    'nav.settings': 'Configuración',
    'nav.profile': 'Mi Perfil',
    'nav.signOut': 'Cerrar Sesión',
    'nav.language': 'Idioma',
    'nav.notifications': 'Notificaciones',
    
    // Common
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'common.delete': 'Eliminar',
    'common.edit': 'Editar',
    'common.create': 'Crear',
    'common.add': 'Agregar',
    'common.search': 'Buscar',
    'common.filter': 'Filtrar',
    'common.loading': 'Cargando...',
    'common.noResults': 'Sin resultados',
    'common.confirm': 'Confirmar',
    'common.back': 'Volver',
    'common.next': 'Siguiente',
    'common.previous': 'Anterior',
    'common.all': 'Todos',
    'common.active': 'Activo',
    'common.inactive': 'Inactivo',
    'common.status': 'Estado',
    'common.actions': 'Acciones',
    'common.name': 'Nombre',
    'common.description': 'Descripción',
    'common.date': 'Fecha',
    'common.time': 'Hora',
    'common.type': 'Tipo',
    'common.email': 'Correo',
    'common.phone': 'Teléfono',
    'common.yes': 'Sí',
    'common.no': 'No',
    'common.or': 'o',
    'common.and': 'y',
    'common.required': 'Requerido',
    'common.optional': 'Opcional',
    'common.success': 'Éxito',
    'common.error': 'Error',
    'common.warning': 'Advertencia',
    'common.info': 'Información',
    
    // Dashboard
    'dashboard.title': 'Panel de Control',
    'dashboard.welcome': 'Bienvenido',
    'dashboard.totalAssets': 'Total de Activos',
    'dashboard.activeBookings': 'Reservas Activas',
    'dashboard.pendingApprovals': 'Aprobaciones Pendientes',
    'dashboard.totalMembers': 'Total de Miembros',
    'dashboard.recentActivity': 'Actividad Reciente',
    'dashboard.upcomingBookings': 'Próximas Reservas',
    'dashboard.quickActions': 'Acciones Rápidas',
    'dashboard.newBooking': 'Nueva Reserva',
    'dashboard.viewCalendar': 'Ver Calendario',
    'dashboard.manageAssets': 'Gestionar Activos',
    
    // Assets
    'assets.title': 'Activos',
    'assets.subtitle': 'Gestiona tus activos de lujo',
    'assets.addAsset': 'Agregar Activo',
    'assets.editAsset': 'Editar Activo',
    'assets.deleteAsset': 'Eliminar Activo',
    'assets.noAssets': 'No hay activos registrados',
    'assets.section.planes': 'Aviones',
    'assets.section.helicopters': 'Helicópteros',
    'assets.section.residences': 'Residencias',
    'assets.section.watercraft': 'Embarcaciones',
    'assets.details': 'Detalles del Activo',
    'assets.photos': 'Fotos',
    'assets.location': 'Ubicación',
    'assets.capacity': 'Capacidad',
    'assets.manufacturer': 'Fabricante',
    'assets.model': 'Modelo',
    'assets.year': 'Año',
    'assets.registration': 'Matrícula',
    'assets.cruiseSpeed': 'Velocidad Crucero',
    'assets.range': 'Alcance',
    'assets.turnaround': 'Tiempo de Preparación',
    
    // Calendar
    'calendar.title': 'Calendario',
    'calendar.subtitle': 'Vista unificada de todas las reservas',
    'calendar.today': 'Hoy',
    'calendar.month': 'Mes',
    'calendar.week': 'Semana',
    'calendar.day': 'Día',
    'calendar.newBooking': 'Nueva Reserva',
    'calendar.noBookings': 'No hay reservas para este período',
    
    // Bookings/Reservations
    'bookings.title': 'Historial de Reservas',
    'bookings.subtitle': 'Todas tus reservas pasadas y actuales',
    'bookings.status.pending': 'Pendiente',
    'bookings.status.approved': 'Aprobada',
    'bookings.status.rejected': 'Rechazada',
    'bookings.status.cancelled': 'Cancelada',
    'bookings.status.completed': 'Completada',
    'bookings.filter.all': 'Todas',
    'bookings.filter.active': 'Activas',
    'bookings.filter.past': 'Pasadas',
    'bookings.filter.cancelled': 'Canceladas',
    'bookings.details': 'Detalles de la Reserva',
    'bookings.asset': 'Activo',
    'bookings.startDate': 'Fecha de Inicio',
    'bookings.endDate': 'Fecha de Fin',
    'bookings.requestedBy': 'Solicitado por',
    'bookings.approvedBy': 'Aprobado por',
    'bookings.notes': 'Notas',
    'bookings.guests': 'Invitados',
    
    // Approvals
    'approvals.title': 'Aprobaciones',
    'approvals.subtitle': 'Gestiona las solicitudes de reserva pendientes',
    'approvals.pending': 'Pendientes',
    'approvals.approved': 'Aprobadas',
    'approvals.rejected': 'Rechazadas',
    'approvals.approve': 'Aprobar',
    'approvals.reject': 'Rechazar',
    'approvals.noApprovals': 'No hay aprobaciones pendientes',
    'approvals.reason': 'Motivo',
    
    // Settings
    'settings.title': 'Configuración',
    'settings.organization': 'Organización',
    'settings.billing': 'Facturación',
    'settings.members': 'Miembros',
    'settings.tiers': 'Niveles',
    'settings.rules': 'Reglas de Reserva',
    'settings.holidays': 'Feriados',
    'settings.locations': 'Ubicaciones',
    'settings.ports': 'Marinas',
    'settings.approvalsConfig': 'Config. de Aprobación',
    'settings.smtp': 'Email (SMTP)',
    
    // Organization Settings
    'settings.org.legalName': 'Razón Social',
    'settings.org.commercialName': 'Nombre Comercial',
    'settings.org.ruc': 'RUC',
    'settings.org.dv': 'DV',
    'settings.org.billingEmail': 'Email de Facturación',
    'settings.org.logo': 'Logo',
    'settings.org.uploadLogo': 'Subir Logo',
    
    // Members
    'members.title': 'Miembros',
    'members.invite': 'Invitar Miembro',
    'members.role': 'Rol',
    'members.tier': 'Nivel',
    'members.joinedAt': 'Se unió',
    'members.remove': 'Remover',
    'members.role.owner': 'Propietario',
    'members.role.admin': 'Administrador',
    'members.role.manager': 'Gerente',
    'members.role.member': 'Miembro',
    'members.role.viewer': 'Observador',
    
    // Tiers
    'tiers.title': 'Niveles de Acceso',
    'tiers.addTier': 'Agregar Nivel',
    'tiers.editTier': 'Editar Nivel',
    'tiers.priority': 'Prioridad',
    'tiers.color': 'Color',
    'tiers.rules': 'Reglas',
    'tiers.maxDaysPerMonth': 'Máx. días/mes',
    'tiers.maxConsecutive': 'Máx. días consecutivos',
    'tiers.minLeadTime': 'Anticipación mínima (hrs)',
    'tiers.requiresApproval': 'Requiere aprobación',
    'tiers.canOverride': 'Puede sobrescribir',
    
    // Rules
    'rules.title': 'Reglas de Reserva',
    'rules.subtitle': 'Configura las reglas que controlan cómo los miembros pueden hacer reservas',
    'rules.addRule': 'Agregar Regla',
    'rules.type.dateRange': 'Rango de Fechas',
    'rules.type.consecutive': 'Días Consecutivos',
    'rules.type.concurrent': 'Reservas Simultáneas',
    'rules.type.leadTime': 'Tiempo de Anticipación',
    'rules.type.holiday': 'Feriados',
    'rules.type.custom': 'Personalizado',
    
    // Holidays
    'holidays.title': 'Feriados y Períodos',
    'holidays.subtitle': 'Define feriados y períodos especiales para las reglas de reserva',
    'holidays.addHoliday': 'Agregar Feriado',
    'holidays.editHoliday': 'Editar Feriado',
    'holidays.category.national': 'Nacional',
    'holidays.category.religious': 'Religioso',
    'holidays.category.company': 'Empresa',
    'holidays.category.custom': 'Personalizado',
    'holidays.variable': 'Fecha variable',
    'holidays.month': 'Mes',
    'holidays.day': 'Día',
    
    // Locations
    'locations.title': 'Aeropuertos y Helipuertos',
    'locations.subtitle': 'Directorio de ubicaciones para aviación',
    'locations.addLocation': 'Agregar Ubicación',
    'locations.editLocation': 'Editar Ubicación',
    'locations.icaoCode': 'Código ICAO',
    'locations.iataCode': 'Código IATA',
    'locations.city': 'Ciudad',
    'locations.country': 'País',
    'locations.type.airport': 'Aeropuerto',
    'locations.type.helipad': 'Helipuerto',
    'locations.latitude': 'Latitud',
    'locations.longitude': 'Longitud',
    
    // Ports
    'ports.title': 'Marinas y Puertos',
    'ports.subtitle': 'Directorio de ubicaciones para embarcaciones',
    'ports.addPort': 'Agregar Marina',
    'ports.editPort': 'Editar Marina',
    'ports.code': 'Código',
    
    // Profile
    'profile.title': 'Mi Perfil',
    'profile.firstName': 'Nombre',
    'profile.lastName': 'Apellido',
    'profile.email': 'Correo Electrónico',
    'profile.phone': 'Teléfono',
    'profile.timezone': 'Zona Horaria',
    'profile.language': 'Idioma',
    'profile.language.es': 'Español',
    'profile.language.en': 'English',
    'profile.avatar': 'Foto de Perfil',
    'profile.changePassword': 'Cambiar Contraseña',
    'profile.saved': 'Perfil guardado exitosamente',
    
    // Auth
    'auth.signIn': 'Iniciar Sesión',
    'auth.signUp': 'Registrarse',
    'auth.signOut': 'Cerrar Sesión',
    'auth.email': 'Correo Electrónico',
    'auth.password': 'Contraseña',
    'auth.confirmPassword': 'Confirmar Contraseña',
    'auth.forgotPassword': '¿Olvidaste tu contraseña?',
    'auth.noAccount': '¿No tienes cuenta?',
    'auth.haveAccount': '¿Ya tienes cuenta?',
    'auth.createAccount': 'Crear Cuenta',
    
    // Landing Page
    'landing.hero.badge': 'Plataforma Premium de Gestión de Activos',
    'landing.hero.title1': 'Gestiona Tus',
    'landing.hero.title2': 'Activos de Lujo',
    'landing.hero.title3': 'Con Elegancia',
    'landing.hero.subtitle': 'Coordina reservas de aviación privada, yates y propiedades exclusivas. Diseñado para oficinas familiares y propietarios exigentes.',
    'landing.hero.cta': 'Iniciar Prueba Gratis',
    'landing.hero.demo': 'Ver Demo',
    'landing.hero.trial': 'Prueba gratis de 14 días • Sin tarjeta de crédito • Cancela cuando quieras',
    'landing.sections.title': 'Una Plataforma, Todos Tus Activos',
    'landing.sections.subtitle': 'Secciones modulares te permiten gestionar exactamente lo que necesitas. Activa cualquier combinación de tipos de activos.',
    'landing.sections.planes': 'Aviones',
    'landing.sections.planesDesc': 'Jets privados, turbohélices y aeronaves con cálculos de ruta y ETA',
    'landing.sections.helicopters': 'Helicópteros',
    'landing.sections.helicoptersDesc': 'Gestión de helicópteros con directorio de helipuertos y registro de horas de vuelo',
    'landing.sections.residences': 'Residencias',
    'landing.sections.residencesDesc': 'Casas, villas y espacios de reunión con gestión de check-in/out',
    'landing.sections.boats': 'Embarcaciones',
    'landing.sections.boatsDesc': 'Yates y embarcaciones con directorio de puertos y coordinación de capitanes',
    'landing.features.title': 'Diseñado para la Complejidad, Creado para la Simplicidad',
    'landing.features.subtitle': 'Funciones avanzadas envueltas en una interfaz intuitiva que todo tu equipo puede usar.',
    'landing.features.calendar': 'Calendario Unificado',
    'landing.features.calendarDesc': 'Ve todos los activos de todas las categorías en una vista integral. Sin más cambios entre sistemas.',
    'landing.features.tiers': 'Niveles de Prioridad',
    'landing.features.tiersDesc': 'Define niveles de miembros con reglas de prioridad de reserva. Asegura que los principales siempre tengan acceso primero.',
    'landing.features.security': 'Seguro y Privado',
    'landing.features.securityDesc': 'Seguridad de nivel empresarial con aislamiento completo de datos entre organizaciones.',
    'landing.cta.title': '¿Listo para Optimizar tus Activos?',
    'landing.cta.subtitle': 'Únete a familias y organizaciones exigentes que confían en ReservePTY para gestionar sus activos más valiosos.',
    'landing.cta.button': 'Inicia tu Prueba Gratis',
    'landing.footer.privacy': 'Privacidad',
    'landing.footer.terms': 'Términos',
    'landing.footer.rights': 'Todos los derechos reservados.',
    
    // Months
    'month.1': 'Enero',
    'month.2': 'Febrero',
    'month.3': 'Marzo',
    'month.4': 'Abril',
    'month.5': 'Mayo',
    'month.6': 'Junio',
    'month.7': 'Julio',
    'month.8': 'Agosto',
    'month.9': 'Septiembre',
    'month.10': 'Octubre',
    'month.11': 'Noviembre',
    'month.12': 'Diciembre',
    
    // Days
    'day.sun': 'Dom',
    'day.mon': 'Lun',
    'day.tue': 'Mar',
    'day.wed': 'Mié',
    'day.thu': 'Jue',
    'day.fri': 'Vie',
    'day.sat': 'Sáb',
    
    // Auth Pages
    'auth.login.title': 'Bienvenido de nuevo',
    'auth.login.subtitle': 'Ingresa tus credenciales para acceder a tu cuenta',
    'auth.login.email': 'Correo electrónico',
    'auth.login.password': 'Contraseña',
    'auth.login.forgotPassword': '¿Olvidaste tu contraseña?',
    'auth.login.submit': 'Iniciar Sesión',
    'auth.login.noAccount': '¿No tienes cuenta?',
    'auth.login.signUp': 'Regístrate',
    'auth.login.orContinue': 'O continúa con',
    'auth.login.google': 'Google',
    'auth.login.success': '¡Bienvenido de nuevo!',
    'auth.login.successDesc': 'Has iniciado sesión correctamente.',
    'auth.login.failed': 'Error al iniciar sesión',
    'auth.login.error': 'Error',
    'auth.login.errorDesc': 'Ocurrió un error inesperado. Intenta de nuevo.',
    
    'auth.signup.title': 'Crear Cuenta',
    'auth.signup.subtitle': 'Comienza tu prueba gratuita de 14 días',
    'auth.signup.firstName': 'Nombre',
    'auth.signup.lastName': 'Apellido',
    'auth.signup.email': 'Correo electrónico',
    'auth.signup.password': 'Contraseña',
    'auth.signup.confirmPassword': 'Confirmar Contraseña',
    'auth.signup.submit': 'Crear Cuenta',
    'auth.signup.haveAccount': '¿Ya tienes cuenta?',
    'auth.signup.signIn': 'Inicia Sesión',
    'auth.signup.orContinue': 'O continúa con',
    'auth.signup.google': 'Google',
    'auth.signup.success': '¡Cuenta creada!',
    'auth.signup.successDesc': 'Por favor verifica tu correo electrónico.',
    'auth.signup.failed': 'Error al crear cuenta',
    'auth.signup.passwordMismatch': 'Las contraseñas no coinciden',
    'auth.signup.terms': 'Al registrarte, aceptas nuestros',
    'auth.signup.termsLink': 'Términos de Servicio',
    'auth.signup.and': 'y',
    'auth.signup.privacyLink': 'Política de Privacidad',
    
    // Dev Mode
    'dev.mode': 'Modo Desarrollo',
  },
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.assets': 'Assets',
    'nav.calendar': 'Calendar',
    'nav.history': 'History',
    'nav.approvals': 'Approvals',
    'nav.settings': 'Settings',
    'nav.profile': 'My Profile',
    'nav.signOut': 'Sign Out',
    'nav.language': 'Language',
    'nav.notifications': 'Notifications',
    
    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.create': 'Create',
    'common.add': 'Add',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.loading': 'Loading...',
    'common.noResults': 'No results',
    'common.confirm': 'Confirm',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.all': 'All',
    'common.active': 'Active',
    'common.inactive': 'Inactive',
    'common.status': 'Status',
    'common.actions': 'Actions',
    'common.name': 'Name',
    'common.description': 'Description',
    'common.date': 'Date',
    'common.time': 'Time',
    'common.type': 'Type',
    'common.email': 'Email',
    'common.phone': 'Phone',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.or': 'or',
    'common.and': 'and',
    'common.required': 'Required',
    'common.optional': 'Optional',
    'common.success': 'Success',
    'common.error': 'Error',
    'common.warning': 'Warning',
    'common.info': 'Information',
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.welcome': 'Welcome',
    'dashboard.totalAssets': 'Total Assets',
    'dashboard.activeBookings': 'Active Bookings',
    'dashboard.pendingApprovals': 'Pending Approvals',
    'dashboard.totalMembers': 'Total Members',
    'dashboard.recentActivity': 'Recent Activity',
    'dashboard.upcomingBookings': 'Upcoming Bookings',
    'dashboard.quickActions': 'Quick Actions',
    'dashboard.newBooking': 'New Booking',
    'dashboard.viewCalendar': 'View Calendar',
    'dashboard.manageAssets': 'Manage Assets',
    
    // Assets
    'assets.title': 'Assets',
    'assets.subtitle': 'Manage your luxury assets',
    'assets.addAsset': 'Add Asset',
    'assets.editAsset': 'Edit Asset',
    'assets.deleteAsset': 'Delete Asset',
    'assets.noAssets': 'No assets registered',
    'assets.section.planes': 'Planes',
    'assets.section.helicopters': 'Helicopters',
    'assets.section.residences': 'Residences',
    'assets.section.watercraft': 'Watercraft',
    'assets.details': 'Asset Details',
    'assets.photos': 'Photos',
    'assets.location': 'Location',
    'assets.capacity': 'Capacity',
    'assets.manufacturer': 'Manufacturer',
    'assets.model': 'Model',
    'assets.year': 'Year',
    'assets.registration': 'Registration',
    'assets.cruiseSpeed': 'Cruise Speed',
    'assets.range': 'Range',
    'assets.turnaround': 'Turnaround Time',
    
    // Calendar
    'calendar.title': 'Calendar',
    'calendar.subtitle': 'Unified view of all reservations',
    'calendar.today': 'Today',
    'calendar.month': 'Month',
    'calendar.week': 'Week',
    'calendar.day': 'Day',
    'calendar.newBooking': 'New Booking',
    'calendar.noBookings': 'No bookings for this period',
    
    // Bookings/Reservations
    'bookings.title': 'Booking History',
    'bookings.subtitle': 'All your past and current reservations',
    'bookings.status.pending': 'Pending',
    'bookings.status.approved': 'Approved',
    'bookings.status.rejected': 'Rejected',
    'bookings.status.cancelled': 'Cancelled',
    'bookings.status.completed': 'Completed',
    'bookings.filter.all': 'All',
    'bookings.filter.active': 'Active',
    'bookings.filter.past': 'Past',
    'bookings.filter.cancelled': 'Cancelled',
    'bookings.details': 'Booking Details',
    'bookings.asset': 'Asset',
    'bookings.startDate': 'Start Date',
    'bookings.endDate': 'End Date',
    'bookings.requestedBy': 'Requested by',
    'bookings.approvedBy': 'Approved by',
    'bookings.notes': 'Notes',
    'bookings.guests': 'Guests',
    
    // Approvals
    'approvals.title': 'Approvals',
    'approvals.subtitle': 'Manage pending booking requests',
    'approvals.pending': 'Pending',
    'approvals.approved': 'Approved',
    'approvals.rejected': 'Rejected',
    'approvals.approve': 'Approve',
    'approvals.reject': 'Reject',
    'approvals.noApprovals': 'No pending approvals',
    'approvals.reason': 'Reason',
    
    // Settings
    'settings.title': 'Settings',
    'settings.organization': 'Organization',
    'settings.billing': 'Billing',
    'settings.members': 'Members',
    'settings.tiers': 'Tiers',
    'settings.rules': 'Booking Rules',
    'settings.holidays': 'Holidays',
    'settings.locations': 'Locations',
    'settings.ports': 'Marinas',
    'settings.approvalsConfig': 'Approval Config',
    'settings.smtp': 'Email (SMTP)',
    
    // Organization Settings
    'settings.org.legalName': 'Legal Name',
    'settings.org.commercialName': 'Commercial Name',
    'settings.org.ruc': 'RUC',
    'settings.org.dv': 'DV',
    'settings.org.billingEmail': 'Billing Email',
    'settings.org.logo': 'Logo',
    'settings.org.uploadLogo': 'Upload Logo',
    
    // Members
    'members.title': 'Members',
    'members.invite': 'Invite Member',
    'members.role': 'Role',
    'members.tier': 'Tier',
    'members.joinedAt': 'Joined',
    'members.remove': 'Remove',
    'members.role.owner': 'Owner',
    'members.role.admin': 'Admin',
    'members.role.manager': 'Manager',
    'members.role.member': 'Member',
    'members.role.viewer': 'Viewer',
    
    // Tiers
    'tiers.title': 'Access Tiers',
    'tiers.addTier': 'Add Tier',
    'tiers.editTier': 'Edit Tier',
    'tiers.priority': 'Priority',
    'tiers.color': 'Color',
    'tiers.rules': 'Rules',
    'tiers.maxDaysPerMonth': 'Max days/month',
    'tiers.maxConsecutive': 'Max consecutive days',
    'tiers.minLeadTime': 'Min lead time (hrs)',
    'tiers.requiresApproval': 'Requires approval',
    'tiers.canOverride': 'Can override',
    
    // Rules
    'rules.title': 'Booking Rules',
    'rules.subtitle': 'Configure rules that control how members can make reservations',
    'rules.addRule': 'Add Rule',
    'rules.type.dateRange': 'Date Range',
    'rules.type.consecutive': 'Consecutive Days',
    'rules.type.concurrent': 'Concurrent Bookings',
    'rules.type.leadTime': 'Lead Time',
    'rules.type.holiday': 'Holidays',
    'rules.type.custom': 'Custom',
    
    // Holidays
    'holidays.title': 'Holidays & Periods',
    'holidays.subtitle': 'Define holidays and special periods for booking rules',
    'holidays.addHoliday': 'Add Holiday',
    'holidays.editHoliday': 'Edit Holiday',
    'holidays.category.national': 'National',
    'holidays.category.religious': 'Religious',
    'holidays.category.company': 'Company',
    'holidays.category.custom': 'Custom',
    'holidays.variable': 'Variable date',
    'holidays.month': 'Month',
    'holidays.day': 'Day',
    
    // Locations
    'locations.title': 'Airports & Helipads',
    'locations.subtitle': 'Aviation locations directory',
    'locations.addLocation': 'Add Location',
    'locations.editLocation': 'Edit Location',
    'locations.icaoCode': 'ICAO Code',
    'locations.iataCode': 'IATA Code',
    'locations.city': 'City',
    'locations.country': 'Country',
    'locations.type.airport': 'Airport',
    'locations.type.helipad': 'Helipad',
    'locations.latitude': 'Latitude',
    'locations.longitude': 'Longitude',
    
    // Ports
    'ports.title': 'Marinas & Ports',
    'ports.subtitle': 'Watercraft locations directory',
    'ports.addPort': 'Add Marina',
    'ports.editPort': 'Edit Marina',
    'ports.code': 'Code',
    
    // Profile
    'profile.title': 'My Profile',
    'profile.firstName': 'First Name',
    'profile.lastName': 'Last Name',
    'profile.email': 'Email',
    'profile.phone': 'Phone',
    'profile.timezone': 'Timezone',
    'profile.language': 'Language',
    'profile.language.es': 'Español',
    'profile.language.en': 'English',
    'profile.avatar': 'Profile Photo',
    'profile.changePassword': 'Change Password',
    'profile.saved': 'Profile saved successfully',
    
    // Auth
    'auth.signIn': 'Sign In',
    'auth.signUp': 'Sign Up',
    'auth.signOut': 'Sign Out',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.forgotPassword': 'Forgot password?',
    'auth.noAccount': "Don't have an account?",
    'auth.haveAccount': 'Already have an account?',
    'auth.createAccount': 'Create Account',
    
    // Landing Page
    'landing.hero.badge': 'Premium Asset Management Platform',
    'landing.hero.title1': 'Manage Your',
    'landing.hero.title2': 'Luxury Assets',
    'landing.hero.title3': 'With Elegance',
    'landing.hero.subtitle': 'Coordinate bookings across private aviation, yachts, and exclusive properties. Built for family offices and discerning asset owners.',
    'landing.hero.cta': 'Start Free Trial',
    'landing.hero.demo': 'View Demo',
    'landing.hero.trial': '14-day free trial • No credit card required • Cancel anytime',
    'landing.sections.title': 'One Platform, All Your Assets',
    'landing.sections.subtitle': 'Modular sections let you manage exactly what you need. Activate any combination of asset types.',
    'landing.sections.planes': 'Planes',
    'landing.sections.planesDesc': 'Private jets, turboprops, and aircraft with flight routing and ETA calculations',
    'landing.sections.helicopters': 'Helicopters',
    'landing.sections.helicoptersDesc': 'Rotorcraft management with helipad directory and flight-hour logging',
    'landing.sections.residences': 'Residences',
    'landing.sections.residencesDesc': 'Homes, villas, and meeting spaces with check-in/out management',
    'landing.sections.boats': 'Boats',
    'landing.sections.boatsDesc': 'Yachts and watercraft with port directory and captain coordination',
    'landing.features.title': 'Built for Complexity, Designed for Simplicity',
    'landing.features.subtitle': 'Advanced features wrapped in an intuitive interface your entire team can use.',
    'landing.features.calendar': 'Unified Calendar',
    'landing.features.calendarDesc': 'See all assets across all categories in one comprehensive view. No more switching between systems.',
    'landing.features.tiers': 'Priority Tiers',
    'landing.features.tiersDesc': 'Define member tiers with booking priority rules. Ensure principals always have first access.',
    'landing.features.security': 'Secure & Private',
    'landing.features.securityDesc': 'Enterprise-grade security with complete data isolation between organizations.',
    'landing.cta.title': 'Ready to Streamline Your Assets?',
    'landing.cta.subtitle': 'Join discerning families and organizations who trust ReservePTY to manage their most valuable assets.',
    'landing.cta.button': 'Start Your Free Trial',
    'landing.footer.privacy': 'Privacy',
    'landing.footer.terms': 'Terms',
    'landing.footer.rights': 'All rights reserved.',
    
    // Months
    'month.1': 'January',
    'month.2': 'February',
    'month.3': 'March',
    'month.4': 'April',
    'month.5': 'May',
    'month.6': 'June',
    'month.7': 'July',
    'month.8': 'August',
    'month.9': 'September',
    'month.10': 'October',
    'month.11': 'November',
    'month.12': 'December',
    
    // Days
    'day.sun': 'Sun',
    'day.mon': 'Mon',
    'day.tue': 'Tue',
    'day.wed': 'Wed',
    'day.thu': 'Thu',
    'day.fri': 'Fri',
    'day.sat': 'Sat',
    
    // Auth Pages
    'auth.login.title': 'Welcome back',
    'auth.login.subtitle': 'Enter your credentials to access your account',
    'auth.login.email': 'Email',
    'auth.login.password': 'Password',
    'auth.login.forgotPassword': 'Forgot password?',
    'auth.login.submit': 'Sign In',
    'auth.login.noAccount': "Don't have an account?",
    'auth.login.signUp': 'Sign up',
    'auth.login.orContinue': 'Or continue with',
    'auth.login.google': 'Google',
    'auth.login.success': 'Welcome back!',
    'auth.login.successDesc': 'You have been signed in successfully.',
    'auth.login.failed': 'Sign in failed',
    'auth.login.error': 'Error',
    'auth.login.errorDesc': 'An unexpected error occurred. Please try again.',
    
    'auth.signup.title': 'Create Account',
    'auth.signup.subtitle': 'Start your free 14-day trial',
    'auth.signup.firstName': 'First Name',
    'auth.signup.lastName': 'Last Name',
    'auth.signup.email': 'Email',
    'auth.signup.password': 'Password',
    'auth.signup.confirmPassword': 'Confirm Password',
    'auth.signup.submit': 'Create Account',
    'auth.signup.haveAccount': 'Already have an account?',
    'auth.signup.signIn': 'Sign in',
    'auth.signup.orContinue': 'Or continue with',
    'auth.signup.google': 'Google',
    'auth.signup.success': 'Account created!',
    'auth.signup.successDesc': 'Please check your email to verify your account.',
    'auth.signup.failed': 'Sign up failed',
    'auth.signup.passwordMismatch': 'Passwords do not match',
    'auth.signup.terms': 'By signing up, you agree to our',
    'auth.signup.termsLink': 'Terms of Service',
    'auth.signup.and': 'and',
    'auth.signup.privacyLink': 'Privacy Policy',
    
    // Dev Mode
    'dev.mode': 'Development Mode',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Detect browser language
function detectBrowserLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  
  // Get browser language
  const browserLang = navigator.language || (navigator as any).userLanguage || '';
  
  // Check if it starts with 'es' (es, es-ES, es-MX, es-419, etc.)
  if (browserLang.toLowerCase().startsWith('es')) {
    return 'es';
  }
  
  // Default to English for all other languages
  return 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Load saved language from localStorage, or detect from browser
    const saved = localStorage.getItem('reservepty-language') as Language;
    if (saved && (saved === 'es' || saved === 'en')) {
      setLanguageState(saved);
    } else {
      // No saved preference, detect from browser
      const detected = detectBrowserLanguage();
      setLanguageState(detected);
      localStorage.setItem('reservepty-language', detected);
    }
    setIsInitialized(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('reservepty-language', lang);
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

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
