'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { 
  Settings, 
  Users, 
  Shield, 
  Mail,
  Building2,
  Save,
  Loader2,
  Plus,
  Trash2,
  Copy,
  Check,
  AlertCircle,
  TestTube,
  Eye,
  EyeOff
} from 'lucide-react';

// Translation keys
const translations = {
  en: {
    settings: 'Settings',
    organization: 'Organization',
    members: 'Members',
    tiers: 'Tiers',
    email: 'Email Configuration',
    // Organization tab
    orgName: 'Organization Name',
    legalName: 'Legal Name',
    commercialName: 'Commercial Name',
    ruc: 'RUC',
    dv: 'DV',
    billingEmail: 'Billing Email',
    saveChanges: 'Save Changes',
    saving: 'Saving...',
    saved: 'Saved!',
    // Members tab
    inviteMember: 'Invite Member',
    email_address: 'Email Address',
    role: 'Role',
    tier: 'Tier',
    sendInvite: 'Send Invite',
    pendingInvitations: 'Pending Invitations',
    noInvitations: 'No pending invitations',
    copyLink: 'Copy Link',
    linkCopied: 'Link copied!',
    cancelInvite: 'Cancel',
    // Email tab
    smtpConfig: 'SMTP Configuration',
    smtpDescription: 'Configure your organization\'s email server to automatically send invitation emails. If not configured, you can still share invitation links manually.',
    smtpHost: 'SMTP Host',
    smtpHostPlaceholder: 'smtp.gmail.com',
    smtpPort: 'Port',
    smtpUser: 'Username',
    smtpUserPlaceholder: 'your-email@domain.com',
    smtpPassword: 'Password',
    smtpPasswordPlaceholder: 'App-specific password',
    smtpFromEmail: 'From Email',
    smtpFromEmailPlaceholder: 'noreply@yourdomain.com',
    smtpFromName: 'From Name',
    smtpFromNamePlaceholder: 'Your Organization',
    smtpSecure: 'Use TLS/SSL',
    smtpEnabled: 'Enable SMTP',
    testConnection: 'Test Connection',
    testing: 'Testing...',
    testSuccess: 'Connection successful!',
    testFailed: 'Connection failed',
    saveSmtp: 'Save SMTP Settings',
    // Roles
    owner: 'Owner',
    admin: 'Admin',
    manager: 'Manager',
    member: 'Member',
    viewer: 'Viewer',
    // Status messages
    inviteSent: 'Invitation sent successfully!',
    inviteError: 'Failed to send invitation',
    emailSentTo: 'Email sent to',
    shareLinkWith: 'Share this link with',
  },
  es: {
    settings: 'Configuración',
    organization: 'Organización',
    members: 'Miembros',
    tiers: 'Niveles',
    email: 'Configuración de Email',
    // Organization tab
    orgName: 'Nombre de la Organización',
    legalName: 'Nombre Legal',
    commercialName: 'Nombre Comercial',
    ruc: 'RUC',
    dv: 'DV',
    billingEmail: 'Email de Facturación',
    saveChanges: 'Guardar Cambios',
    saving: 'Guardando...',
    saved: '¡Guardado!',
    // Members tab
    inviteMember: 'Invitar Miembro',
    email_address: 'Correo Electrónico',
    role: 'Rol',
    tier: 'Nivel',
    sendInvite: 'Enviar Invitación',
    pendingInvitations: 'Invitaciones Pendientes',
    noInvitations: 'No hay invitaciones pendientes',
    copyLink: 'Copiar Enlace',
    linkCopied: '¡Enlace copiado!',
    cancelInvite: 'Cancelar',
    // Email tab
    smtpConfig: 'Configuración SMTP',
    smtpDescription: 'Configura el servidor de correo de tu organización para enviar automáticamente los emails de invitación. Si no está configurado, puedes compartir los enlaces de invitación manualmente.',
    smtpHost: 'Servidor SMTP',
    smtpHostPlaceholder: 'smtp.gmail.com',
    smtpPort: 'Puerto',
    smtpUser: 'Usuario',
    smtpUserPlaceholder: 'tu-email@dominio.com',
    smtpPassword: 'Contraseña',
    smtpPasswordPlaceholder: 'Contraseña de aplicación',
    smtpFromEmail: 'Email de Origen',
    smtpFromEmailPlaceholder: 'noreply@tudominio.com',
    smtpFromName: 'Nombre de Origen',
    smtpFromNamePlaceholder: 'Tu Organización',
    smtpSecure: 'Usar TLS/SSL',
    smtpEnabled: 'Habilitar SMTP',
    testConnection: 'Probar Conexión',
    testing: 'Probando...',
    testSuccess: '¡Conexión exitosa!',
    testFailed: 'Conexión fallida',
    saveSmtp: 'Guardar Configuración SMTP',
    // Roles
    owner: 'Propietario',
    admin: 'Administrador',
    manager: 'Gerente',
    member: 'Miembro',
    viewer: 'Observador',
    // Status messages
    inviteSent: '¡Invitación enviada con éxito!',
    inviteError: 'Error al enviar la invitación',
    emailSentTo: 'Email enviado a',
    shareLinkWith: 'Comparte este enlace con',
  }
};

