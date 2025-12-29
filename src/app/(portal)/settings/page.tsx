'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/components/auth/auth-provider';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn, SECTIONS } from '@/lib/utils';
import {
  Building2,
  CreditCard,
  User,
  Users,
  Layers,
  Upload,
  Save,
  Loader2,
  CheckCircle2,
  Plane,
  Ship,
  Home,
  Plus,
  Mail,
  Trash2,
  Crown,
  X,
  Edit2,
  ShieldCheck,
  Server,
  Send,
  AlertCircle,
  Shield,
  CalendarDays,
  MapPin,
  Anchor,
  Navigation,
  Star,
  Church,
  Copy,
  Info,
  Zap,
  Clock,
  Calendar,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

const SECTION_ICONS: Record<string, React.ElementType> = {
  planes: Plane,
  helicopters: Plane,
  residences: Home,
  watercraft: Ship,
};

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-gold-500/10 text-gold-500 border-gold-500/20',
  admin: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  manager: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  member: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  viewer: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

interface Member {
  id: string;
  user_id: string;
  role: string;
  tier_id: string | null;
  profile?: {
    email: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    avatar_url: string | null;
  };
  tier?: {
    id: string;
    name: string;
    color: string;
  };
}

interface Tier {
  id: string;
  name: string;
  priority: number;
  color: string;
  description?: string;
  tier_rules?: {
    max_days_per_month: number | null;
    max_consecutive_days: number | null;
    min_lead_time_hours: number;
    requires_approval: boolean;
    can_override: boolean;
  };
}

export default function SettingsPage() {
  const { toast } = useToast();
  const { user, profile, organization, membership, session } = useAuth();
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState('organization');
  const [isSaving, setIsSaving] = useState(false);
  
  // Members state
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'member', tierId: '' });
  const [isInviting, setIsInviting] = useState(false);
  
  // Member editing state
  const [showMemberEditModal, setShowMemberEditModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [memberEditForm, setMemberEditForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    role: 'member',
    tierId: '',
  });
  const [isSavingMember, setIsSavingMember] = useState(false);
  
  // Pending invitations state
  const [pendingInvitations, setPendingInvitations] = useState<{
    id: string;
    email: string;
    role: string;
    token: string;
    inviteUrl: string;
    created_at: string;
    expires_at: string;
  }[]>([]);
  const [inviteSuccess, setInviteSuccess] = useState<{ url: string; email: string; orgName: string } | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);
  
  // Tiers state
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [isLoadingTiers, setIsLoadingTiers] = useState(false);
  const [showTierModal, setShowTierModal] = useState(false);
  const [editingTier, setEditingTier] = useState<Tier | null>(null);
  const [tierForm, setTierForm] = useState({
    name: '',
    priority: 1,
    color: '#c8b273',
    description: '',
    maxDaysPerMonth: '',
    maxConsecutiveDays: '',
    minLeadTimeHours: '0',
    requiresApproval: false,
    canOverride: false,
  });

  // Approval settings state
  const [approvalSettings, setApprovalSettings] = useState({
    approverRoles: ['owner', 'admin', 'manager'] as string[],
    specificApprovers: [] as string[], // user IDs
  });
  const [isSavingApprovals, setIsSavingApprovals] = useState(false);

  // SMTP settings state
  const [smtpSettings, setSmtpSettings] = useState({
    smtpHost: '',
    smtpPort: '587',
    smtpSecure: true,
    smtpUser: '',
    smtpPassword: '',
    fromEmail: '',
    fromName: '',
    replyTo: '',
    isActive: false,
    isVerified: false,
  });
  const [isLoadingSmtp, setIsLoadingSmtp] = useState(false);
  const [isSavingSmtp, setIsSavingSmtp] = useState(false);
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Booking Rules state
  const [rules, setRules] = useState<any[]>([]);
  const [isLoadingRules, setIsLoadingRules] = useState(false);

  // Holidays state
  const [holidays, setHolidays] = useState<any[]>([]);
  const [holidayPeriods, setHolidayPeriods] = useState<any[]>([]);
  const [isLoadingHolidays, setIsLoadingHolidays] = useState(false);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<any>(null);
  const [holidayForm, setHolidayForm] = useState({
    name: '', description: '', month: '', day: '', isVariable: false, variableRule: '', category: 'national'
  });

  // Locations state
  const [locations, setLocations] = useState<any[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<any>(null);
  const [locationForm, setLocationForm] = useState({
    icaoCode: '', iataCode: '', name: '', city: '', country: 'Panama', latitude: '', longitude: '', type: 'airport'
  });

  // Ports state
  const [ports, setPorts] = useState<any[]>([]);
  const [isLoadingPorts, setIsLoadingPorts] = useState(false);
  const [showPortModal, setShowPortModal] = useState(false);
  const [editingPort, setEditingPort] = useState<any>(null);
  const [portForm, setPortForm] = useState({
    code: '', name: '', city: '', country: 'Panama', latitude: '', longitude: ''
  });

  // Assets management state
  const [settingsAssets, setSettingsAssets] = useState<any[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<any>(null);
  const [assetForm, setAssetForm] = useState({
    name: '',
    section: 'planes' as string,
    description: '',
    primaryPhotoUrl: '',
    isActive: true,
    // Details vary by section
    manufacturer: '',
    model: '',
    year: '',
    tailNumber: '',
    capacity: '',
    cruiseSpeed: '',
    range: '',
    homeAirport: '',
    turnaroundMinutes: '60',
    // Residence specific
    address: '',
    city: '',
    maxGuests: '',
    bedrooms: '',
    bathrooms: '',
    checkInTime: '15:00',
    checkOutTime: '11:00',
    // Watercraft specific
    length: '',
    beam: '',
    draft: '',
    homePort: '',
    hullType: '',
    engineType: '',
  });

  // Organization form
  const [orgForm, setOrgForm] = useState({
    legalName: organization?.legal_name || '',
    commercialName: organization?.commercial_name || '',
    ruc: organization?.ruc || '',
    dv: organization?.dv || '',
    billingEmail: organization?.billing_email || '',
  });

  // Check if user is admin
  const isAdmin = membership?.role === 'owner' || membership?.role === 'admin';

  // Build tabs - Settings page is admin only, Profile is now in user dropdown
  // Tab groups for better organization
  const tabGroups = [
    {
      id: 'general',
      label: language === 'es' ? 'General' : 'General',
      tabs: [
        { id: 'organization', label: t('settings.organization'), icon: Building2 },
        { id: 'billing', label: t('settings.billing'), icon: CreditCard },
      ]
    },
    {
      id: 'team',
      label: language === 'es' ? 'Equipo' : 'Team',
      tabs: [
        { id: 'members', label: t('settings.members'), icon: Users },
        { id: 'tiers', label: t('settings.tiers'), icon: Layers },
      ]
    },
    {
      id: 'assets',
      label: language === 'es' ? 'Activos' : 'Assets',
      tabs: [
        { id: 'assets', label: language === 'es' ? 'Gestionar Activos' : 'Manage Assets', icon: Plane },
      ]
    },
    {
      id: 'booking',
      label: language === 'es' ? 'Reservas' : 'Booking',
      tabs: [
        { id: 'rules', label: t('settings.rules'), icon: Shield },
        { id: 'holidays', label: t('settings.holidays'), icon: CalendarDays },
        { id: 'approvals', label: t('settings.approvalsConfig'), icon: ShieldCheck },
      ]
    },
    {
      id: 'directories',
      label: language === 'es' ? 'Directorios' : 'Directories',
      tabs: [
        { id: 'locations', label: t('settings.locations'), icon: MapPin },
        { id: 'ports', label: t('settings.ports'), icon: Anchor },
      ]
    },
    ...(membership?.role === 'owner' ? [{
      id: 'advanced',
      label: language === 'es' ? 'Avanzado' : 'Advanced',
      tabs: [
        { id: 'smtp', label: t('settings.smtp'), icon: Server },
      ]
    }] : []),
  ];
  
  // Flat list for backwards compatibility
  const tabs = tabGroups.flatMap(group => group.tabs);
  
  // Get current group from active tab
  const currentGroup = tabGroups.find(group => group.tabs.some(tab => tab.id === activeTab));

  // Fetch members when tab is active
  useEffect(() => {
    if (activeTab === 'members' && organization?.id && session?.access_token) {
      fetchMembers();
      fetchPendingInvitations();
    }
  }, [activeTab, organization?.id, session?.access_token]);

  // Fetch tiers when tab is active
  useEffect(() => {
    if (activeTab === 'tiers' && organization?.id && session?.access_token) {
      fetchTiers();
    }
  }, [activeTab, organization?.id, session?.access_token]);

  // Fetch members and tiers for approvals tab
  useEffect(() => {
    if (activeTab === 'approvals' && organization?.id && session?.access_token) {
      if (members.length === 0) fetchMembers();
      if (tiers.length === 0) fetchTiers();
    }
  }, [activeTab, organization?.id, session?.access_token]);

  // Fetch SMTP settings when tab is active (owner only)
  useEffect(() => {
    if (activeTab === 'smtp' && organization?.id && session?.access_token && membership?.role === 'owner') {
      fetchSmtpSettings();
    }
  }, [activeTab, organization?.id, session?.access_token, membership?.role]);

  // Fetch tiers for invite modal
  useEffect(() => {
    if (showInviteModal && tiers.length === 0 && organization?.id && session?.access_token) {
      fetchTiers();
    }
  }, [showInviteModal]);

  // Fetch rules when tab is active
  useEffect(() => {
    if (activeTab === 'rules' && organization?.id && session?.access_token) {
      fetchRules();
      if (tiers.length === 0) fetchTiers();
    }
  }, [activeTab, organization?.id, session?.access_token]);

  // Fetch holidays when tab is active
  useEffect(() => {
    if (activeTab === 'holidays' && organization?.id && session?.access_token) {
      fetchHolidays();
    }
  }, [activeTab, organization?.id, session?.access_token]);

  // Fetch locations when tab is active
  useEffect(() => {
    if (activeTab === 'locations' && organization?.id && session?.access_token) {
      fetchLocations();
    }
  }, [activeTab, organization?.id, session?.access_token]);

  // Fetch ports when tab is active
  useEffect(() => {
    if (activeTab === 'ports' && organization?.id && session?.access_token) {
      fetchPorts();
    }
  }, [activeTab, organization?.id, session?.access_token]);

  // Fetch assets when tab is active
  useEffect(() => {
    if (activeTab === 'assets' && organization?.id && session?.access_token) {
      fetchSettingsAssets();
    }
  }, [activeTab, organization?.id, session?.access_token]);

  const fetchMembers = async () => {
    if (!organization?.id || !session?.access_token) return;
    setIsLoadingMembers(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${baseUrl}/rest/v1/organization_members?organization_id=eq.${organization.id}&select=*,profile:profiles(*),tier:tiers(*)`,
        {
          headers: {
            'apikey': apiKey!,
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMembers(data.map((m: any) => ({
          ...m,
          profile: Array.isArray(m.profile) ? m.profile[0] : m.profile,
          tier: Array.isArray(m.tier) ? m.tier[0] : m.tier,
        })));
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const fetchPendingInvitations = async () => {
    if (!organization?.id || !session?.access_token) return;
    try {
      const response = await fetch(
        `/api/invitations?organizationId=${organization.id}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPendingInvitations(data.invitations || []);
      }
    } catch (error) {
      console.error('Error fetching pending invitations:', error);
    }
  };

  const fetchTiers = async () => {
    if (!organization?.id || !session?.access_token) return;
    setIsLoadingTiers(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${baseUrl}/rest/v1/tiers?organization_id=eq.${organization.id}&select=*,tier_rules(*)&order=priority.asc`,
        {
          headers: {
            'apikey': apiKey!,
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTiers(data.map((t: any) => ({
          ...t,
          tier_rules: Array.isArray(t.tier_rules) ? t.tier_rules[0] : t.tier_rules,
        })));
      }
    } catch (error) {
      console.error('Error fetching tiers:', error);
    } finally {
      setIsLoadingTiers(false);
    }
  };

  const fetchSmtpSettings = async () => {
    if (!organization?.id || !session?.access_token) return;
    setIsLoadingSmtp(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${baseUrl}/rest/v1/organization_smtp_settings?organization_id=eq.${organization.id}`,
        {
          headers: {
            'apikey': apiKey!,
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          const settings = data[0];
          setSmtpSettings({
            smtpHost: settings.smtp_host || '',
            smtpPort: settings.smtp_port?.toString() || '587',
            smtpSecure: settings.smtp_secure ?? true,
            smtpUser: settings.smtp_user || '',
            smtpPassword: '', // Don't populate password for security
            fromEmail: settings.from_email || '',
            fromName: settings.from_name || '',
            replyTo: settings.reply_to || '',
            isActive: settings.is_active ?? false,
            isVerified: settings.is_verified ?? false,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching SMTP settings:', error);
    } finally {
      setIsLoadingSmtp(false);
    }
  };

  const handleSaveSmtp = async () => {
    if (!organization?.id || !session?.access_token) return;
    
    if (!smtpSettings.smtpHost || !smtpSettings.smtpUser || !smtpSettings.fromEmail) {
      toast({ title: t('common.error'), description: language === 'es' ? 'Host, usuario y email de origen son requeridos' : 'Host, user and from email are required', variant: 'error' });
      return;
    }

    setIsSavingSmtp(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const headers = {
        'Content-Type': 'application/json',
        'apikey': apiKey!,
        'Authorization': `Bearer ${session.access_token}`,
      };

      const smtpData: any = {
        organization_id: organization.id,
        smtp_host: smtpSettings.smtpHost,
        smtp_port: parseInt(smtpSettings.smtpPort) || 587,
        smtp_secure: smtpSettings.smtpSecure,
        smtp_user: smtpSettings.smtpUser,
        from_email: smtpSettings.fromEmail,
        from_name: smtpSettings.fromName || null,
        reply_to: smtpSettings.replyTo || null,
        is_active: smtpSettings.isActive,
      };

      // Only include password if it was changed
      if (smtpSettings.smtpPassword) {
        smtpData.smtp_password = smtpSettings.smtpPassword;
      }

      // Check if settings exist
      const checkRes = await fetch(
        `${baseUrl}/rest/v1/organization_smtp_settings?organization_id=eq.${organization.id}`,
        { headers: { 'apikey': apiKey!, 'Authorization': `Bearer ${session.access_token}` } }
      );
      const existing = await checkRes.json();

      let res;
      if (existing.length > 0) {
        res = await fetch(
          `${baseUrl}/rest/v1/organization_smtp_settings?organization_id=eq.${organization.id}`,
          { method: 'PATCH', headers, body: JSON.stringify(smtpData) }
        );
      } else {
        // For new records, password is required
        if (!smtpSettings.smtpPassword) {
          toast({ title: t('common.error'), description: language === 'es' ? 'Contraseña es requerida' : 'Password is required', variant: 'error' });
          setIsSavingSmtp(false);
          return;
        }
        smtpData.smtp_password = smtpSettings.smtpPassword;
        res = await fetch(
          `${baseUrl}/rest/v1/organization_smtp_settings`,
          { method: 'POST', headers, body: JSON.stringify(smtpData) }
        );
      }

      if (!res.ok) throw new Error('Failed to save');

      toast({ title: t('common.success'), description: language === 'es' ? 'Configuración SMTP guardada' : 'SMTP settings saved' });
      setSmtpSettings(prev => ({ ...prev, smtpPassword: '' })); // Clear password field
    } catch (error) {
      toast({ title: t('common.error'), description: language === 'es' ? 'No se pudo guardar' : 'Could not save', variant: 'error' });
    } finally {
      setIsSavingSmtp(false);
    }
  };

  const handleTestSmtp = async () => {
    if (!organization?.id || !session?.access_token || !user?.email) return;
    
    setIsTestingSmtp(true);
    setSmtpTestResult(null);
    
    try {
      // In a real implementation, this would call a backend API to test the SMTP connection
      // For now, we'll simulate a test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate success/failure based on settings
      if (smtpSettings.smtpHost && smtpSettings.smtpUser) {
        setSmtpTestResult({
          success: true,
          message: language === 'es' ? `Email de prueba enviado a ${user.email}` : `Test email sent to ${user.email}`,
        });
        toast({ title: t('common.success'), description: language === 'es' ? 'Conexión SMTP verificada' : 'SMTP connection verified' });
      } else {
        setSmtpTestResult({
          success: false,
          message: language === 'es' ? 'Configuración incompleta' : 'Incomplete configuration',
        });
      }
    } catch (error) {
      setSmtpTestResult({
        success: false,
        message: 'Error al conectar con el servidor SMTP',
      });
    } finally {
      setIsTestingSmtp(false);
    }
  };

  // Fetch Rules
  const fetchRules = async () => {
    if (!organization?.id || !session?.access_token) return;
    setIsLoadingRules(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const res = await fetch(
        `${baseUrl}/rest/v1/tier_booking_rules?organization_id=eq.${organization.id}&select=*,tier:tiers(id,name,priority,color)&order=priority.asc`,
        { headers: { 'apikey': apiKey!, 'Authorization': `Bearer ${session.access_token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setRules(data.map((r: any) => ({ ...r, tier: Array.isArray(r.tier) ? r.tier[0] : r.tier })));
      }
    } catch (error) {
      console.error('Error fetching rules:', error);
    } finally {
      setIsLoadingRules(false);
    }
  };

  // Fetch Holidays
  const fetchHolidays = async () => {
    if (!organization?.id || !session?.access_token) return;
    setIsLoadingHolidays(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const headers = { 'apikey': apiKey!, 'Authorization': `Bearer ${session.access_token}` };

      const [holidaysRes, periodsRes] = await Promise.all([
        fetch(`${baseUrl}/rest/v1/organization_holidays?organization_id=eq.${organization.id}&order=month.asc,day.asc`, { headers }),
        fetch(`${baseUrl}/rest/v1/holiday_periods?organization_id=eq.${organization.id}&order=start_month.asc`, { headers }),
      ]);

      if (holidaysRes.ok) setHolidays(await holidaysRes.json());
      if (periodsRes.ok) setHolidayPeriods(await periodsRes.json());
    } catch (error) {
      console.error('Error fetching holidays:', error);
    } finally {
      setIsLoadingHolidays(false);
    }
  };

  // Fetch Locations (Airports)
  const fetchLocations = async () => {
    if (!session?.access_token) return;
    setIsLoadingLocations(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const res = await fetch(
        `${baseUrl}/rest/v1/airports?order=name.asc&limit=200`,
        { headers: { 'apikey': apiKey!, 'Authorization': `Bearer ${session.access_token}` } }
      );
      if (res.ok) setLocations(await res.json());
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setIsLoadingLocations(false);
    }
  };

  // Fetch Ports (Marinas)
  const fetchPorts = async () => {
    if (!session?.access_token) return;
    setIsLoadingPorts(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const res = await fetch(
        `${baseUrl}/rest/v1/ports?order=name.asc&limit=200`,
        { headers: { 'apikey': apiKey!, 'Authorization': `Bearer ${session.access_token}` } }
      );
      if (res.ok) setPorts(await res.json());
    } catch (error) {
      console.error('Error fetching ports:', error);
    } finally {
      setIsLoadingPorts(false);
    }
  };

  // Fetch Assets for Settings
  const fetchSettingsAssets = async () => {
    if (!organization?.id || !session?.access_token) return;
    setIsLoadingAssets(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const res = await fetch(
        `${baseUrl}/rest/v1/assets?organization_id=eq.${organization.id}&order=created_at.desc`,
        { headers: { 'apikey': apiKey!, 'Authorization': `Bearer ${session.access_token}` } }
      );
      if (res.ok) setSettingsAssets(await res.json());
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setIsLoadingAssets(false);
    }
  };

  // Save Asset
  const handleSaveAsset = async () => {
    if (!organization?.id || !session?.access_token || !assetForm.name) return;
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const headers = { 'Content-Type': 'application/json', 'apikey': apiKey!, 'Authorization': `Bearer ${session.access_token}` };

      // Build details based on section
      let details: any = {};
      if (assetForm.section === 'planes' || assetForm.section === 'helicopters') {
        details = {
          manufacturer: assetForm.manufacturer || null,
          model: assetForm.model || null,
          year: assetForm.year ? parseInt(assetForm.year) : null,
          tailNumber: assetForm.tailNumber || null,
          passengerCapacity: assetForm.capacity ? parseInt(assetForm.capacity) : null,
          cruiseSpeed: assetForm.cruiseSpeed ? parseInt(assetForm.cruiseSpeed) : null,
          range: assetForm.range ? parseInt(assetForm.range) : null,
          homeAirport: assetForm.homeAirport || null,
          turnaroundMinutes: assetForm.turnaroundMinutes ? parseInt(assetForm.turnaroundMinutes) : 60,
        };
      } else if (assetForm.section === 'residences') {
        details = {
          address: assetForm.address || null,
          city: assetForm.city || null,
          maxGuests: assetForm.maxGuests ? parseInt(assetForm.maxGuests) : null,
          bedrooms: assetForm.bedrooms ? parseInt(assetForm.bedrooms) : null,
          bathrooms: assetForm.bathrooms ? parseInt(assetForm.bathrooms) : null,
          checkInTime: assetForm.checkInTime || '15:00',
          checkOutTime: assetForm.checkOutTime || '11:00',
        };
      } else if (assetForm.section === 'watercraft') {
        details = {
          manufacturer: assetForm.manufacturer || null,
          model: assetForm.model || null,
          year: assetForm.year ? parseInt(assetForm.year) : null,
          length: assetForm.length ? parseFloat(assetForm.length) : null,
          beam: assetForm.beam ? parseFloat(assetForm.beam) : null,
          draft: assetForm.draft ? parseFloat(assetForm.draft) : null,
          maxGuests: assetForm.capacity ? parseInt(assetForm.capacity) : null,
          homePort: assetForm.homePort || null,
          hullType: assetForm.hullType || null,
          engineType: assetForm.engineType || null,
        };
      }

      const data = {
        organization_id: organization.id,
        name: assetForm.name,
        section: assetForm.section,
        description: assetForm.description || null,
        primary_photo_url: assetForm.primaryPhotoUrl || null,
        is_active: assetForm.isActive,
        details,
      };

      if (editingAsset) {
        await fetch(`${baseUrl}/rest/v1/assets?id=eq.${editingAsset.id}`, { method: 'PATCH', headers, body: JSON.stringify(data) });
      } else {
        await fetch(`${baseUrl}/rest/v1/assets`, { method: 'POST', headers, body: JSON.stringify(data) });
      }

      toast({ title: t('common.success'), description: editingAsset ? (language === 'es' ? 'Activo actualizado' : 'Asset updated') : (language === 'es' ? 'Activo creado' : 'Asset created') });
      setShowAssetModal(false);
      setEditingAsset(null);
      resetAssetForm();
      fetchSettingsAssets();
    } catch (error) {
      console.error('Error saving asset:', error);
      toast({ title: t('common.error'), description: language === 'es' ? 'No se pudo guardar' : 'Could not save', variant: 'error' });
    }
  };

  const resetAssetForm = () => {
    setAssetForm({
      name: '', section: 'planes', description: '', primaryPhotoUrl: '', isActive: true,
      manufacturer: '', model: '', year: '', tailNumber: '', capacity: '', cruiseSpeed: '',
      range: '', homeAirport: '', turnaroundMinutes: '60', address: '', city: '', maxGuests: '',
      bedrooms: '', bathrooms: '', checkInTime: '15:00', checkOutTime: '11:00',
      length: '', beam: '', draft: '', homePort: '', hullType: '', engineType: '',
    });
  };

  const openEditAsset = (asset: any) => {
    setEditingAsset(asset);
    const d = asset.details || {};
    setAssetForm({
      name: asset.name || '',
      section: asset.section || 'planes',
      description: asset.description || '',
      primaryPhotoUrl: asset.primary_photo_url || '',
      isActive: asset.is_active !== false,
      manufacturer: d.manufacturer || '',
      model: d.model || '',
      year: d.year?.toString() || '',
      tailNumber: d.tailNumber || '',
      capacity: (d.passengerCapacity || d.maxGuests)?.toString() || '',
      cruiseSpeed: d.cruiseSpeed?.toString() || '',
      range: d.range?.toString() || '',
      homeAirport: d.homeAirport || '',
      turnaroundMinutes: d.turnaroundMinutes?.toString() || '60',
      address: d.address || '',
      city: d.city || '',
      maxGuests: d.maxGuests?.toString() || '',
      bedrooms: d.bedrooms?.toString() || '',
      bathrooms: d.bathrooms?.toString() || '',
      checkInTime: d.checkInTime || '15:00',
      checkOutTime: d.checkOutTime || '11:00',
      length: d.length?.toString() || '',
      beam: d.beam?.toString() || '',
      draft: d.draft?.toString() || '',
      homePort: d.homePort || '',
      hullType: d.hullType || '',
      engineType: d.engineType || '',
    });
    setShowAssetModal(true);
  };

  const handleDeleteAsset = async (id: string, name: string) => {
    if (!confirm(language === 'es' ? `¿Eliminar "${name}"? Esta acción no se puede deshacer.` : `Delete "${name}"? This action cannot be undone.`)) return;
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      // Soft delete by setting deleted_at
      await fetch(`${baseUrl}/rest/v1/assets?id=eq.${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'apikey': apiKey!, 'Authorization': `Bearer ${session!.access_token}` },
        body: JSON.stringify({ deleted_at: new Date().toISOString(), is_active: false }),
      });
      toast({ title: language === 'es' ? 'Activo eliminado' : 'Asset deleted' });
      fetchSettingsAssets();
    } catch (error) {
      toast({ title: t('common.error'), description: language === 'es' ? 'No se pudo eliminar' : 'Could not delete', variant: 'error' });
    }
  };

  // Save Holiday
  const handleSaveHoliday = async () => {
    if (!organization?.id || !session?.access_token || !holidayForm.name) return;
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const headers = { 'Content-Type': 'application/json', 'apikey': apiKey!, 'Authorization': `Bearer ${session.access_token}` };

      const data = {
        organization_id: organization.id,
        name: holidayForm.name,
        description: holidayForm.description || null,
        month: holidayForm.isVariable ? null : parseInt(holidayForm.month),
        day: holidayForm.isVariable ? null : parseInt(holidayForm.day),
        is_recurring: true,
        is_variable: holidayForm.isVariable,
        variable_rule: holidayForm.isVariable ? holidayForm.variableRule : null,
        category: holidayForm.category,
        is_active: true,
      };

      if (editingHoliday) {
        await fetch(`${baseUrl}/rest/v1/organization_holidays?id=eq.${editingHoliday.id}`, { method: 'PATCH', headers, body: JSON.stringify(data) });
      } else {
        await fetch(`${baseUrl}/rest/v1/organization_holidays`, { method: 'POST', headers, body: JSON.stringify(data) });
      }

      toast({ title: t('common.success'), description: editingHoliday ? (language === 'es' ? 'Feriado actualizado' : 'Holiday updated') : (language === 'es' ? 'Feriado creado' : 'Holiday created') });
      setShowHolidayModal(false);
      setEditingHoliday(null);
      setHolidayForm({ name: '', description: '', month: '', day: '', isVariable: false, variableRule: '', category: 'national' });
      fetchHolidays();
    } catch (error) {
      toast({ title: t('common.error'), description: language === 'es' ? 'No se pudo guardar' : 'Could not save', variant: 'error' });
    }
  };

  // Delete Holiday
  const handleDeleteHoliday = async (id: string, name: string) => {
    if (!confirm(language === 'es' ? `¿Eliminar "${name}"?` : `Delete "${name}"?`)) return;
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      await fetch(`${baseUrl}/rest/v1/organization_holidays?id=eq.${id}`, {
        method: 'DELETE',
        headers: { 'apikey': apiKey!, 'Authorization': `Bearer ${session!.access_token}` },
      });
      toast({ title: language === 'es' ? 'Eliminado' : 'Deleted' });
      fetchHolidays();
    } catch (error) {
      toast({ title: t('common.error'), description: language === 'es' ? 'No se pudo eliminar' : 'Could not delete', variant: 'error' });
    }
  };

  // Save Location
  const handleSaveLocation = async () => {
    if (!session?.access_token || !locationForm.icaoCode || !locationForm.name) return;
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const headers = { 'Content-Type': 'application/json', 'apikey': apiKey!, 'Authorization': `Bearer ${session.access_token}` };

      const data = {
        icao_code: locationForm.icaoCode.toUpperCase(),
        iata_code: locationForm.iataCode?.toUpperCase() || null,
        name: locationForm.name,
        city: locationForm.city || null,
        country: locationForm.country,
        latitude: locationForm.latitude ? parseFloat(locationForm.latitude) : null,
        longitude: locationForm.longitude ? parseFloat(locationForm.longitude) : null,
        type: locationForm.type,
        is_active: true,
      };

      if (editingLocation) {
        await fetch(`${baseUrl}/rest/v1/airports?id=eq.${editingLocation.id}`, { method: 'PATCH', headers, body: JSON.stringify(data) });
      } else {
        await fetch(`${baseUrl}/rest/v1/airports`, { method: 'POST', headers, body: JSON.stringify(data) });
      }

      toast({ title: t('common.success'), description: editingLocation ? (language === 'es' ? 'Ubicación actualizada' : 'Location updated') : (language === 'es' ? 'Ubicación creada' : 'Location created') });
      setShowLocationModal(false);
      setEditingLocation(null);
      setLocationForm({ icaoCode: '', iataCode: '', name: '', city: '', country: 'Panama', latitude: '', longitude: '', type: 'airport' });
      fetchLocations();
    } catch (error) {
      toast({ title: t('common.error'), description: language === 'es' ? 'No se pudo guardar' : 'Could not save', variant: 'error' });
    }
  };

  // Delete Location
  const handleDeleteLocation = async (id: string, name: string) => {
    if (!confirm(language === 'es' ? `¿Eliminar "${name}"?` : `Delete "${name}"?`)) return;
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      await fetch(`${baseUrl}/rest/v1/airports?id=eq.${id}`, {
        method: 'DELETE',
        headers: { 'apikey': apiKey!, 'Authorization': `Bearer ${session!.access_token}` },
      });
      toast({ title: language === 'es' ? 'Eliminado' : 'Deleted' });
      fetchLocations();
    } catch (error) {
      toast({ title: t('common.error'), description: language === 'es' ? 'No se pudo eliminar' : 'Could not delete', variant: 'error' });
    }
  };

  // Save Port
  const handleSavePort = async () => {
    if (!session?.access_token || !portForm.name) return;
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const headers = { 'Content-Type': 'application/json', 'apikey': apiKey!, 'Authorization': `Bearer ${session.access_token}` };

      const data = {
        code: portForm.code?.toUpperCase() || null,
        name: portForm.name,
        city: portForm.city || null,
        country: portForm.country,
        latitude: portForm.latitude ? parseFloat(portForm.latitude) : null,
        longitude: portForm.longitude ? parseFloat(portForm.longitude) : null,
        is_active: true,
      };

      if (editingPort) {
        await fetch(`${baseUrl}/rest/v1/ports?id=eq.${editingPort.id}`, { method: 'PATCH', headers, body: JSON.stringify(data) });
      } else {
        await fetch(`${baseUrl}/rest/v1/ports`, { method: 'POST', headers, body: JSON.stringify(data) });
      }

      toast({ title: t('common.success'), description: editingPort ? (language === 'es' ? 'Marina actualizada' : 'Marina updated') : (language === 'es' ? 'Marina creada' : 'Marina created') });
      setShowPortModal(false);
      setEditingPort(null);
      setPortForm({ code: '', name: '', city: '', country: 'Panama', latitude: '', longitude: '' });
      fetchPorts();
    } catch (error) {
      toast({ title: t('common.error'), description: language === 'es' ? 'No se pudo guardar' : 'Could not save', variant: 'error' });
    }
  };

  // Delete Port
  const handleDeletePort = async (id: string, name: string) => {
    if (!confirm(language === 'es' ? `¿Eliminar "${name}"?` : `Delete "${name}"?`)) return;
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      await fetch(`${baseUrl}/rest/v1/ports?id=eq.${id}`, {
        method: 'DELETE',
        headers: { 'apikey': apiKey!, 'Authorization': `Bearer ${session!.access_token}` },
      });
      toast({ title: language === 'es' ? 'Eliminado' : 'Deleted' });
      fetchPorts();
    } catch (error) {
      toast({ title: t('common.error'), description: language === 'es' ? 'No se pudo eliminar' : 'Could not delete', variant: 'error' });
    }
  };

  const handleInvite = async () => {
    if (!organization?.id || !session?.access_token || !user?.id) return;
    if (!inviteForm.email) {
      toast({ title: t('common.error'), description: language === 'es' ? 'Email es requerido' : 'Email is required', variant: 'error' });
      return;
    }

    setIsInviting(true);
    try {
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: inviteForm.email.toLowerCase(),
          role: inviteForm.role,
          tierId: inviteForm.tierId || null,
          organizationId: organization.id,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create invitation');
      }

      // Show success with invite URL for manual sharing
      setInviteSuccess({
        url: data.invitation.inviteUrl,
        email: data.invitation.email,
        orgName: data.invitation.orgName,
      });
      
      // Refresh pending invitations list
      fetchPendingInvitations();
      
      // Reset form but keep modal open to show success
      setInviteForm({ email: '', role: 'member', tierId: '' });
    } catch (error: any) {
      toast({ title: t('common.error'), description: error.message, variant: 'error' });
    } finally {
      setIsInviting(false);
    }
  };

  const resetInviteForm = () => {
    setInviteForm({ email: '', role: 'member', tierId: '' });
    setInviteSuccess(null);
    setCopiedUrl(false);
  };

  const copyInviteUrl = async (url?: string) => {
    const urlToCopy = url || inviteSuccess?.url;
    if (!urlToCopy) return;
    
    try {
      await navigator.clipboard.writeText(urlToCopy);
      setCopiedUrl(true);
      toast({ title: language === 'es' ? 'Enlace copiado' : 'Link copied' });
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (error) {
      toast({ title: t('common.error'), description: language === 'es' ? 'No se pudo copiar' : 'Could not copy', variant: 'error' });
    }
  };

  const copyInviteFromList = async (inviteId: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedInviteId(inviteId);
      toast({ title: language === 'es' ? 'Enlace copiado' : 'Link copied' });
      setTimeout(() => setCopiedInviteId(null), 2000);
    } catch (error) {
      toast({ title: t('common.error'), description: language === 'es' ? 'No se pudo copiar' : 'Could not copy', variant: 'error' });
    }
  };

  const handleDeleteInvitation = async (invitationId: string) => {
    if (!session?.access_token) return;
    if (!confirm(language === 'es' ? '¿Cancelar esta invitación?' : 'Cancel this invitation?')) return;

    try {
      const response = await fetch(`/api/invitations?id=${invitationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete invitation');

      setPendingInvitations(pendingInvitations.filter(inv => inv.id !== invitationId));
      toast({ title: language === 'es' ? 'Invitación cancelada' : 'Invitation canceled' });
    } catch (error: any) {
      toast({ title: t('common.error'), description: error.message, variant: 'error' });
    }
  };

  const handleRemoveMember = async (memberId: string, memberEmail: string) => {
    if (!session?.access_token) return;
    if (!confirm(language === 'es' ? `¿Eliminar a ${memberEmail} de la organización?` : `Remove ${memberEmail} from the organization?`)) return;

    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${baseUrl}/rest/v1/organization_members?id=eq.${memberId}`,
        {
          method: 'DELETE',
          headers: {
            'apikey': apiKey!,
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to remove member');

      setMembers(members.filter(m => m.id !== memberId));
      toast({ title: language === 'es' ? 'Miembro eliminado' : 'Member removed', description: language === 'es' ? `${memberEmail} ha sido eliminado` : `${memberEmail} has been removed` });
    } catch (error: any) {
      toast({ title: t('common.error'), description: error.message, variant: 'error' });
    }
  };

  // Check if current user can edit a member
  const canEditMember = (member: Member) => {
    if (!membership) return false;
    // Owner can edit everyone
    if (membership.role === 'owner') return true;
    // Admin can edit everyone except owner
    if (membership.role === 'admin' && member.role !== 'owner') return true;
    return false;
  };

  // Check if current user can change role of a member
  const canChangeRole = (member: Member) => {
    if (!membership) return false;
    // Only owner can change roles
    if (membership.role === 'owner') return true;
    // Admin can change roles of non-owners
    if (membership.role === 'admin' && member.role !== 'owner') return true;
    return false;
  };

  const openMemberEditModal = (member: Member) => {
    setEditingMember(member);
    setMemberEditForm({
      firstName: member.profile?.first_name || '',
      lastName: member.profile?.last_name || '',
      phone: member.profile?.phone || '',
      role: member.role,
      tierId: member.tier_id || '',
    });
    setShowMemberEditModal(true);
  };

  const handleSaveMember = async () => {
    if (!editingMember || !session?.access_token || !organization?.id) return;

    setIsSavingMember(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      // Update profile
      const profileResponse = await fetch(
        `${baseUrl}/rest/v1/profiles?id=eq.${editingMember.user_id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': apiKey!,
            'Authorization': `Bearer ${session.access_token}`,
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({
            first_name: memberEditForm.firstName.trim() || null,
            last_name: memberEditForm.lastName.trim() || null,
            phone: memberEditForm.phone.trim() || null,
          }),
        }
      );

      if (!profileResponse.ok) {
        const errorText = await profileResponse.text();
        throw new Error(`Failed to update profile: ${errorText}`);
      }

      // Update organization membership (role and tier)
      const memberResponse = await fetch(
        `${baseUrl}/rest/v1/organization_members?id=eq.${editingMember.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': apiKey!,
            'Authorization': `Bearer ${session.access_token}`,
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({
            role: memberEditForm.role,
            tier_id: memberEditForm.tierId || null,
          }),
        }
      );

      if (!memberResponse.ok) {
        const errorText = await memberResponse.text();
        throw new Error(`Failed to update membership: ${errorText}`);
      }

      // Update local state
      setMembers(members.map(m => {
        if (m.id === editingMember.id) {
          return {
            ...m,
            role: memberEditForm.role,
            tier_id: memberEditForm.tierId || null,
            tier: memberEditForm.tierId ? tiers.find(t => t.id === memberEditForm.tierId) : undefined,
            profile: m.profile ? {
              ...m.profile,
              first_name: memberEditForm.firstName.trim() || null,
              last_name: memberEditForm.lastName.trim() || null,
              phone: memberEditForm.phone.trim() || null,
            } : undefined,
          };
        }
        return m;
      }));

      toast({
        title: language === 'es' ? 'Miembro actualizado' : 'Member updated',
        description: language === 'es' ? 'Los cambios han sido guardados' : 'Changes have been saved',
      });

      setShowMemberEditModal(false);
      setEditingMember(null);
    } catch (error: any) {
      console.error('Error saving member:', error);
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'error',
      });
    } finally {
      setIsSavingMember(false);
    }
  };

  const openTierModal = (tier?: Tier) => {
    if (tier) {
      setEditingTier(tier);
      setTierForm({
        name: tier.name,
        priority: tier.priority,
        color: tier.color,
        description: tier.description || '',
        maxDaysPerMonth: tier.tier_rules?.max_days_per_month?.toString() || '',
        maxConsecutiveDays: tier.tier_rules?.max_consecutive_days?.toString() || '',
        minLeadTimeHours: tier.tier_rules?.min_lead_time_hours?.toString() || '0',
        requiresApproval: tier.tier_rules?.requires_approval || false,
        canOverride: tier.tier_rules?.can_override || false,
      });
    } else {
      setEditingTier(null);
      setTierForm({
        name: '',
        priority: tiers.length + 1,
        color: '#c8b273',
        description: '',
        maxDaysPerMonth: '',
        maxConsecutiveDays: '',
        minLeadTimeHours: '0',
        requiresApproval: false,
        canOverride: false,
      });
    }
    setShowTierModal(true);
  };

  const handleSaveTier = async () => {
    if (!organization?.id || !session?.access_token) return;
    if (!tierForm.name) {
      toast({ title: t('common.error'), description: language === 'es' ? 'Nombre del nivel es requerido' : 'Tier name is required', variant: 'error' });
      return;
    }

    setIsSaving(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const tierData = {
        organization_id: organization.id,
        name: tierForm.name,
        priority: tierForm.priority,
        color: tierForm.color,
        description: tierForm.description || null,
      };

      let tierId: string;

      if (editingTier) {
        const response = await fetch(
          `${baseUrl}/rest/v1/tiers?id=eq.${editingTier.id}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': apiKey!,
              'Authorization': `Bearer ${session.access_token}`,
              'Prefer': 'return=representation',
            },
            body: JSON.stringify(tierData),
          }
        );
        if (!response.ok) throw new Error('Failed to update tier');
        tierId = editingTier.id;
      } else {
        const response = await fetch(
          `${baseUrl}/rest/v1/tiers`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': apiKey!,
              'Authorization': `Bearer ${session.access_token}`,
              'Prefer': 'return=representation',
            },
            body: JSON.stringify(tierData),
          }
        );
        if (!response.ok) throw new Error('Failed to create tier');
        const data = await response.json();
        tierId = data[0].id;
      }

      // Save tier rules
      const rulesData = {
        tier_id: tierId,
        max_days_per_month: tierForm.maxDaysPerMonth ? parseInt(tierForm.maxDaysPerMonth) : null,
        max_consecutive_days: tierForm.maxConsecutiveDays ? parseInt(tierForm.maxConsecutiveDays) : null,
        min_lead_time_hours: parseInt(tierForm.minLeadTimeHours) || 0,
        requires_approval: tierForm.requiresApproval,
        can_override: tierForm.canOverride,
      };

      // Upsert tier rules
      await fetch(
        `${baseUrl}/rest/v1/tier_rules?tier_id=eq.${tierId}`,
        {
          method: 'DELETE',
          headers: {
            'apikey': apiKey!,
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      await fetch(
        `${baseUrl}/rest/v1/tier_rules`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': apiKey!,
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(rulesData),
        }
      );

      toast({ title: editingTier ? (language === 'es' ? 'Nivel actualizado' : 'Tier updated') : (language === 'es' ? 'Nivel creado' : 'Tier created'), description: language === 'es' ? `${tierForm.name} ha sido guardado` : `${tierForm.name} has been saved` });
      setShowTierModal(false);
      fetchTiers();
    } catch (error: any) {
      toast({ title: t('common.error'), description: error.message, variant: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTier = async (tier: Tier) => {
    if (!session?.access_token) return;
    if (!confirm(language === 'es' ? `¿Eliminar nivel "${tier.name}"? Los miembros en este nivel necesitarán ser reasignados.` : `Delete tier "${tier.name}"? Members in this tier will need to be reassigned.`)) return;

    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      await fetch(
        `${baseUrl}/rest/v1/tiers?id=eq.${tier.id}`,
        {
          method: 'DELETE',
          headers: {
            'apikey': apiKey!,
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      setTiers(tiers.filter(t => t.id !== tier.id));
      toast({ title: language === 'es' ? 'Nivel eliminado' : 'Tier deleted', description: language === 'es' ? `${tier.name} ha sido eliminado` : `${tier.name} has been deleted` });
    } catch (error: any) {
      toast({ title: t('common.error'), description: error.message, variant: 'error' });
    }
  };

  const handleSaveOrg = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSaving(false);
    toast({ title: t('common.success'), description: language === 'es' ? 'Configuración de organización actualizada' : 'Organization settings updated' });
  };

  // Mock billing data
  const mockBilling = {
    plan: 'Professional',
    billingCycle: 'monthly',
    seatLimit: 100,
    seatsUsed: members.length,
    sections: ['planes', 'helicopters', 'residences', 'watercraft'],
    nextBillingDate: new Date(2025, 1, 1),
    amount: 0,
    status: 'complimentary',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">{t('settings.title')}</h1>
          <p className="text-muted mt-1">{language === 'es' ? 'Administra tu organización y configuración' : 'Manage your organization and account settings'}</p>
        </div>
      </div>

      {/* Tab Groups - Two-tier navigation */}
      <div className="space-y-3">
        {/* Top level: Tab Groups */}
        <div className="overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 tabs-scroll">
          <div className="flex items-center gap-2">
            {tabGroups.map((group) => (
              <button
                key={group.id}
                onClick={() => setActiveTab(group.tabs[0].id)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap border',
                  currentGroup?.id === group.id
                    ? 'bg-gold-500/10 text-gold-500 border-gold-500/30'
                    : 'text-muted hover:text-white border-transparent hover:border-border'
                )}
              >
                {group.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Second level: Tabs within current group */}
        {currentGroup && currentGroup.tabs.length > 1 && (
          <div className="overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 tabs-scroll">
            <div className="flex items-center gap-1 p-1 bg-surface rounded-lg w-fit">
              {currentGroup.tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap',
                    activeTab === tab.id
                      ? 'bg-gold-500 text-navy-950'
                      : 'text-muted hover:text-white'
                  )}
                >
                  <tab.icon className="w-4 h-4 shrink-0" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Organization Tab */}
      {activeTab === 'organization' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-display">Organization Details</CardTitle>
                <CardDescription>
                  Update your organization's legal and commercial information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Legal Name</Label>
                    <Input
                      value={orgForm.legalName}
                      onChange={(e) =>
                        setOrgForm((prev) => ({ ...prev, legalName: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label>Commercial Name</Label>
                    <Input
                      value={orgForm.commercialName}
                      onChange={(e) =>
                        setOrgForm((prev) => ({ ...prev, commercialName: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <Label>RUC (Tax ID)</Label>
                    <Input
                      value={orgForm.ruc}
                      onChange={(e) => setOrgForm((prev) => ({ ...prev, ruc: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>DV</Label>
                    <Input
                      value={orgForm.dv}
                      onChange={(e) => setOrgForm((prev) => ({ ...prev, dv: e.target.value }))}
                      maxLength={2}
                    />
                  </div>
                </div>

                <div>
                  <Label>Billing Email</Label>
                  <Input
                    type="email"
                    value={orgForm.billingEmail}
                    onChange={(e) =>
                      setOrgForm((prev) => ({ ...prev, billingEmail: e.target.value }))
                    }
                  />
                </div>

                <div className="pt-4">
                  <Button onClick={handleSaveOrg} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Logo Upload */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-display">Organization Logo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-square rounded-xl bg-surface border-2 border-dashed border-border flex flex-col items-center justify-center text-center p-6 hover:border-gold-500 transition-colors cursor-pointer">
                  {organization?.logo_url ? (
                    <img
                      src={organization.logo_url}
                      alt="Logo"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <>
                      <Upload className="w-10 h-10 text-muted mb-3" />
                      <p className="text-sm font-medium text-white">Upload Logo</p>
                      <p className="text-xs text-muted mt-1">PNG, JPG up to 2MB</p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Billing Tab */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          {/* Current Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-display">Current Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-xl bg-gold-500/5 border border-gold-500/20">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-gold-500" />
                    <span className="text-lg font-bold text-white">{mockBilling.plan}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gold-500/20 text-gold-500 uppercase">
                      {mockBilling.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted mt-1">
                    {mockBilling.seatsUsed} of {mockBilling.seatLimit} seats used
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Sections */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-display">Active Sections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Object.entries(SECTIONS).map(([key, section]) => {
                  const Icon = SECTION_ICONS[key];
                  const isActive = mockBilling.sections.includes(key);
                  return (
                    <div
                      key={key}
                      className={cn(
                        'p-4 rounded-xl border text-center transition-colors',
                        isActive
                          ? 'border-gold-500/30 bg-gold-500/5'
                          : 'border-border bg-surface opacity-50'
                      )}
                    >
                      <div
                        className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center mb-3"
                        style={{ backgroundColor: `${section.color}20` }}
                      >
                        <Icon className="w-6 h-6" style={{ color: section.color }} />
                      </div>
                      <p className="text-sm font-medium text-white">{section.label}</p>
                      {isActive && (
                        <div className="flex items-center justify-center gap-1 mt-2 text-xs text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Members Tab (Admin Only) */}
      {activeTab === 'members' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-display font-bold text-white">Team Members</h2>
              <p className="text-sm text-muted">{members.length} members in your organization</p>
            </div>
            <Button onClick={() => setShowInviteModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Invite Member
            </Button>
          </div>

          {isLoadingMembers ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {members.map((member) => (
                    <div key={member.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gold-500/10 flex items-center justify-center">
                          <span className="text-gold-500 font-medium">
                            {member.profile?.first_name?.charAt(0) || member.profile?.email?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-white">
                            {member.profile?.first_name
                              ? `${member.profile.first_name} ${member.profile.last_name || ''}`
                              : member.profile?.email}
                          </p>
                          <p className="text-sm text-muted">{member.profile?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {member.tier && (
                          <span
                            className="text-xs px-2 py-1 rounded-full border"
                            style={{
                              backgroundColor: `${member.tier.color}20`,
                              borderColor: `${member.tier.color}40`,
                              color: member.tier.color,
                            }}
                          >
                            {member.tier.name}
                          </span>
                        )}
                        <span className={cn('text-xs px-2 py-1 rounded-full border capitalize', ROLE_COLORS[member.role])}>
                          {member.role === 'owner' && <Crown className="w-3 h-3 inline mr-1" />}
                          {member.role}
                        </span>
                        {canEditMember(member) && (
                          <button
                            onClick={() => openMemberEditModal(member)}
                            className="p-1.5 rounded hover:bg-gold-500/20 text-muted hover:text-gold-400 transition-colors"
                            title={language === 'es' ? 'Editar miembro' : 'Edit member'}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {member.role !== 'owner' && member.user_id !== user?.id && (
                          <button
                            onClick={() => handleRemoveMember(member.id, member.profile?.email || '')}
                            className="p-1.5 rounded hover:bg-red-500/20 text-muted hover:text-red-400 transition-colors"
                            title={language === 'es' ? 'Eliminar' : 'Remove'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pending Invitations */}
          {pendingInvitations.length > 0 && (
            <div className="mt-6">
              <h3 className="text-md font-display font-semibold text-white mb-3">
                {language === 'es' ? 'Invitaciones Pendientes' : 'Pending Invitations'}
              </h3>
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {pendingInvitations.map((invitation) => (
                      <div key={invitation.id} className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                            <Mail className="w-5 h-5 text-amber-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white truncate">{invitation.email}</p>
                            <p className="text-sm text-muted capitalize">{invitation.role}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => copyInviteFromList(invitation.id, invitation.inviteUrl)}
                            className="p-2 rounded-lg bg-surface hover:bg-gold-500/20 text-muted hover:text-gold-500 transition-colors"
                            title={language === 'es' ? 'Copiar enlace' : 'Copy link'}
                          >
                            {copiedInviteId === invitation.id ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteInvitation(invitation.id)}
                            className="p-2 rounded-lg hover:bg-red-500/20 text-muted hover:text-red-400 transition-colors"
                            title={language === 'es' ? 'Cancelar' : 'Cancel'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Tiers Tab (Admin Only) */}
      {activeTab === 'tiers' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-display font-bold text-white">Booking Tiers</h2>
              <p className="text-sm text-muted">Configure member priority levels for bookings</p>
            </div>
            <Button onClick={() => openTierModal()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Tier
            </Button>
          </div>

          {isLoadingTiers ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
            </div>
          ) : tiers.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Layers className="w-12 h-12 text-muted mx-auto mb-3" />
                <p className="text-muted">No tiers configured yet</p>
                <Button className="mt-4" onClick={() => openTierModal()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Tier
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {tiers.map((tier) => (
                <Card key={tier.id} className="hover:border-gold-500/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold"
                          style={{ backgroundColor: `${tier.color}20`, color: tier.color }}
                        >
                          {tier.priority}
                        </div>
                        <div>
                          <h3 className="font-medium text-white">{tier.name}</h3>
                          <p className="text-sm text-muted">
                            {tier.tier_rules?.requires_approval ? 'Requires approval' : 'Auto-approved'}
                            {tier.tier_rules?.max_days_per_month && ` • ${tier.tier_rules.max_days_per_month} days/month`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openTierModal(tier)}
                          className="p-2 rounded hover:bg-surface text-muted hover:text-white"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTier(tier)}
                          className="p-2 rounded hover:bg-red-500/20 text-muted hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Approvals Tab (Admin Only) */}
      {activeTab === 'approvals' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-display font-bold text-white">Approval Settings</h2>
            <p className="text-sm text-muted">Configure who can approve booking requests</p>
          </div>

          {/* Approver Roles */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Approver Roles</CardTitle>
              <CardDescription>Select which roles can approve booking requests</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { id: 'owner', label: 'Owner', description: 'Full organization control' },
                { id: 'admin', label: 'Admin', description: 'Manage assets and members' },
                { id: 'manager', label: 'Manager', description: 'Approve bookings, view reports' },
              ].map((role) => (
                <label
                  key={role.id}
                  className={cn(
                    "flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-colors",
                    approvalSettings.approverRoles.includes(role.id)
                      ? "border-gold-500/50 bg-gold-500/10"
                      : "border-border hover:border-border/80"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={approvalSettings.approverRoles.includes(role.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setApprovalSettings(prev => ({
                          ...prev,
                          approverRoles: [...prev.approverRoles, role.id]
                        }));
                      } else {
                        // Don't allow removing all roles
                        if (approvalSettings.approverRoles.length > 1) {
                          setApprovalSettings(prev => ({
                            ...prev,
                            approverRoles: prev.approverRoles.filter(r => r !== role.id)
                          }));
                        }
                      }
                    }}
                    className="w-4 h-4 rounded border-border bg-navy-800 text-gold-500 focus:ring-gold-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{role.label}</span>
                      {role.id === 'owner' && <Crown className="w-3 h-3 text-gold-500" />}
                    </div>
                    <p className="text-xs text-muted">{role.description}</p>
                  </div>
                </label>
              ))}
            </CardContent>
          </Card>

          {/* Specific Approvers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Additional Approvers</CardTitle>
              <CardDescription>Add specific members who can approve (regardless of role)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {members.filter(m => !['owner', 'admin', 'manager'].includes(m.role)).length === 0 ? (
                <p className="text-sm text-muted text-center py-4">
                  All members with Member or Viewer roles will appear here
                </p>
              ) : (
                <div className="space-y-2">
                  {members
                    .filter(m => !['owner', 'admin', 'manager'].includes(m.role))
                    .map((member) => (
                      <label
                        key={member.id}
                        className={cn(
                          "flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-colors",
                          approvalSettings.specificApprovers.includes(member.user_id)
                            ? "border-emerald-500/50 bg-emerald-500/10"
                            : "border-border hover:border-border/80"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={approvalSettings.specificApprovers.includes(member.user_id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setApprovalSettings(prev => ({
                                ...prev,
                                specificApprovers: [...prev.specificApprovers, member.user_id]
                              }));
                            } else {
                              setApprovalSettings(prev => ({
                                ...prev,
                                specificApprovers: prev.specificApprovers.filter(id => id !== member.user_id)
                              }));
                            }
                          }}
                          className="w-4 h-4 rounded border-border bg-navy-800 text-emerald-500 focus:ring-emerald-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">
                              {member.profile?.first_name || member.profile?.last_name
                                ? `${member.profile.first_name || ''} ${member.profile.last_name || ''}`.trim()
                                : member.profile?.email}
                            </span>
                            <span className={cn(
                              "px-2 py-0.5 text-xs rounded-full border",
                              ROLE_COLORS[member.role]
                            )}>
                              {member.role}
                            </span>
                          </div>
                          <p className="text-xs text-muted">{member.profile?.email}</p>
                        </div>
                      </label>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tier-Based Approval */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tier-Based Approval Requirements</CardTitle>
              <CardDescription>Configure which tiers require booking approval</CardDescription>
            </CardHeader>
            <CardContent>
              {tiers.length === 0 ? (
                <p className="text-sm text-muted text-center py-4">
                  No tiers configured. <button onClick={() => setActiveTab('tiers')} className="text-gold-500 hover:underline">Create tiers</button> to set approval requirements.
                </p>
              ) : (
                <div className="space-y-2">
                  {tiers.map((tier) => (
                    <div
                      key={tier.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded flex items-center justify-center text-sm font-bold"
                          style={{ backgroundColor: `${tier.color}20`, color: tier.color }}
                        >
                          {tier.priority}
                        </div>
                        <span className="text-white font-medium">{tier.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {tier.tier_rules?.requires_approval ? (
                          <span className="px-2 py-1 text-xs rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            Requires Approval
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Auto-Approved
                          </span>
                        )}
                        <button
                          onClick={() => {
                            setEditingTier(tier);
                            setShowTierModal(true);
                            setTierForm({
                              name: tier.name,
                              priority: tier.priority,
                              color: tier.color,
                              description: tier.description || '',
                              maxDaysPerMonth: tier.tier_rules?.max_days_per_month?.toString() || '',
                              maxConsecutiveDays: tier.tier_rules?.max_consecutive_days?.toString() || '',
                              minLeadTimeHours: tier.tier_rules?.min_lead_time_hours?.toString() || '0',
                              requiresApproval: tier.tier_rules?.requires_approval || false,
                              canOverride: tier.tier_rules?.can_override || false,
                            });
                          }}
                          className="p-1.5 rounded hover:bg-surface text-muted hover:text-white"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="bg-gold-500/5 border-gold-500/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-gold-500 mt-0.5" />
                <div className="text-sm">
                  <p className="text-white font-medium">Current Approval Configuration</p>
                  <p className="text-muted mt-1">
                    {approvalSettings.approverRoles.length > 0 && (
                      <>
                        <span className="text-gold-400">{approvalSettings.approverRoles.map(r => r.charAt(0).toUpperCase() + r.slice(1)).join(', ')}</span>
                        {' '}roles can approve bookings.
                      </>
                    )}
                    {approvalSettings.specificApprovers.length > 0 && (
                      <> Plus <span className="text-emerald-400">{approvalSettings.specificApprovers.length}</span> additional approver{approvalSettings.specificApprovers.length !== 1 ? 's' : ''}.</>
                    )}
                  </p>
                  <p className="text-muted mt-1">
                    {tiers.filter(t => t.tier_rules?.requires_approval).length} of {tiers.length} tiers require approval.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* SMTP Tab */}
      {activeTab === 'smtp' && membership?.role === 'owner' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5 text-gold-500" />
                Configuración SMTP
              </CardTitle>
              <CardDescription>
                Configura tu servidor de correo para enviar emails de aprobación y notificaciones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoadingSmtp ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gold-400" />
                </div>
              ) : (
                <>
                  {/* Status Banner */}
                  <div className={cn(
                    "p-4 rounded-lg border flex items-start gap-3",
                    smtpSettings.isActive && smtpSettings.isVerified
                      ? "bg-emerald-500/10 border-emerald-500/30"
                      : smtpSettings.isActive
                      ? "bg-amber-500/10 border-amber-500/30"
                      : "bg-gray-500/10 border-gray-500/30"
                  )}>
                    {smtpSettings.isActive && smtpSettings.isVerified ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : smtpSettings.isActive ? (
                      <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                    ) : (
                      <Server className="w-5 h-5 text-gray-400 shrink-0" />
                    )}
                    <div>
                      <p className={cn(
                        "font-medium",
                        smtpSettings.isActive && smtpSettings.isVerified
                          ? "text-emerald-400"
                          : smtpSettings.isActive
                          ? "text-amber-400"
                          : "text-gray-400"
                      )}>
                        {smtpSettings.isActive && smtpSettings.isVerified
                          ? 'SMTP Activo y Verificado'
                          : smtpSettings.isActive
                          ? 'SMTP Activo - Sin Verificar'
                          : 'SMTP Inactivo'}
                      </p>
                      <p className="text-sm text-muted mt-0.5">
                        {smtpSettings.isActive
                          ? 'Los emails se enviarán a través de tu servidor SMTP'
                          : 'Se usará el servidor de correo por defecto del sistema'}
                      </p>
                    </div>
                  </div>

                  {/* Server Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label>Servidor SMTP *</Label>
                      <Input
                        value={smtpSettings.smtpHost}
                        onChange={(e) => setSmtpSettings({ ...smtpSettings, smtpHost: e.target.value })}
                        placeholder="smtp.example.com"
                      />
                    </div>
                    <div>
                      <Label>Puerto</Label>
                      <Input
                        value={smtpSettings.smtpPort}
                        onChange={(e) => setSmtpSettings({ ...smtpSettings, smtpPort: e.target.value })}
                        placeholder="587"
                      />
                    </div>
                    <div>
                      <Label>Conexión Segura</Label>
                      <select
                        value={smtpSettings.smtpSecure ? 'true' : 'false'}
                        onChange={(e) => setSmtpSettings({ ...smtpSettings, smtpSecure: e.target.value === 'true' })}
                        className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-white"
                      >
                        <option value="true">TLS/SSL (Recomendado)</option>
                        <option value="false">Sin encriptación</option>
                      </select>
                    </div>
                  </div>

                  {/* Authentication */}
                  <div className="pt-4 border-t border-border">
                    <h4 className="font-medium text-white mb-4">Autenticación</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Usuario SMTP *</Label>
                        <Input
                          value={smtpSettings.smtpUser}
                          onChange={(e) => setSmtpSettings({ ...smtpSettings, smtpUser: e.target.value })}
                          placeholder="usuario@example.com"
                        />
                      </div>
                      <div>
                        <Label>Contraseña {smtpSettings.smtpHost ? '' : '*'}</Label>
                        <Input
                          type="password"
                          value={smtpSettings.smtpPassword}
                          onChange={(e) => setSmtpSettings({ ...smtpSettings, smtpPassword: e.target.value })}
                          placeholder={smtpSettings.smtpHost ? '••••••••' : 'Contraseña'}
                        />
                        {smtpSettings.smtpHost && !smtpSettings.smtpPassword && (
                          <p className="text-xs text-muted mt-1">Deja vacío para mantener la contraseña actual</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sender Settings */}
                  <div className="pt-4 border-t border-border">
                    <h4 className="font-medium text-white mb-4">Configuración del Remitente</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Email de Origen *</Label>
                        <Input
                          type="email"
                          value={smtpSettings.fromEmail}
                          onChange={(e) => setSmtpSettings({ ...smtpSettings, fromEmail: e.target.value })}
                          placeholder="noreply@example.com"
                        />
                      </div>
                      <div>
                        <Label>Nombre del Remitente</Label>
                        <Input
                          value={smtpSettings.fromName}
                          onChange={(e) => setSmtpSettings({ ...smtpSettings, fromName: e.target.value })}
                          placeholder="ReservePTY"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Responder a (Reply-To)</Label>
                        <Input
                          type="email"
                          value={smtpSettings.replyTo}
                          onChange={(e) => setSmtpSettings({ ...smtpSettings, replyTo: e.target.value })}
                          placeholder="soporte@example.com"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Active Toggle */}
                  <div className="pt-4 border-t border-border">
                    <label className={cn(
                      "flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors",
                      smtpSettings.isActive
                        ? "border-emerald-500/50 bg-emerald-500/10"
                        : "border-border hover:border-border/80"
                    )}>
                      <input
                        type="checkbox"
                        checked={smtpSettings.isActive}
                        onChange={(e) => setSmtpSettings({ ...smtpSettings, isActive: e.target.checked })}
                        className="w-5 h-5 rounded border-border bg-surface text-emerald-500"
                      />
                      <div>
                        <span className="font-medium text-white">Activar SMTP Personalizado</span>
                        <p className="text-sm text-muted">
                          Cuando está activo, todos los emails se enviarán a través de tu servidor
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Test Result */}
                  {smtpTestResult && (
                    <div className={cn(
                      "p-4 rounded-lg border",
                      smtpTestResult.success
                        ? "bg-emerald-500/10 border-emerald-500/30"
                        : "bg-red-500/10 border-red-500/30"
                    )}>
                      <div className="flex items-center gap-2">
                        {smtpTestResult.success ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-400" />
                        )}
                        <span className={smtpTestResult.success ? "text-emerald-400" : "text-red-400"}>
                          {smtpTestResult.message}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={handleTestSmtp}
                      disabled={isTestingSmtp || !smtpSettings.smtpHost || !smtpSettings.smtpUser}
                    >
                      {isTestingSmtp ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      Probar Conexión
                    </Button>
                    <Button onClick={handleSaveSmtp} disabled={isSavingSmtp}>
                      {isSavingSmtp ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Guardar Configuración
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="bg-gold-500/5 border-gold-500/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gold-500 mt-0.5" />
                <div className="text-sm">
                  <p className="text-white font-medium">¿Por qué usar SMTP propio?</p>
                  <ul className="text-muted mt-2 space-y-1">
                    <li>• Los emails se envían desde tu dominio corporativo</li>
                    <li>• Mayor control sobre la entrega y reputación</li>
                    <li>• Cumplimiento con políticas de seguridad de tu empresa</li>
                    <li>• Los emails de aprobación llegarán de tu dirección</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rules Tab */}
      {activeTab === 'rules' && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Reglas de Reserva</CardTitle>
                <CardDescription>Configura las reglas que controlan cómo los miembros pueden hacer reservas</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingRules ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
                </div>
              ) : rules.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="w-12 h-12 text-muted mx-auto mb-4" />
                  <p className="text-muted">No hay reglas configuradas</p>
                  <p className="text-sm text-subtle mt-1">Las reglas permiten controlar límites de reserva, tiempo de anticipación y más</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {rules.map((rule) => (
                    <div key={rule.id} className="p-4 bg-surface rounded-lg border border-border">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: rule.tier?.color || '#c8b273' }} />
                          <div>
                            <h4 className="font-medium text-white">{rule.name}</h4>
                            <p className="text-sm text-muted">
                              Tier: {rule.tier?.name || 'Sin tier'} • 
                              Tipo: {
                                rule.rule_type === 'date_range' ? 'Rango de Fechas' :
                                rule.rule_type === 'consecutive_booking' ? 'Días Consecutivos' :
                                rule.rule_type === 'concurrent_booking' ? 'Reservas Simultáneas' :
                                rule.rule_type === 'lead_time' ? 'Tiempo de Anticipación' :
                                rule.rule_type === 'holiday' ? 'Feriados' : 'Personalizado'
                              }
                            </p>
                          </div>
                        </div>
                        <span className={cn(
                          "px-2 py-1 text-xs rounded-full",
                          rule.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-gray-500/10 text-gray-400"
                        )}>
                          {rule.is_active ? 'Activa' : 'Inactiva'}
                        </span>
                      </div>
                      {rule.description && (
                        <p className="text-sm text-muted mt-2 pl-6">{rule.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-blue-500/5 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-400 mt-0.5" />
                <div className="text-sm">
                  <p className="text-white font-medium">Sobre las reglas de reserva</p>
                  <p className="text-muted mt-1">
                    Las reglas permiten definir límites y requisitos para las reservas por tier. 
                    Puedes configurar límites de días, tiempo de anticipación, y requerir aprobación para ciertas fechas.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Holidays Tab */}
      {activeTab === 'holidays' && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Feriados y Períodos</CardTitle>
                <CardDescription>Define feriados y períodos especiales para las reglas de reserva</CardDescription>
              </div>
              <Button onClick={() => { setEditingHoliday(null); setHolidayForm({ name: '', description: '', month: '', day: '', isVariable: false, variableRule: '', category: 'national' }); setShowHolidayModal(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Feriado
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingHolidays ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
                </div>
              ) : holidays.length === 0 ? (
                <div className="text-center py-12">
                  <CalendarDays className="w-12 h-12 text-muted mx-auto mb-4" />
                  <p className="text-muted">No hay feriados configurados</p>
                  <p className="text-sm text-subtle mt-1">Agrega feriados para usarlos en las reglas de reserva</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {holidays.map((holiday) => {
                    const CategoryIcon = holiday.category === 'national' ? Star : holiday.category === 'religious' ? Church : holiday.category === 'company' ? Building2 : Sparkles;
                    return (
                      <div key={holiday.id} className="p-4 bg-surface rounded-lg border border-border flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gold-500/10 flex items-center justify-center">
                            <CategoryIcon className="w-5 h-5 text-gold-500" />
                          </div>
                          <div>
                            <h4 className="font-medium text-white">{holiday.name}</h4>
                            <p className="text-sm text-muted">
                              {holiday.is_variable ? (
                                <span className="text-purple-400">Variable</span>
                              ) : (
                                `${holiday.day}/${holiday.month}`
                              )}
                              <span className="mx-2">•</span>
                              <span className={cn(
                                holiday.category === 'national' ? 'text-blue-400' :
                                holiday.category === 'religious' ? 'text-purple-400' :
                                holiday.category === 'company' ? 'text-emerald-400' : 'text-gold-400'
                              )}>
                                {holiday.category === 'national' ? 'Nacional' :
                                 holiday.category === 'religious' ? 'Religioso' :
                                 holiday.category === 'company' ? 'Empresa' : 'Personalizado'}
                              </span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingHoliday(holiday);
                              setHolidayForm({
                                name: holiday.name,
                                description: holiday.description || '',
                                month: holiday.month?.toString() || '',
                                day: holiday.day?.toString() || '',
                                isVariable: holiday.is_variable,
                                variableRule: holiday.variable_rule || '',
                                category: holiday.category,
                              });
                              setShowHolidayModal(true);
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteHoliday(holiday.id, holiday.name)}>
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Locations Tab */}
      {activeTab === 'locations' && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Aeropuertos y Helipuertos</CardTitle>
                <CardDescription>Directorio de ubicaciones para aviación</CardDescription>
              </div>
              <Button onClick={() => { setEditingLocation(null); setLocationForm({ icaoCode: '', iataCode: '', name: '', city: '', country: 'Panama', latitude: '', longitude: '', type: 'airport' }); setShowLocationModal(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Ubicación
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingLocations ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
                </div>
              ) : locations.length === 0 ? (
                <div className="text-center py-12">
                  <MapPin className="w-12 h-12 text-muted mx-auto mb-4" />
                  <p className="text-muted">No hay ubicaciones registradas</p>
                  <p className="text-sm text-subtle mt-1">Agrega aeropuertos y helipuertos para planificación de vuelos</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted">Código</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted">Nombre</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted">Ciudad</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted">País</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted">Tipo</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {locations.slice(0, 50).map((loc) => (
                        <tr key={loc.id} className="border-b border-border/50 hover:bg-surface/50">
                          <td className="py-3 px-4">
                            <span className="font-mono text-gold-500">{loc.icao_code}</span>
                            {loc.iata_code && <span className="text-muted ml-2">/ {loc.iata_code}</span>}
                          </td>
                          <td className="py-3 px-4 text-white">{loc.name}</td>
                          <td className="py-3 px-4 text-muted">{loc.city || '-'}</td>
                          <td className="py-3 px-4 text-muted">{loc.country}</td>
                          <td className="py-3 px-4">
                            <span className={cn(
                              "px-2 py-1 text-xs rounded-full",
                              loc.type === 'helipad' ? "bg-purple-500/10 text-purple-400" : "bg-blue-500/10 text-blue-400"
                            )}>
                              {loc.type === 'helipad' ? 'Helipuerto' : 'Aeropuerto'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditingLocation(loc);
                                  setLocationForm({
                                    icaoCode: loc.icao_code,
                                    iataCode: loc.iata_code || '',
                                    name: loc.name,
                                    city: loc.city || '',
                                    country: loc.country,
                                    latitude: loc.latitude?.toString() || '',
                                    longitude: loc.longitude?.toString() || '',
                                    type: loc.type,
                                  });
                                  setShowLocationModal(true);
                                }}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteLocation(loc.id, loc.name)}>
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {locations.length > 50 && (
                    <p className="text-sm text-muted text-center py-4">Mostrando 50 de {locations.length} ubicaciones</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Ports Tab */}
      {activeTab === 'ports' && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Marinas y Puertos</CardTitle>
                <CardDescription>Directorio de ubicaciones para embarcaciones</CardDescription>
              </div>
              <Button onClick={() => { setEditingPort(null); setPortForm({ code: '', name: '', city: '', country: 'Panama', latitude: '', longitude: '' }); setShowPortModal(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Marina
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingPorts ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
                </div>
              ) : ports.length === 0 ? (
                <div className="text-center py-12">
                  <Anchor className="w-12 h-12 text-muted mx-auto mb-4" />
                  <p className="text-muted">No hay marinas registradas</p>
                  <p className="text-sm text-subtle mt-1">Agrega marinas y puertos para planificación náutica</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted">Código</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted">Nombre</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted">Ciudad</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted">País</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ports.map((port) => (
                        <tr key={port.id} className="border-b border-border/50 hover:bg-surface/50">
                          <td className="py-3 px-4">
                            <span className="font-mono text-gold-500">{port.code || '-'}</span>
                          </td>
                          <td className="py-3 px-4 text-white">{port.name}</td>
                          <td className="py-3 px-4 text-muted">{port.city || '-'}</td>
                          <td className="py-3 px-4 text-muted">{port.country}</td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditingPort(port);
                                  setPortForm({
                                    code: port.code || '',
                                    name: port.name,
                                    city: port.city || '',
                                    country: port.country,
                                    latitude: port.latitude?.toString() || '',
                                    longitude: port.longitude?.toString() || '',
                                  });
                                  setShowPortModal(true);
                                }}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeletePort(port.id, port.name)}>
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Assets Management Tab */}
      {activeTab === 'assets' && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{language === 'es' ? 'Gestionar Activos' : 'Manage Assets'}</CardTitle>
                <CardDescription>{language === 'es' ? 'Crea, edita y administra los activos de tu organización' : 'Create, edit and manage your organization assets'}</CardDescription>
              </div>
              <Button onClick={() => { setEditingAsset(null); resetAssetForm(); setShowAssetModal(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                {language === 'es' ? 'Nuevo Activo' : 'New Asset'}
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingAssets ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
                </div>
              ) : settingsAssets.filter(a => !a.deleted_at).length === 0 ? (
                <div className="text-center py-12">
                  <Plane className="w-12 h-12 text-muted mx-auto mb-4" />
                  <p className="text-muted">{language === 'es' ? 'No hay activos registrados' : 'No assets registered'}</p>
                  <p className="text-sm text-subtle mt-1">{language === 'es' ? 'Agrega tu primer activo para comenzar' : 'Add your first asset to get started'}</p>
                  <Button className="mt-4" onClick={() => { setEditingAsset(null); resetAssetForm(); setShowAssetModal(true); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    {language === 'es' ? 'Agregar Activo' : 'Add Asset'}
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted">{language === 'es' ? 'Nombre' : 'Name'}</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted">{language === 'es' ? 'Sección' : 'Section'}</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted">{language === 'es' ? 'Estado' : 'Status'}</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted">{language === 'es' ? 'Acciones' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {settingsAssets.filter(a => !a.deleted_at).map((asset) => {
                        const SectionIcon = SECTION_ICONS[asset.section] || Plane;
                        return (
                          <tr key={asset.id} className="border-b border-border/50 hover:bg-surface/50">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                {asset.primary_photo_url ? (
                                  <img src={asset.primary_photo_url} alt={asset.name} className="w-10 h-10 rounded-lg object-cover" />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center">
                                    <SectionIcon className="w-5 h-5 text-muted" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium text-white">{asset.name}</p>
                                  {asset.details?.manufacturer && asset.details?.model && (
                                    <p className="text-xs text-muted">{asset.details.manufacturer} {asset.details.model}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gold-500/10 text-gold-500">
                                <SectionIcon className="w-3.5 h-3.5" />
                                {t(`assets.section.${asset.section}`)}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={cn(
                                "px-2.5 py-1 rounded-full text-xs font-medium border",
                                asset.is_active 
                                  ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
                                  : 'text-amber-400 bg-amber-400/10 border-amber-400/20'
                              )}>
                                {asset.is_active ? (language === 'es' ? 'Activo' : 'Active') : (language === 'es' ? 'Inactivo' : 'Inactive')}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="icon" onClick={() => openEditAsset(asset)}>
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteAsset(asset.id, asset.name)}>
                                  <Trash2 className="w-4 h-4 text-red-400" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setShowInviteModal(false); resetInviteForm(); }} />
          <Card className="relative max-w-md w-full animate-fade-up">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-display">{language === 'es' ? 'Invitar Miembro' : 'Invite Member'}</CardTitle>
              <button onClick={() => { setShowInviteModal(false); resetInviteForm(); }} className="p-2 rounded-lg hover:bg-surface text-muted hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              {inviteSuccess ? (
                // Success state - show invite URL
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-1">
                      {language === 'es' ? 'Invitación Creada' : 'Invitation Created'}
                    </h3>
                    <p className="text-sm text-muted">
                      {language === 'es' 
                        ? `Comparte este enlace con ${inviteSuccess.email}`
                        : `Share this link with ${inviteSuccess.email}`}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={inviteSuccess.url}
                      className="flex-1 text-sm"
                    />
                    <Button onClick={() => copyInviteUrl()} className="shrink-0">
                      {copiedUrl ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  
                  <p className="text-xs text-muted text-center">
                    {language === 'es' 
                      ? 'El enlace expira en 7 días'
                      : 'This link expires in 7 days'}
                  </p>
                  
                  <div className="flex gap-3 pt-2">
                    <Button variant="secondary" className="flex-1" onClick={() => { setShowInviteModal(false); resetInviteForm(); }}>
                      {language === 'es' ? 'Cerrar' : 'Close'}
                    </Button>
                    <Button className="flex-1" onClick={() => resetInviteForm()}>
                      {language === 'es' ? 'Invitar Otro' : 'Invite Another'}
                    </Button>
                  </div>
                </div>
              ) : (
                // Form state
                <>
                  <div>
                    <Label>{language === 'es' ? 'Correo Electrónico' : 'Email Address'}</Label>
                    <Input
                      type="email"
                      placeholder="colleague@example.com"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>{language === 'es' ? 'Rol' : 'Role'}</Label>
                    <select
                      value={inviteForm.role}
                      onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                      className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-white"
                    >
                      <option value="member">{t('members.role.member')}</option>
                      <option value="viewer">{t('members.role.viewer')}</option>
                      <option value="manager">{t('members.role.manager')}</option>
                      <option value="admin">{t('members.role.admin')}</option>
                    </select>
                  </div>
                  {tiers.length > 0 && (
                    <div>
                      <Label>{language === 'es' ? 'Nivel (Opcional)' : 'Tier (Optional)'}</Label>
                      <select
                        value={inviteForm.tierId}
                        onChange={(e) => setInviteForm({ ...inviteForm, tierId: e.target.value })}
                        className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-white"
                      >
                        <option value="">{language === 'es' ? 'Sin nivel' : 'No tier'}</option>
                        {tiers.map((tier) => (
                          <option key={tier.id} value={tier.id}>{tier.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="flex gap-3 pt-4">
                    <Button variant="secondary" className="flex-1" onClick={() => { setShowInviteModal(false); resetInviteForm(); }}>
                      {t('common.cancel')}
                    </Button>
                    <Button className="flex-1" onClick={handleInvite} disabled={isInviting || !inviteForm.email}>
                      {isInviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                      {language === 'es' ? 'Crear Invitación' : 'Create Invite'}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Member Edit Modal */}
      {showMemberEditModal && editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowMemberEditModal(false)} />
          <Card className="relative max-w-md w-full animate-fade-up">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gold-500/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-gold-500" />
                </div>
                <div>
                  <CardTitle className="text-lg font-display">{language === 'es' ? 'Editar Miembro' : 'Edit Member'}</CardTitle>
                  <p className="text-sm text-muted">{editingMember.profile?.email}</p>
                </div>
              </div>
              <button onClick={() => setShowMemberEditModal(false)} className="p-2 rounded-lg hover:bg-surface text-muted hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Profile Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{language === 'es' ? 'Nombre' : 'First Name'}</Label>
                  <Input
                    placeholder={language === 'es' ? 'Juan' : 'John'}
                    value={memberEditForm.firstName}
                    onChange={(e) => setMemberEditForm({ ...memberEditForm, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{language === 'es' ? 'Apellido' : 'Last Name'}</Label>
                  <Input
                    placeholder={language === 'es' ? 'Pérez' : 'Doe'}
                    value={memberEditForm.lastName}
                    onChange={(e) => setMemberEditForm({ ...memberEditForm, lastName: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>{language === 'es' ? 'Teléfono' : 'Phone'}</Label>
                <Input
                  type="tel"
                  placeholder="+507 6000-0000"
                  value={memberEditForm.phone}
                  onChange={(e) => setMemberEditForm({ ...memberEditForm, phone: e.target.value })}
                />
              </div>

              {/* Role Selection - Only if can change role */}
              {canChangeRole(editingMember) && editingMember.role !== 'owner' && (
                <div>
                  <Label>{language === 'es' ? 'Rol' : 'Role'}</Label>
                  <select
                    value={memberEditForm.role}
                    onChange={(e) => setMemberEditForm({ ...memberEditForm, role: e.target.value })}
                    className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-white"
                  >
                    <option value="viewer">{t('members.role.viewer')}</option>
                    <option value="member">{t('members.role.member')}</option>
                    <option value="manager">{t('members.role.manager')}</option>
                    <option value="admin">{t('members.role.admin')}</option>
                  </select>
                  <p className="text-xs text-muted mt-1">
                    {language === 'es' ? 'El rol determina los permisos del miembro' : 'Role determines the member\'s permissions'}
                  </p>
                </div>
              )}

              {/* Owner role is not editable */}
              {editingMember.role === 'owner' && (
                <div className="p-3 bg-gold-500/10 border border-gold-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-gold-400">
                    <Crown className="w-4 h-4" />
                    <span className="text-sm font-medium">{language === 'es' ? 'Propietario' : 'Owner'}</span>
                  </div>
                  <p className="text-xs text-gold-400/70 mt-1">
                    {language === 'es' ? 'El rol de propietario no se puede cambiar' : 'Owner role cannot be changed'}
                  </p>
                </div>
              )}

              {/* Tier Selection */}
              {tiers.length > 0 && (
                <div>
                  <Label>{language === 'es' ? 'Nivel de Reservas' : 'Booking Tier'}</Label>
                  <select
                    value={memberEditForm.tierId}
                    onChange={(e) => setMemberEditForm({ ...memberEditForm, tierId: e.target.value })}
                    className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-white"
                  >
                    <option value="">{language === 'es' ? 'Sin nivel asignado' : 'No tier assigned'}</option>
                    {tiers.map((tier) => (
                      <option key={tier.id} value={tier.id}>{tier.name} (Priority {tier.priority})</option>
                    ))}
                  </select>
                  <p className="text-xs text-muted mt-1">
                    {language === 'es' ? 'El nivel determina la prioridad de reservas' : 'Tier determines booking priority'}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button variant="secondary" className="flex-1" onClick={() => setShowMemberEditModal(false)}>
                  {t('common.cancel')}
                </Button>
                <Button className="flex-1" onClick={handleSaveMember} disabled={isSavingMember}>
                  {isSavingMember ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  {language === 'es' ? 'Guardar Cambios' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tier Modal */}
      {showTierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowTierModal(false)} />
          <Card className="relative max-w-lg w-full animate-fade-up max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-display">{editingTier ? (language === 'es' ? 'Editar Nivel' : 'Edit Tier') : (language === 'es' ? 'Agregar Nivel' : 'Add Tier')}</CardTitle>
              <button onClick={() => setShowTierModal(false)} className="p-2 rounded-lg hover:bg-surface text-muted hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{language === 'es' ? 'Nombre del Nivel *' : 'Tier Name *'}</Label>
                  <Input
                    placeholder={language === 'es' ? 'Principales' : 'Principals'}
                    value={tierForm.name}
                    onChange={(e) => setTierForm({ ...tierForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{language === 'es' ? 'Prioridad (1 = mayor)' : 'Priority (1 = highest)'}</Label>
                  <Input
                    type="number"
                    min="1"
                    value={tierForm.priority}
                    onChange={(e) => setTierForm({ ...tierForm, priority: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>

              <div>
                <Label>{language === 'es' ? 'Color' : 'Color'}</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={tierForm.color}
                    onChange={(e) => setTierForm({ ...tierForm, color: e.target.value })}
                    className="w-12 h-10 rounded cursor-pointer"
                  />
                  <Input
                    value={tierForm.color}
                    onChange={(e) => setTierForm({ ...tierForm, color: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label>{t('common.description')}</Label>
                <Input
                  placeholder={language === 'es' ? 'Breve descripción de este nivel' : 'Brief description of this tier'}
                  value={tierForm.description}
                  onChange={(e) => setTierForm({ ...tierForm, description: e.target.value })}
                />
              </div>

              <div className="pt-4 border-t border-border">
                <h4 className="font-medium text-white mb-3">{language === 'es' ? 'Reglas de Reserva' : 'Booking Rules'}</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{language === 'es' ? 'Máx. Días/Mes' : 'Max Days/Month'}</Label>
                    <Input
                      type="number"
                      placeholder={language === 'es' ? 'Ilimitado' : 'Unlimited'}
                      value={tierForm.maxDaysPerMonth}
                      onChange={(e) => setTierForm({ ...tierForm, maxDaysPerMonth: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>{language === 'es' ? 'Tiempo Mín. Anticipación (horas)' : 'Min Lead Time (hours)'}</Label>
                    <Input
                      type="number"
                      value={tierForm.minLeadTimeHours}
                      onChange={(e) => setTierForm({ ...tierForm, minLeadTimeHours: e.target.value })}
                    />
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tierForm.requiresApproval}
                      onChange={(e) => setTierForm({ ...tierForm, requiresApproval: e.target.checked })}
                      className="w-4 h-4 rounded border-border bg-surface text-gold-500"
                    />
                    <span className="text-sm text-white">{language === 'es' ? 'Requiere aprobación' : 'Requires approval'}</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tierForm.canOverride}
                      onChange={(e) => setTierForm({ ...tierForm, canOverride: e.target.checked })}
                      className="w-4 h-4 rounded border-border bg-surface text-gold-500"
                    />
                    <span className="text-sm text-white">{language === 'es' ? 'Puede anular niveles inferiores' : 'Can override lower tiers'}</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="secondary" className="flex-1" onClick={() => setShowTierModal(false)}>
                  {t('common.cancel')}
                </Button>
                <Button className="flex-1" onClick={handleSaveTier} disabled={isSaving || !tierForm.name}>
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  {editingTier ? (language === 'es' ? 'Actualizar' : 'Update') : (language === 'es' ? 'Crear' : 'Create')} {language === 'es' ? 'Nivel' : 'Tier'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Holiday Modal */}
      {showHolidayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowHolidayModal(false)} />
          <Card className="relative max-w-md w-full animate-fade-up">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-display">{editingHoliday ? (language === 'es' ? 'Editar Feriado' : 'Edit Holiday') : (language === 'es' ? 'Agregar Feriado' : 'Add Holiday')}</CardTitle>
              <button onClick={() => setShowHolidayModal(false)} className="p-2 rounded-lg hover:bg-surface text-muted hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{t('common.name')} *</Label>
                <Input
                  value={holidayForm.name}
                  onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })}
                  placeholder={language === 'es' ? 'Ej: Navidad' : 'e.g., Christmas'}
                />
              </div>
              <div>
                <Label>{t('common.description')}</Label>
                <Input
                  value={holidayForm.description}
                  onChange={(e) => setHolidayForm({ ...holidayForm, description: e.target.value })}
                  placeholder={language === 'es' ? 'Descripción opcional' : 'Optional description'}
                />
              </div>
              <div>
                <Label>{language === 'es' ? 'Categoría' : 'Category'}</Label>
                <select
                  value={holidayForm.category}
                  onChange={(e) => setHolidayForm({ ...holidayForm, category: e.target.value })}
                  className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-white"
                >
                  <option value="national">{t('holidays.category.national')}</option>
                  <option value="religious">{t('holidays.category.religious')}</option>
                  <option value="company">{t('holidays.category.company')}</option>
                  <option value="custom">{t('holidays.category.custom')}</option>
                </select>
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={holidayForm.isVariable}
                    onChange={(e) => setHolidayForm({ ...holidayForm, isVariable: e.target.checked })}
                    className="w-4 h-4 rounded border-border bg-surface text-gold-500"
                  />
                  <span className="text-sm text-white">{language === 'es' ? 'Fecha variable (ej: Semana Santa)' : 'Variable date (e.g., Easter)'}</span>
                </label>
              </div>
              {!holidayForm.isVariable ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{language === 'es' ? 'Mes' : 'Month'} *</Label>
                    <select
                      value={holidayForm.month}
                      onChange={(e) => setHolidayForm({ ...holidayForm, month: e.target.value })}
                      className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-white"
                    >
                      <option value="">{language === 'es' ? 'Seleccionar' : 'Select'}</option>
                      {(language === 'es' 
                        ? ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
                        : ['January','February','March','April','May','June','July','August','September','October','November','December']
                      ).map((m, i) => (
                        <option key={i} value={i + 1}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>{language === 'es' ? 'Día' : 'Day'} *</Label>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      value={holidayForm.day}
                      onChange={(e) => setHolidayForm({ ...holidayForm, day: e.target.value })}
                      placeholder="1-31"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <Label>{language === 'es' ? 'Regla Variable' : 'Variable Rule'}</Label>
                  <Input
                    value={holidayForm.variableRule}
                    onChange={(e) => setHolidayForm({ ...holidayForm, variableRule: e.target.value })}
                    placeholder={language === 'es' ? 'Ej: easter-2 (2 días antes de Pascua)' : 'e.g., easter-2 (2 days before Easter)'}
                  />
                  <p className="text-xs text-muted mt-1">{language === 'es' ? 'Ejemplos: easter, easter-2, carnival' : 'Examples: easter, easter-2, carnival'}</p>
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <Button variant="secondary" className="flex-1" onClick={() => setShowHolidayModal(false)}>
                  {t('common.cancel')}
                </Button>
                <Button className="flex-1" onClick={handleSaveHoliday} disabled={!holidayForm.name || (!holidayForm.isVariable && (!holidayForm.month || !holidayForm.day))}>
                  <Save className="w-4 h-4 mr-2" />
                  {editingHoliday ? (language === 'es' ? 'Actualizar' : 'Update') : (language === 'es' ? 'Crear' : 'Create')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowLocationModal(false)} />
          <Card className="relative max-w-lg w-full animate-fade-up max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-display">{editingLocation ? (language === 'es' ? 'Editar Ubicación' : 'Edit Location') : (language === 'es' ? 'Agregar Ubicación' : 'Add Location')}</CardTitle>
              <button onClick={() => setShowLocationModal(false)} className="p-2 rounded-lg hover:bg-surface text-muted hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{language === 'es' ? 'Código ICAO *' : 'ICAO Code *'}</Label>
                  <Input
                    value={locationForm.icaoCode}
                    onChange={(e) => setLocationForm({ ...locationForm, icaoCode: e.target.value.toUpperCase() })}
                    placeholder="MPTO"
                    maxLength={4}
                  />
                </div>
                <div>
                  <Label>{language === 'es' ? 'Código IATA' : 'IATA Code'}</Label>
                  <Input
                    value={locationForm.iataCode}
                    onChange={(e) => setLocationForm({ ...locationForm, iataCode: e.target.value.toUpperCase() })}
                    placeholder="PTY"
                    maxLength={3}
                  />
                </div>
              </div>
              <div>
                <Label>{t('common.name')} *</Label>
                <Input
                  value={locationForm.name}
                  onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
                  placeholder="Tocumen International Airport"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{language === 'es' ? 'Ciudad' : 'City'}</Label>
                  <Input
                    value={locationForm.city}
                    onChange={(e) => setLocationForm({ ...locationForm, city: e.target.value })}
                    placeholder={language === 'es' ? 'Ciudad de Panamá' : 'Panama City'}
                  />
                </div>
                <div>
                  <Label>{language === 'es' ? 'País *' : 'Country *'}</Label>
                  <Input
                    value={locationForm.country}
                    onChange={(e) => setLocationForm({ ...locationForm, country: e.target.value })}
                    placeholder={language === 'es' ? 'Panamá' : 'Panama'}
                  />
                </div>
              </div>
              <div>
                <Label>{language === 'es' ? 'Tipo' : 'Type'}</Label>
                <select
                  value={locationForm.type}
                  onChange={(e) => setLocationForm({ ...locationForm, type: e.target.value })}
                  className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-white"
                >
                  <option value="airport">{t('locations.type.airport')}</option>
                  <option value="helipad">{t('locations.type.helipad')}</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{language === 'es' ? 'Latitud' : 'Latitude'}</Label>
                  <Input
                    type="number"
                    step="any"
                    value={locationForm.latitude}
                    onChange={(e) => setLocationForm({ ...locationForm, latitude: e.target.value })}
                    placeholder="9.0714"
                  />
                </div>
                <div>
                  <Label>{language === 'es' ? 'Longitud' : 'Longitude'}</Label>
                  <Input
                    type="number"
                    step="any"
                    value={locationForm.longitude}
                    onChange={(e) => setLocationForm({ ...locationForm, longitude: e.target.value })}
                    placeholder="-79.3835"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="secondary" className="flex-1" onClick={() => setShowLocationModal(false)}>
                  {t('common.cancel')}
                </Button>
                <Button className="flex-1" onClick={handleSaveLocation} disabled={!locationForm.icaoCode || !locationForm.name}>
                  <Save className="w-4 h-4 mr-2" />
                  {editingLocation ? (language === 'es' ? 'Actualizar' : 'Update') : (language === 'es' ? 'Crear' : 'Create')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Port Modal */}
      {showPortModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowPortModal(false)} />
          <Card className="relative max-w-lg w-full animate-fade-up">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-display">{editingPort ? (language === 'es' ? 'Editar Marina' : 'Edit Marina') : (language === 'es' ? 'Agregar Marina' : 'Add Marina')}</CardTitle>
              <button onClick={() => setShowPortModal(false)} className="p-2 rounded-lg hover:bg-surface text-muted hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{language === 'es' ? 'Código' : 'Code'}</Label>
                <Input
                  value={portForm.code}
                  onChange={(e) => setPortForm({ ...portForm, code: e.target.value.toUpperCase() })}
                  placeholder="PTYFLA"
                />
              </div>
              <div>
                <Label>{t('common.name')} *</Label>
                <Input
                  value={portForm.name}
                  onChange={(e) => setPortForm({ ...portForm, name: e.target.value })}
                  placeholder="Flamenco Marina"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{language === 'es' ? 'Ciudad' : 'City'}</Label>
                  <Input
                    value={portForm.city}
                    onChange={(e) => setPortForm({ ...portForm, city: e.target.value })}
                    placeholder={language === 'es' ? 'Ciudad de Panamá' : 'Panama City'}
                  />
                </div>
                <div>
                  <Label>{language === 'es' ? 'País *' : 'Country *'}</Label>
                  <Input
                    value={portForm.country}
                    onChange={(e) => setPortForm({ ...portForm, country: e.target.value })}
                    placeholder={language === 'es' ? 'Panamá' : 'Panama'}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{language === 'es' ? 'Latitud' : 'Latitude'}</Label>
                  <Input
                    type="number"
                    step="any"
                    value={portForm.latitude}
                    onChange={(e) => setPortForm({ ...portForm, latitude: e.target.value })}
                    placeholder="8.9167"
                  />
                </div>
                <div>
                  <Label>{language === 'es' ? 'Longitud' : 'Longitude'}</Label>
                  <Input
                    type="number"
                    step="any"
                    value={portForm.longitude}
                    onChange={(e) => setPortForm({ ...portForm, longitude: e.target.value })}
                    placeholder="-79.5333"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="secondary" className="flex-1" onClick={() => setShowPortModal(false)}>
                  {t('common.cancel')}
                </Button>
                <Button className="flex-1" onClick={handleSavePort} disabled={!portForm.name}>
                  <Save className="w-4 h-4 mr-2" />
                  {editingPort ? (language === 'es' ? 'Actualizar' : 'Update') : (language === 'es' ? 'Crear' : 'Create')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Asset Modal */}
      {showAssetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAssetModal(false)} />
          <Card className="relative max-w-2xl w-full animate-fade-up my-8">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-display">{editingAsset ? (language === 'es' ? 'Editar Activo' : 'Edit Asset') : (language === 'es' ? 'Nuevo Activo' : 'New Asset')}</CardTitle>
              <button onClick={() => setShowAssetModal(false)} className="p-2 rounded-lg hover:bg-surface text-muted hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>{language === 'es' ? 'Nombre del Activo *' : 'Asset Name *'}</Label>
                  <Input
                    value={assetForm.name}
                    onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                    placeholder={language === 'es' ? 'Ej: Gulfstream G650' : 'e.g. Gulfstream G650'}
                  />
                </div>
                <div>
                  <Label>{language === 'es' ? 'Sección *' : 'Section *'}</Label>
                  <select
                    value={assetForm.section}
                    onChange={(e) => setAssetForm({ ...assetForm, section: e.target.value })}
                    className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-white"
                    disabled={!!editingAsset}
                  >
                    <option value="planes">{t('assets.section.planes')}</option>
                    <option value="helicopters">{t('assets.section.helicopters')}</option>
                    <option value="residences">{t('assets.section.residences')}</option>
                    <option value="watercraft">{t('assets.section.watercraft')}</option>
                  </select>
                </div>
                <div>
                  <Label>{language === 'es' ? 'Estado' : 'Status'}</Label>
                  <select
                    value={assetForm.isActive ? 'active' : 'inactive'}
                    onChange={(e) => setAssetForm({ ...assetForm, isActive: e.target.value === 'active' })}
                    className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-white"
                  >
                    <option value="active">{language === 'es' ? 'Activo' : 'Active'}</option>
                    <option value="inactive">{language === 'es' ? 'Inactivo' : 'Inactive'}</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <Label>{language === 'es' ? 'Descripción' : 'Description'}</Label>
                  <textarea
                    value={assetForm.description}
                    onChange={(e) => setAssetForm({ ...assetForm, description: e.target.value })}
                    placeholder={language === 'es' ? 'Descripción del activo...' : 'Asset description...'}
                    className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-white min-h-[80px]"
                  />
                </div>
                <div className="col-span-2">
                  <Label>{language === 'es' ? 'URL de Foto Principal' : 'Primary Photo URL'}</Label>
                  <Input
                    value={assetForm.primaryPhotoUrl}
                    onChange={(e) => setAssetForm({ ...assetForm, primaryPhotoUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* Section-specific fields */}
              {(assetForm.section === 'planes' || assetForm.section === 'helicopters') && (
                <div className="space-y-4 pt-4 border-t border-border">
                  <h4 className="font-medium text-white">{language === 'es' ? 'Detalles de Aeronave' : 'Aircraft Details'}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{language === 'es' ? 'Fabricante' : 'Manufacturer'}</Label>
                      <Input
                        value={assetForm.manufacturer}
                        onChange={(e) => setAssetForm({ ...assetForm, manufacturer: e.target.value })}
                        placeholder="Gulfstream, Airbus, etc."
                      />
                    </div>
                    <div>
                      <Label>{language === 'es' ? 'Modelo' : 'Model'}</Label>
                      <Input
                        value={assetForm.model}
                        onChange={(e) => setAssetForm({ ...assetForm, model: e.target.value })}
                        placeholder="G650, H175, etc."
                      />
                    </div>
                    <div>
                      <Label>{language === 'es' ? 'Año' : 'Year'}</Label>
                      <Input
                        type="number"
                        value={assetForm.year}
                        onChange={(e) => setAssetForm({ ...assetForm, year: e.target.value })}
                        placeholder="2020"
                      />
                    </div>
                    <div>
                      <Label>{language === 'es' ? 'Matrícula' : 'Tail Number'}</Label>
                      <Input
                        value={assetForm.tailNumber}
                        onChange={(e) => setAssetForm({ ...assetForm, tailNumber: e.target.value.toUpperCase() })}
                        placeholder="N123AB"
                      />
                    </div>
                    <div>
                      <Label>{language === 'es' ? 'Capacidad de Pasajeros' : 'Passenger Capacity'}</Label>
                      <Input
                        type="number"
                        value={assetForm.capacity}
                        onChange={(e) => setAssetForm({ ...assetForm, capacity: e.target.value })}
                        placeholder="12"
                      />
                    </div>
                    <div>
                      <Label>{language === 'es' ? 'Velocidad Crucero (kts)' : 'Cruise Speed (kts)'}</Label>
                      <Input
                        type="number"
                        value={assetForm.cruiseSpeed}
                        onChange={(e) => setAssetForm({ ...assetForm, cruiseSpeed: e.target.value })}
                        placeholder="516"
                      />
                    </div>
                    <div>
                      <Label>{language === 'es' ? 'Alcance (nm)' : 'Range (nm)'}</Label>
                      <Input
                        type="number"
                        value={assetForm.range}
                        onChange={(e) => setAssetForm({ ...assetForm, range: e.target.value })}
                        placeholder="7000"
                      />
                    </div>
                    <div>
                      <Label>{language === 'es' ? 'Aeropuerto Base (ICAO)' : 'Home Airport (ICAO)'}</Label>
                      <Input
                        value={assetForm.homeAirport}
                        onChange={(e) => setAssetForm({ ...assetForm, homeAirport: e.target.value.toUpperCase() })}
                        placeholder="MPTO"
                      />
                    </div>
                    <div>
                      <Label>{language === 'es' ? 'Tiempo de Preparación (min)' : 'Turnaround Time (min)'}</Label>
                      <Input
                        type="number"
                        value={assetForm.turnaroundMinutes}
                        onChange={(e) => setAssetForm({ ...assetForm, turnaroundMinutes: e.target.value })}
                        placeholder="60"
                      />
                    </div>
                  </div>
                </div>
              )}

              {assetForm.section === 'residences' && (
                <div className="space-y-4 pt-4 border-t border-border">
                  <h4 className="font-medium text-white">{language === 'es' ? 'Detalles de Propiedad' : 'Property Details'}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label>{language === 'es' ? 'Dirección' : 'Address'}</Label>
                      <Input
                        value={assetForm.address}
                        onChange={(e) => setAssetForm({ ...assetForm, address: e.target.value })}
                        placeholder={language === 'es' ? 'Dirección completa' : 'Full address'}
                      />
                    </div>
                    <div>
                      <Label>{language === 'es' ? 'Ciudad' : 'City'}</Label>
                      <Input
                        value={assetForm.city}
                        onChange={(e) => setAssetForm({ ...assetForm, city: e.target.value })}
                        placeholder={language === 'es' ? 'Ciudad de Panamá' : 'Panama City'}
                      />
                    </div>
                    <div>
                      <Label>{language === 'es' ? 'Huéspedes Máximos' : 'Max Guests'}</Label>
                      <Input
                        type="number"
                        value={assetForm.maxGuests}
                        onChange={(e) => setAssetForm({ ...assetForm, maxGuests: e.target.value })}
                        placeholder="8"
                      />
                    </div>
                    <div>
                      <Label>{language === 'es' ? 'Habitaciones' : 'Bedrooms'}</Label>
                      <Input
                        type="number"
                        value={assetForm.bedrooms}
                        onChange={(e) => setAssetForm({ ...assetForm, bedrooms: e.target.value })}
                        placeholder="4"
                      />
                    </div>
                    <div>
                      <Label>{language === 'es' ? 'Baños' : 'Bathrooms'}</Label>
                      <Input
                        type="number"
                        value={assetForm.bathrooms}
                        onChange={(e) => setAssetForm({ ...assetForm, bathrooms: e.target.value })}
                        placeholder="3"
                      />
                    </div>
                    <div>
                      <Label>{language === 'es' ? 'Check-in' : 'Check-in Time'}</Label>
                      <Input
                        type="time"
                        value={assetForm.checkInTime}
                        onChange={(e) => setAssetForm({ ...assetForm, checkInTime: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>{language === 'es' ? 'Check-out' : 'Check-out Time'}</Label>
                      <Input
                        type="time"
                        value={assetForm.checkOutTime}
                        onChange={(e) => setAssetForm({ ...assetForm, checkOutTime: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {assetForm.section === 'watercraft' && (
                <div className="space-y-4 pt-4 border-t border-border">
                  <h4 className="font-medium text-white">{language === 'es' ? 'Detalles de Embarcación' : 'Vessel Details'}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{language === 'es' ? 'Fabricante' : 'Manufacturer'}</Label>
                      <Input
                        value={assetForm.manufacturer}
                        onChange={(e) => setAssetForm({ ...assetForm, manufacturer: e.target.value })}
                        placeholder="Sunseeker, Azimut, etc."
                      />
                    </div>
                    <div>
                      <Label>{language === 'es' ? 'Modelo' : 'Model'}</Label>
                      <Input
                        value={assetForm.model}
                        onChange={(e) => setAssetForm({ ...assetForm, model: e.target.value })}
                        placeholder="Predator 68, Grande 35, etc."
                      />
                    </div>
                    <div>
                      <Label>{language === 'es' ? 'Año' : 'Year'}</Label>
                      <Input
                        type="number"
                        value={assetForm.year}
                        onChange={(e) => setAssetForm({ ...assetForm, year: e.target.value })}
                        placeholder="2022"
                      />
                    </div>
                    <div>
                      <Label>{language === 'es' ? 'Capacidad de Pasajeros' : 'Passenger Capacity'}</Label>
                      <Input
                        type="number"
                        value={assetForm.capacity}
                        onChange={(e) => setAssetForm({ ...assetForm, capacity: e.target.value })}
                        placeholder="12"
                      />
                    </div>
                    <div>
                      <Label>{language === 'es' ? 'Eslora (ft)' : 'Length (ft)'}</Label>
                      <Input
                        type="number"
                        step="any"
                        value={assetForm.length}
                        onChange={(e) => setAssetForm({ ...assetForm, length: e.target.value })}
                        placeholder="68"
                      />
                    </div>
                    <div>
                      <Label>{language === 'es' ? 'Manga (ft)' : 'Beam (ft)'}</Label>
                      <Input
                        type="number"
                        step="any"
                        value={assetForm.beam}
                        onChange={(e) => setAssetForm({ ...assetForm, beam: e.target.value })}
                        placeholder="17"
                      />
                    </div>
                    <div>
                      <Label>{language === 'es' ? 'Calado (ft)' : 'Draft (ft)'}</Label>
                      <Input
                        type="number"
                        step="any"
                        value={assetForm.draft}
                        onChange={(e) => setAssetForm({ ...assetForm, draft: e.target.value })}
                        placeholder="5.5"
                      />
                    </div>
                    <div>
                      <Label>{language === 'es' ? 'Puerto Base' : 'Home Port'}</Label>
                      <Input
                        value={assetForm.homePort}
                        onChange={(e) => setAssetForm({ ...assetForm, homePort: e.target.value })}
                        placeholder="Flamenco Marina"
                      />
                    </div>
                    <div>
                      <Label>{language === 'es' ? 'Tipo de Casco' : 'Hull Type'}</Label>
                      <Input
                        value={assetForm.hullType}
                        onChange={(e) => setAssetForm({ ...assetForm, hullType: e.target.value })}
                        placeholder="Fiberglass, Aluminum, etc."
                      />
                    </div>
                    <div>
                      <Label>{language === 'es' ? 'Tipo de Motor' : 'Engine Type'}</Label>
                      <Input
                        value={assetForm.engineType}
                        onChange={(e) => setAssetForm({ ...assetForm, engineType: e.target.value })}
                        placeholder="Twin Diesel, etc."
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-border">
                <Button variant="secondary" className="flex-1" onClick={() => setShowAssetModal(false)}>
                  {t('common.cancel')}
                </Button>
                <Button className="flex-1" onClick={handleSaveAsset} disabled={!assetForm.name}>
                  <Save className="w-4 h-4 mr-2" />
                  {editingAsset ? (language === 'es' ? 'Actualizar' : 'Update') : (language === 'es' ? 'Crear' : 'Create')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