type TabType = 'organization' | 'members' | 'tiers' | 'email';

export default function SettingsPage() {
  const { session, organizationId } = useAuth();
  const { language } = useLanguage();
  const t = translations[language];
  
  const [activeTab, setActiveTab] = useState<TabType>('organization');
  const [userRole, setUserRole] = useState<string>('member');
  
  // Organization state
  const [orgData, setOrgData] = useState({
    legal_name: '',
    commercial_name: '',
    ruc: '',
    dv: '',
    billing_email: '',
  });
  const [orgSaving, setOrgSaving] = useState(false);
  const [orgSaved, setOrgSaved] = useState(false);
  
  // Members state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteTier, setInviteTier] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState<{
    success: boolean;
    emailSent: boolean;
    inviteUrl?: string;
    email?: string;
  } | null>(null);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [tiers, setTiers] = useState<any[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // SMTP state
  const [smtpData, setSmtpData] = useState({
    host: '',
    port: 587,
    user: '',
    password: '',
    fromEmail: '',
    fromName: '',
    secure: true,
    enabled: false,
  });
  const [smtpSaving, setSmtpSaving] = useState(false);
  const [smtpTesting, setSmtpTesting] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // Fetch user role
  useEffect(() => {
    async function fetchRole() {
      if (!session?.access_token || !organizationId) return;
      
      try {
        const response = await fetch(
          `/api/members?organizationId=${organizationId}&userId=current`,
          {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          setUserRole(data.role || 'member');
        }
      } catch (error) {
        console.error('Error fetching role:', error);
      }
    }
    
    fetchRole();
  }, [session, organizationId]);
  
  // Fetch organization data
  useEffect(() => {
    async function fetchOrg() {
      if (!session?.access_token || !organizationId) return;
      
      try {
        const response = await fetch(
          `/api/organizations/${organizationId}`,
          {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          setOrgData({
            legal_name: data.legal_name || '',
            commercial_name: data.commercial_name || '',
            ruc: data.ruc || '',
            dv: data.dv || '',
            billing_email: data.billing_email || '',
          });
        }
      } catch (error) {
        console.error('Error fetching organization:', error);
      }
    }
    
    fetchOrg();
  }, [session, organizationId]);
  
  // Fetch SMTP settings
  useEffect(() => {
    async function fetchSmtp() {
      if (!session?.access_token || !organizationId) return;
      if (!['owner', 'admin'].includes(userRole)) return;
      
      try {
        const response = await fetch(
          `/api/settings/smtp?organizationId=${organizationId}`,
          {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.smtp) {
            setSmtpData({
              host: data.smtp.host || '',
              port: data.smtp.port || 587,
              user: data.smtp.user || '',
              password: '', // Never returned from API
              fromEmail: data.smtp.fromEmail || '',
              fromName: data.smtp.fromName || '',
              secure: data.smtp.secure ?? true,
              enabled: data.smtp.enabled || false,
            });
          }
        }
      } catch (error) {
        console.error('Error fetching SMTP settings:', error);
      }
    }
    
    fetchSmtp();
  }, [session, organizationId, userRole]);
  
  // Fetch invitations
  useEffect(() => {
    async function fetchInvitations() {
      if (!session?.access_token || !organizationId) return;
      
      try {
        const response = await fetch(
          `/api/invitations?organizationId=${organizationId}`,
          {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          setInvitations(data.invitations || []);
        }
      } catch (error) {
        console.error('Error fetching invitations:', error);
      }
    }
    
    fetchInvitations();
  }, [session, organizationId]);
  
  // Fetch tiers
  useEffect(() => {
    async function fetchTiers() {
      if (!session?.access_token || !organizationId) return;
      
      try {
        const response = await fetch(
          `/api/tiers?organizationId=${organizationId}`,
          {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          setTiers(data.tiers || []);
        }
      } catch (error) {
        console.error('Error fetching tiers:', error);
      }
    }
    
    fetchTiers();
  }, [session, organizationId]);
  
  // Save organization
  const handleSaveOrg = async () => {
    if (!session?.access_token || !organizationId) return;
    
    setOrgSaving(true);
    try {
      const response = await fetch(`/api/organizations/${organizationId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orgData),
      });
      
      if (response.ok) {
        setOrgSaved(true);
        setTimeout(() => setOrgSaved(false), 2000);
      }
    } catch (error) {
      console.error('Error saving organization:', error);
    } finally {
      setOrgSaving(false);
    }
  };
  
  // Send invitation
  const handleInvite = async () => {
    if (!session?.access_token || !organizationId || !inviteEmail) return;
    
    setInviting(true);
    setInviteResult(null);
    
    try {
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          email: inviteEmail,
          role: inviteRole,
          tierId: inviteTier || null,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setInviteResult({
          success: true,
          emailSent: data.emailSent,
          inviteUrl: data.invitation?.inviteUrl,
          email: data.invitation?.email,
        });
        setInviteEmail('');
        // Refresh invitations
        const invResp = await fetch(
          `/api/invitations?organizationId=${organizationId}`,
          {
            headers: { 'Authorization': `Bearer ${session.access_token}` },
          }
        );
        if (invResp.ok) {
          const invData = await invResp.json();
          setInvitations(invData.invitations || []);
        }
      } else {
        setInviteResult({
          success: false,
          emailSent: false,
        });
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      setInviteResult({ success: false, emailSent: false });
    } finally {
      setInviting(false);
    }
  };
  
  // Copy invitation link
  const handleCopyLink = async (inviteUrl: string, id: string) => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Error copying link:', error);
    }
  };
  
  // Cancel invitation
  const handleCancelInvite = async (id: string) => {
    if (!session?.access_token) return;
    
    try {
      const response = await fetch(`/api/invitations?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      
      if (response.ok) {
        setInvitations(invitations.filter(inv => inv.id !== id));
      }
    } catch (error) {
      console.error('Error canceling invitation:', error);
    }
  };
  
  // Test SMTP connection
  const handleTestSmtp = async () => {
    if (!session?.access_token || !organizationId) return;
    
    setSmtpTesting(true);
    setSmtpTestResult(null);
    
    try {
      const response = await fetch('/api/settings/smtp', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          ...smtpData,
          testConnection: true,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSmtpTestResult({ success: true, message: t.testSuccess });
      } else {
        setSmtpTestResult({ success: false, message: data.error || t.testFailed });
      }
    } catch (error) {
      setSmtpTestResult({ success: false, message: t.testFailed });
    } finally {
      setSmtpTesting(false);
    }
  };
  
  // Save SMTP settings
  const handleSaveSmtp = async () => {
    if (!session?.access_token || !organizationId) return;
    
    setSmtpSaving(true);
    
    try {
      const response = await fetch('/api/settings/smtp', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          ...smtpData,
        }),
      });
      
      if (response.ok) {
        setSmtpTestResult({ success: true, message: t.saved });
        setTimeout(() => setSmtpTestResult(null), 2000);
      }
    } catch (error) {
      console.error('Error saving SMTP settings:', error);
    } finally {
      setSmtpSaving(false);
    }
  };
  
  const isAdmin = ['owner', 'admin'].includes(userRole);
  
  const tabs = [
    { id: 'organization' as TabType, label: t.organization, icon: Building2 },
    { id: 'members' as TabType, label: t.members, icon: Users, adminOnly: true },
    { id: 'tiers' as TabType, label: t.tiers, icon: Shield, adminOnly: true },
    { id: 'email' as TabType, label: t.email, icon: Mail, adminOnly: true },
  ].filter(tab => !tab.adminOnly || isAdmin);
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">{t.settings}</h1>
      
      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-white/5 p-1 rounded-lg w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === tab.id
                ? 'bg-[#c8b273] text-[#0a1628]'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Organization Tab */}
      {activeTab === 'organization' && (
        <div className="bg-white/5 rounded-xl p-6 max-w-2xl">
          <div className="space-y-4">
            <div>
              <label className="block text-white/70 text-sm mb-1">{t.legalName}</label>
              <input
                type="text"
                value={orgData.legal_name}
                onChange={(e) => setOrgData({ ...orgData, legal_name: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-white/70 text-sm mb-1">{t.commercialName}</label>
              <input
                type="text"
                value={orgData.commercial_name}
                onChange={(e) => setOrgData({ ...orgData, commercial_name: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white/70 text-sm mb-1">{t.ruc}</label>
                <input
                  type="text"
                  value={orgData.ruc}
                  onChange={(e) => setOrgData({ ...orgData, ruc: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-white/70 text-sm mb-1">{t.dv}</label>
                <input
                  type="text"
                  value={orgData.dv}
                  onChange={(e) => setOrgData({ ...orgData, dv: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-white/70 text-sm mb-1">{t.billingEmail}</label>
              <input
                type="email"
                value={orgData.billing_email}
                onChange={(e) => setOrgData({ ...orgData, billing_email: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
              />
            </div>
            <button
              onClick={handleSaveOrg}
              disabled={orgSaving}
              className="flex items-center gap-2 bg-[#c8b273] text-[#0a1628] px-6 py-2 rounded-lg font-semibold hover:bg-[#d4c088] transition-colors disabled:opacity-50"
            >
              {orgSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : orgSaved ? (
                <Check className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {orgSaving ? t.saving : orgSaved ? t.saved : t.saveChanges}
            </button>
          </div>
        </div>
      )}
      
      {/* Members Tab */}
      {activeTab === 'members' && isAdmin && (
        <div className="space-y-6 max-w-2xl">
          {/* Invite Form */}
          <div className="bg-white/5 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">{t.inviteMember}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-white/70 text-sm mb-1">{t.email_address}</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="member@example.com"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/70 text-sm mb-1">{t.role}</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                  >
                    <option value="admin">{t.admin}</option>
                    <option value="manager">{t.manager}</option>
                    <option value="member">{t.member}</option>
                    <option value="viewer">{t.viewer}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-1">{t.tier}</label>
                  <select
                    value={inviteTier}
                    onChange={(e) => setInviteTier(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                  >
                    <option value="">-- Optional --</option>
                    {tiers.map(tier => (
                      <option key={tier.id} value={tier.id}>{tier.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={handleInvite}
                disabled={inviting || !inviteEmail}
                className="flex items-center gap-2 bg-[#c8b273] text-[#0a1628] px-6 py-2 rounded-lg font-semibold hover:bg-[#d4c088] transition-colors disabled:opacity-50"
              >
                {inviting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {t.sendInvite}
              </button>
              
              {/* Invite Result */}
              {inviteResult && (
                <div className={`p-4 rounded-lg ${inviteResult.success ? 'bg-green-500/20 border border-green-500/50' : 'bg-red-500/20 border border-red-500/50'}`}>
                  {inviteResult.success ? (
                    <div>
                      <p className="text-green-400 font-medium mb-2">
                        {inviteResult.emailSent 
                          ? `✉️ ${t.emailSentTo} ${inviteResult.email}`
                          : `📋 ${t.shareLinkWith} ${inviteResult.email}:`
                        }
                      </p>
                      {!inviteResult.emailSent && inviteResult.inviteUrl && (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={inviteResult.inviteUrl}
                            readOnly
                            className="flex-1 bg-white/10 border border-white/20 rounded px-3 py-1 text-white text-sm"
                          />
                          <button
                            onClick={() => handleCopyLink(inviteResult.inviteUrl!, 'result')}
                            className="flex items-center gap-1 bg-white/10 hover:bg-white/20 px-3 py-1 rounded text-white text-sm"
                          >
                            {copiedId === 'result' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-red-400">{t.inviteError}</p>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Pending Invitations */}
          <div className="bg-white/5 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">{t.pendingInvitations}</h2>
            {invitations.length === 0 ? (
              <p className="text-white/50">{t.noInvitations}</p>
            ) : (
              <div className="space-y-3">
                {invitations.map(inv => (
                  <div key={inv.id} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                    <div>
                      <p className="text-white">{inv.email}</p>
                      <p className="text-white/50 text-sm">{inv.role}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyLink(inv.inviteUrl, inv.id)}
                        className="flex items-center gap-1 bg-white/10 hover:bg-white/20 px-3 py-1 rounded text-white text-sm"
                      >
                        {copiedId === inv.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copiedId === inv.id ? t.linkCopied : t.copyLink}
                      </button>
                      <button
                        onClick={() => handleCancelInvite(inv.id)}
                        className="flex items-center gap-1 bg-red-500/20 hover:bg-red-500/30 px-3 py-1 rounded text-red-400 text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                        {t.cancelInvite}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Tiers Tab - Placeholder */}
      {activeTab === 'tiers' && isAdmin && (
        <div className="bg-white/5 rounded-xl p-6 max-w-2xl">
          <p className="text-white/50">Tier management coming soon...</p>
        </div>
      )}
      
      {/* Email Configuration Tab */}
      {activeTab === 'email' && isAdmin && (
        <div className="bg-white/5 rounded-xl p-6 max-w-2xl">
          <h2 className="text-lg font-semibold text-white mb-2">{t.smtpConfig}</h2>
          <p className="text-white/50 text-sm mb-6">{t.smtpDescription}</p>
          
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-white/70 text-sm mb-1">{t.smtpHost}</label>
                <input
                  type="text"
                  value={smtpData.host}
                  onChange={(e) => setSmtpData({ ...smtpData, host: e.target.value })}
                  placeholder={t.smtpHostPlaceholder}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-white/70 text-sm mb-1">{t.smtpPort}</label>
                <input
                  type="number"
                  value={smtpData.port}
                  onChange={(e) => setSmtpData({ ...smtpData, port: parseInt(e.target.value) || 587 })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-white/70 text-sm mb-1">{t.smtpUser}</label>
              <input
                type="text"
                value={smtpData.user}
                onChange={(e) => setSmtpData({ ...smtpData, user: e.target.value })}
                placeholder={t.smtpUserPlaceholder}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
              />
            </div>
            
            <div>
              <label className="block text-white/70 text-sm mb-1">{t.smtpPassword}</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={smtpData.password}
                  onChange={(e) => setSmtpData({ ...smtpData, password: e.target.value })}
                  placeholder={t.smtpPasswordPlaceholder}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white/70 text-sm mb-1">{t.smtpFromEmail}</label>
                <input
                  type="email"
                  value={smtpData.fromEmail}
                  onChange={(e) => setSmtpData({ ...smtpData, fromEmail: e.target.value })}
                  placeholder={t.smtpFromEmailPlaceholder}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-white/70 text-sm mb-1">{t.smtpFromName}</label>
                <input
                  type="text"
                  value={smtpData.fromName}
                  onChange={(e) => setSmtpData({ ...smtpData, fromName: e.target.value })}
                  placeholder={t.smtpFromNamePlaceholder}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={smtpData.secure}
                  onChange={(e) => setSmtpData({ ...smtpData, secure: e.target.checked })}
                  className="w-4 h-4 rounded border-white/20 bg-white/10 text-[#c8b273]"
                />
                <span className="text-white">{t.smtpSecure}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={smtpData.enabled}
                  onChange={(e) => setSmtpData({ ...smtpData, enabled: e.target.checked })}
                  className="w-4 h-4 rounded border-white/20 bg-white/10 text-[#c8b273]"
                />
                <span className="text-white">{t.smtpEnabled}</span>
              </label>
            </div>
            
            {/* Test Result */}
            {smtpTestResult && (
              <div className={`flex items-center gap-2 p-3 rounded-lg ${
                smtpTestResult.success 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {smtpTestResult.success ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                {smtpTestResult.message}
              </div>
            )}
            
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleTestSmtp}
                disabled={smtpTesting || !smtpData.host || !smtpData.user || !smtpData.password}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {smtpTesting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <TestTube className="w-4 h-4" />
                )}
                {smtpTesting ? t.testing : t.testConnection}
              </button>
              <button
                onClick={handleSaveSmtp}
                disabled={smtpSaving}
                className="flex items-center gap-2 bg-[#c8b273] text-[#0a1628] px-6 py-2 rounded-lg font-semibold hover:bg-[#d4c088] transition-colors disabled:opacity-50"
              >
                {smtpSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {t.saveSmtp}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
