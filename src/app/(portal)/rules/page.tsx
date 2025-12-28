'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/components/auth/auth-provider';
import { cn } from '@/lib/utils';
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Loader2,
  Shield,
  Calendar,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Layers,
  Home,
  Plane,
  Ship,
  Navigation,
  Info,
  Zap,
  CalendarDays,
  Star,
} from 'lucide-react';

// Types
interface Tier {
  id: string;
  name: string;
  priority: number;
  color: string;
  description?: string;
}

interface Asset {
  id: string;
  name: string;
  section: string;
}

interface Holiday {
  id: string;
  name: string;
  month: number | null;
  day: number | null;
  is_variable: boolean;
  category: string;
}

interface HolidayPeriod {
  id: string;
  name: string;
  start_month: number | null;
  start_day: number | null;
  end_month: number | null;
  end_day: number | null;
}

interface BookingRule {
  id: string;
  organization_id: string;
  tier_id: string;
  name: string;
  description: string | null;
  rule_type: 'date_range' | 'consecutive_booking' | 'concurrent_booking' | 'lead_time' | 'holiday' | 'custom';
  conditions: any;
  requires_approval: boolean;
  approval_type: 'any_approver' | 'all_principals' | 'specific_users' | 'tier_members';
  approver_tier_id: string | null;
  is_override: boolean;
  priority: number;
  applies_to_all_assets: boolean;
  is_active: boolean;
  created_at: string;
  tier?: Tier;
  assets?: Asset[];
}

interface RuleForm {
  name: string;
  description: string;
  tierId: string;
  ruleType: string;
  requiresApproval: boolean;
  approvalType: string;
  approverTierId: string;
  isOverride: boolean;
  priority: number;
  appliesToAllAssets: boolean;
  selectedAssetIds: string[];
  // Conditions
  dateRangeStart: string; // MM-DD format
  dateRangeEnd: string;
  consecutiveCount: number;
  consecutiveUnit: string;
  concurrentMaxAssets: number;
  concurrentMinDaysBefore: number;
  leadTimeHours: number;
  customCondition: string;
  // Holiday conditions
  selectedHolidayIds: string[];
  selectedPeriodIds: string[];
  holidayDaysBefore: number;
  holidayDaysAfter: number;
}

const RULE_TYPES = [
  { 
    id: 'date_range', 
    label: 'Rango de Fechas', 
    description: 'Requiere aprobación durante fechas específicas',
    icon: Calendar,
    example: 'Ej: Reservas en Contadora del 8 Dic al 6 Ene'
  },
  { 
    id: 'holiday', 
    label: 'Feriados / Períodos', 
    description: 'Requiere aprobación durante feriados o períodos especiales',
    icon: CalendarDays,
    example: 'Ej: Navidad, Semana Santa, Carnaval'
  },
  { 
    id: 'consecutive_booking', 
    label: 'Reservas Consecutivas', 
    description: 'Requiere aprobación para reservas seguidas',
    icon: Layers,
    example: 'Ej: 2 fines de semana seguidos'
  },
  { 
    id: 'concurrent_booking', 
    label: 'Reservas Simultáneas', 
    description: 'Control de múltiples propiedades mismo período',
    icon: Home,
    example: 'Ej: 2+ propiedades el mismo fin de semana'
  },
  { 
    id: 'lead_time', 
    label: 'Tiempo de Anticipación', 
    description: 'Mínimo tiempo antes de reservar',
    icon: Clock,
    example: 'Ej: Mínimo 72 horas de anticipación'
  },
  { 
    id: 'custom', 
    label: 'Regla Personalizada', 
    description: 'Define condiciones específicas',
    icon: Shield,
    example: 'Ej: Condiciones especiales'
  },
];

const APPROVAL_TYPES = [
  { id: 'any_approver', label: 'Cualquier Aprobador', description: 'Un solo aprobador es suficiente' },
  { id: 'all_principals', label: 'Todos los Principales', description: 'TODOS los usuarios del tier Principal deben aprobar' },
  { id: 'tier_members', label: 'Miembros del Tier', description: 'Todos los miembros de un tier específico' },
];

const SECTION_ICONS: Record<string, React.ElementType> = {
  planes: Plane,
  helicopters: Navigation,
  residences: Home,
  watercraft: Ship,
};

const DEFAULT_FORM: RuleForm = {
  name: '',
  description: '',
  tierId: '',
  ruleType: 'date_range',
  requiresApproval: true,
  approvalType: 'all_principals',
  approverTierId: '',
  isOverride: false,
  priority: 100,
  appliesToAllAssets: true,
  selectedAssetIds: [],
  dateRangeStart: '12-08',
  dateRangeEnd: '01-06',
  consecutiveCount: 2,
  consecutiveUnit: 'weekends',
  concurrentMaxAssets: 2,
  concurrentMinDaysBefore: 3,
  leadTimeHours: 72,
  customCondition: '',
  selectedHolidayIds: [],
  selectedPeriodIds: [],
  holidayDaysBefore: 0,
  holidayDaysAfter: 0,
};

export default function RulesPage() {
  const { session, organization } = useAuth();
  const { toast } = useToast();

  const [rules, setRules] = useState<BookingRule[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [periods, setPeriods] = useState<HolidayPeriod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<BookingRule | null>(null);
  const [form, setForm] = useState<RuleForm>(DEFAULT_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedTiers, setExpandedTiers] = useState<string[]>([]);

  // Fetch data
  useEffect(() => {
    if (session?.access_token && organization?.id) {
      fetchData();
    }
  }, [session?.access_token, organization?.id]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const headers = {
        'apikey': apiKey!,
        'Authorization': `Bearer ${session!.access_token}`,
      };

      // Fetch tiers
      const tiersRes = await fetch(
        `${baseUrl}/rest/v1/tiers?organization_id=eq.${organization!.id}&order=priority.asc`,
        { headers }
      );
      if (tiersRes.ok) {
        const tiersData = await tiersRes.json();
        setTiers(tiersData);
        // Expand first tier by default
        if (tiersData.length > 0) {
          setExpandedTiers([tiersData[0].id]);
        }
      }

      // Fetch assets
      const assetsRes = await fetch(
        `${baseUrl}/rest/v1/assets?organization_id=eq.${organization!.id}&is_active=eq.true&order=name.asc`,
        { headers }
      );
      if (assetsRes.ok) {
        setAssets(await assetsRes.json());
      }

      // Fetch holidays
      const holidaysRes = await fetch(
        `${baseUrl}/rest/v1/organization_holidays?organization_id=eq.${organization!.id}&is_active=eq.true&order=month.asc,day.asc`,
        { headers }
      );
      if (holidaysRes.ok) {
        setHolidays(await holidaysRes.json());
      }

      // Fetch periods
      const periodsRes = await fetch(
        `${baseUrl}/rest/v1/holiday_periods?organization_id=eq.${organization!.id}&is_active=eq.true&order=start_month.asc`,
        { headers }
      );
      if (periodsRes.ok) {
        setPeriods(await periodsRes.json());
      }

      // Fetch rules with tier info
      const rulesRes = await fetch(
        `${baseUrl}/rest/v1/tier_booking_rules?organization_id=eq.${organization!.id}&select=*,tier:tiers(id,name,priority,color)&order=priority.asc`,
        { headers }
      );
      if (rulesRes.ok) {
        const rulesData = await rulesRes.json();
        // Format tier from array
        const formatted = rulesData.map((r: any) => ({
          ...r,
          tier: Array.isArray(r.tier) ? r.tier[0] : r.tier,
        }));
        setRules(formatted);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ title: 'Error', description: 'Failed to load data', variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (rule?: BookingRule) => {
    if (rule) {
      setEditingRule(rule);
      setForm({
        name: rule.name,
        description: rule.description || '',
        tierId: rule.tier_id,
        ruleType: rule.rule_type,
        requiresApproval: rule.requires_approval,
        approvalType: rule.approval_type,
        approverTierId: rule.approver_tier_id || '',
        isOverride: rule.is_override,
        priority: rule.priority,
        appliesToAllAssets: rule.applies_to_all_assets,
        selectedAssetIds: rule.assets?.map(a => a.id) || [],
        dateRangeStart: rule.conditions?.start_month_day || '12-08',
        dateRangeEnd: rule.conditions?.end_month_day || '01-06',
        consecutiveCount: rule.conditions?.count || 2,
        consecutiveUnit: rule.conditions?.unit || 'weekends',
        concurrentMaxAssets: rule.conditions?.max_assets || 2,
        concurrentMinDaysBefore: rule.conditions?.min_request_days_before || 3,
        leadTimeHours: rule.conditions?.min_hours || 72,
        customCondition: rule.conditions?.description || '',
        selectedHolidayIds: rule.conditions?.holiday_ids || [],
        selectedPeriodIds: rule.conditions?.period_ids || [],
        holidayDaysBefore: rule.conditions?.days_before || 0,
        holidayDaysAfter: rule.conditions?.days_after || 0,
      });
    } else {
      setEditingRule(null);
      setForm({ ...DEFAULT_FORM, tierId: tiers[0]?.id || '' });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingRule(null);
    setForm(DEFAULT_FORM);
  };

  const buildConditions = () => {
    switch (form.ruleType) {
      case 'date_range':
        return {
          start_month_day: form.dateRangeStart,
          end_month_day: form.dateRangeEnd,
        };
      case 'holiday':
        return {
          holiday_ids: form.selectedHolidayIds,
          period_ids: form.selectedPeriodIds,
          days_before: form.holidayDaysBefore,
          days_after: form.holidayDaysAfter,
        };
      case 'consecutive_booking':
        return {
          count: form.consecutiveCount,
          unit: form.consecutiveUnit,
        };
      case 'concurrent_booking':
        return {
          max_assets: form.concurrentMaxAssets,
          min_request_days_before: form.concurrentMinDaysBefore,
        };
      case 'lead_time':
        return {
          min_hours: form.leadTimeHours,
        };
      case 'custom':
        return {
          description: form.customCondition,
        };
      default:
        return {};
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.tierId) {
      toast({ title: 'Error', description: 'Nombre y Tier son requeridos', variant: 'error' });
      return;
    }

    setIsSaving(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const headers = {
        'Content-Type': 'application/json',
        'apikey': apiKey!,
        'Authorization': `Bearer ${session!.access_token}`,
      };

      const ruleData = {
        organization_id: organization!.id,
        tier_id: form.tierId,
        name: form.name,
        description: form.description || null,
        rule_type: form.ruleType,
        conditions: buildConditions(),
        requires_approval: form.requiresApproval,
        approval_type: form.approvalType,
        approver_tier_id: form.approvalType === 'tier_members' ? form.approverTierId : null,
        is_override: form.isOverride,
        priority: form.priority,
        applies_to_all_assets: form.appliesToAllAssets,
        is_active: true,
      };

      let ruleId = editingRule?.id;

      if (editingRule) {
        // Update
        const res = await fetch(
          `${baseUrl}/rest/v1/tier_booking_rules?id=eq.${editingRule.id}`,
          {
            method: 'PATCH',
            headers,
            body: JSON.stringify(ruleData),
          }
        );
        if (!res.ok) throw new Error('Failed to update rule');
      } else {
        // Create
        const res = await fetch(
          `${baseUrl}/rest/v1/tier_booking_rules`,
          {
            method: 'POST',
            headers: { ...headers, 'Prefer': 'return=representation' },
            body: JSON.stringify(ruleData),
          }
        );
        if (!res.ok) throw new Error('Failed to create rule');
        const newRule = await res.json();
        ruleId = newRule[0].id;
      }

      // Handle asset assignments if not applying to all
      if (!form.appliesToAllAssets && ruleId) {
        // Delete existing assignments
        await fetch(
          `${baseUrl}/rest/v1/tier_rule_assets?rule_id=eq.${ruleId}`,
          { method: 'DELETE', headers }
        );

        // Create new assignments
        if (form.selectedAssetIds.length > 0) {
          const assetAssignments = form.selectedAssetIds.map(assetId => ({
            rule_id: ruleId,
            asset_id: assetId,
          }));
          await fetch(
            `${baseUrl}/rest/v1/tier_rule_assets`,
            {
              method: 'POST',
              headers,
              body: JSON.stringify(assetAssignments),
            }
          );
        }
      }

      toast({ title: 'Éxito', description: editingRule ? 'Regla actualizada' : 'Regla creada' });
      closeModal();
      fetchData();
    } catch (error: any) {
      console.error('Save error:', error);
      toast({ title: 'Error', description: error.message, variant: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (rule: BookingRule) => {
    if (!confirm(`¿Eliminar la regla "${rule.name}"?`)) return;

    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const res = await fetch(
        `${baseUrl}/rest/v1/tier_booking_rules?id=eq.${rule.id}`,
        {
          method: 'DELETE',
          headers: {
            'apikey': apiKey!,
            'Authorization': `Bearer ${session!.access_token}`,
          },
        }
      );

      if (!res.ok) throw new Error('Failed to delete');

      toast({ title: 'Regla eliminada' });
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo eliminar', variant: 'error' });
    }
  };

  const toggleTierExpand = (tierId: string) => {
    setExpandedTiers(prev =>
      prev.includes(tierId) ? prev.filter(id => id !== tierId) : [...prev, tierId]
    );
  };

  const getRulesByTier = (tierId: string) => {
    return rules.filter(r => r.tier_id === tierId);
  };

  const getRuleTypeInfo = (type: string) => {
    return RULE_TYPES.find(t => t.id === type) || RULE_TYPES[4];
  };

  const formatConditions = (rule: BookingRule) => {
    switch (rule.rule_type) {
      case 'date_range':
        return `${rule.conditions?.start_month_day} al ${rule.conditions?.end_month_day}`;
      case 'holiday':
        const holidayCount = (rule.conditions?.holiday_ids?.length || 0) + (rule.conditions?.period_ids?.length || 0);
        const daysBefore = rule.conditions?.days_before || 0;
        const daysAfter = rule.conditions?.days_after || 0;
        let holidayText = `${holidayCount} feriado${holidayCount !== 1 ? 's' : ''}/período${holidayCount !== 1 ? 's' : ''}`;
        if (daysBefore > 0 || daysAfter > 0) {
          holidayText += ` (±${Math.max(daysBefore, daysAfter)} días)`;
        }
        return holidayText;
      case 'consecutive_booking':
        return `${rule.conditions?.count} ${rule.conditions?.unit === 'weekends' ? 'fines de semana' : 'días'} seguidos`;
      case 'concurrent_booking':
        return `${rule.conditions?.max_assets}+ propiedades, mín ${rule.conditions?.min_request_days_before} días antes`;
      case 'lead_time':
        return `Mínimo ${rule.conditions?.min_hours} horas`;
      case 'custom':
        return rule.conditions?.description || 'Condición personalizada';
      default:
        return '';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gold-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Reglas de Reserva</h1>
          <p className="text-muted mt-1">Configura reglas de aprobación por tier y activo</p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Regla
        </Button>
      </div>

      {/* Info Card */}
      <Card className="bg-gold-500/5 border-gold-500/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-gold-500 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="text-white font-medium">¿Cómo funcionan las reglas?</p>
              <ul className="text-muted mt-2 space-y-1">
                <li>• Las reglas se aplican por <span className="text-gold-400">Tier</span> - cada nivel de usuario puede tener reglas diferentes</li>
                <li>• Las reglas marcadas como <span className="text-gold-400">Override</span> tienen prioridad sobre las demás</li>
                <li>• Para reglas especiales, se requiere aprobación de <span className="text-gold-400">TODOS</span> los usuarios del tier Principal</li>
                <li>• Se envía email de confirmación a cada aprobador con botón de aprobación</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rules by Tier */}
      {tiers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Layers className="w-12 h-12 text-muted mx-auto mb-3" />
            <p className="text-white font-medium">No hay tiers configurados</p>
            <p className="text-muted text-sm mt-1">Crea tiers en Configuración para agregar reglas</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tiers.map((tier) => {
            const tierRules = getRulesByTier(tier.id);
            const isExpanded = expandedTiers.includes(tier.id);

            return (
              <Card key={tier.id} className="overflow-hidden">
                <button
                  onClick={() => toggleTierExpand(tier.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-surface/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold"
                      style={{ backgroundColor: `${tier.color}20`, color: tier.color }}
                    >
                      {tier.priority}
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium text-white">{tier.name}</h3>
                      <p className="text-sm text-muted">
                        {tierRules.length} regla{tierRules.length !== 1 ? 's' : ''}
                        {tier.priority === 1 && (
                          <span className="ml-2 px-2 py-0.5 rounded bg-gold-500/20 text-gold-400 text-xs">
                            Principal
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setForm(prev => ({ ...prev, tierId: tier.id }));
                        openModal();
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-muted" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-muted" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-border">
                    {tierRules.length === 0 ? (
                      <div className="p-8 text-center">
                        <Shield className="w-10 h-10 text-muted mx-auto mb-2" />
                        <p className="text-muted">Sin reglas para este tier</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3"
                          onClick={() => {
                            setForm(prev => ({ ...prev, tierId: tier.id }));
                            openModal();
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Agregar Regla
                        </Button>
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {tierRules.map((rule) => {
                          const typeInfo = getRuleTypeInfo(rule.rule_type);
                          const TypeIcon = typeInfo.icon;

                          return (
                            <div
                              key={rule.id}
                              className="p-4 hover:bg-surface/30 transition-colors"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3">
                                  <div className={cn(
                                    "p-2 rounded-lg shrink-0",
                                    rule.is_override ? "bg-amber-500/20" : "bg-surface"
                                  )}>
                                    <TypeIcon className={cn(
                                      "w-4 h-4",
                                      rule.is_override ? "text-amber-400" : "text-muted"
                                    )} />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-medium text-white">{rule.name}</h4>
                                      {rule.is_override && (
                                        <span className="px-1.5 py-0.5 rounded text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                          <Zap className="w-3 h-3 inline mr-0.5" />
                                          Override
                                        </span>
                                      )}
                                      {!rule.is_active && (
                                        <span className="px-1.5 py-0.5 rounded text-xs bg-gray-500/20 text-gray-400">
                                          Inactiva
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm text-muted mt-0.5">
                                      {typeInfo.label}: {formatConditions(rule)}
                                    </p>
                                    {rule.description && (
                                      <p className="text-sm text-muted mt-1 italic">
                                        {rule.description}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-3 mt-2 text-xs">
                                      {rule.requires_approval ? (
                                        <span className="text-amber-400 flex items-center gap-1">
                                          <AlertTriangle className="w-3 h-3" />
                                          {rule.approval_type === 'all_principals'
                                            ? 'Todos los Principales deben aprobar'
                                            : rule.approval_type === 'tier_members'
                                            ? 'Miembros del tier deben aprobar'
                                            : 'Requiere aprobación'}
                                        </span>
                                      ) : (
                                        <span className="text-emerald-400 flex items-center gap-1">
                                          <CheckCircle2 className="w-3 h-3" />
                                          Auto-aprobado
                                        </span>
                                      )}
                                      {!rule.applies_to_all_assets && (
                                        <span className="text-muted">
                                          • Activos específicos
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => openModal(rule)}
                                    className="p-2 rounded hover:bg-surface text-muted hover:text-white"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(rule)}
                                    className="p-2 rounded hover:bg-red-500/20 text-muted hover:text-red-400"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Rule Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={closeModal} />
          <Card className="relative z-10 w-full max-w-2xl bg-surface border-border max-h-[90vh] overflow-hidden flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2 shrink-0">
              <CardTitle className="text-xl font-display">
                {editingRule ? 'Editar Regla' : 'Nueva Regla'}
              </CardTitle>
              <button onClick={closeModal} className="p-2 rounded hover:bg-navy-800 text-muted hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="overflow-y-auto space-y-6 pb-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Nombre de la Regla *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ej: Temporada Alta Contadora"
                    className="bg-navy-800 border-border"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Descripción</Label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Explica cuándo y por qué se aplica esta regla..."
                    className="w-full px-4 py-2 bg-navy-800 border border-border rounded-lg text-white placeholder:text-muted resize-none"
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Tier *</Label>
                  <select
                    value={form.tierId}
                    onChange={(e) => setForm({ ...form, tierId: e.target.value })}
                    className="w-full px-4 py-2 bg-navy-800 border border-border rounded-lg text-white"
                  >
                    <option value="">Seleccionar tier...</option>
                    {tiers.map((tier) => (
                      <option key={tier.id} value={tier.id}>
                        {tier.priority}. {tier.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Prioridad</Label>
                  <Input
                    type="number"
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) || 100 })}
                    className="bg-navy-800 border-border"
                    min={1}
                    max={999}
                  />
                  <p className="text-xs text-muted mt-1">Menor = mayor prioridad</p>
                </div>
              </div>

              {/* Override Toggle */}
              <label className={cn(
                "flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors",
                form.isOverride
                  ? "border-amber-500/50 bg-amber-500/10"
                  : "border-border hover:border-border/80"
              )}>
                <input
                  type="checkbox"
                  checked={form.isOverride}
                  onChange={(e) => setForm({ ...form, isOverride: e.target.checked })}
                  className="w-4 h-4 rounded border-border bg-navy-800 text-amber-500"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span className="font-medium text-white">Regla Override</span>
                  </div>
                  <p className="text-xs text-muted mt-0.5">
                    Las reglas override tienen prioridad y se evalúan primero
                  </p>
                </div>
              </label>

              {/* Rule Type */}
              <div>
                <Label className="mb-3 block">Tipo de Regla</Label>
                <div className="grid grid-cols-1 gap-2">
                  {RULE_TYPES.map((type) => {
                    const TypeIcon = type.icon;
                    return (
                      <label
                        key={type.id}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                          form.ruleType === type.id
                            ? "border-gold-500/50 bg-gold-500/10"
                            : "border-border hover:border-border/80"
                        )}
                      >
                        <input
                          type="radio"
                          name="ruleType"
                          value={type.id}
                          checked={form.ruleType === type.id}
                          onChange={(e) => setForm({ ...form, ruleType: e.target.value })}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <TypeIcon className="w-4 h-4 text-gold-400" />
                            <span className="font-medium text-white">{type.label}</span>
                          </div>
                          <p className="text-xs text-muted mt-0.5">{type.description}</p>
                          <p className="text-xs text-gold-400/70 mt-0.5">{type.example}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Rule Conditions */}
              <div className="p-4 bg-navy-800/50 rounded-lg border border-border">
                <Label className="mb-3 block">Condiciones</Label>
                
                {form.ruleType === 'date_range' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">Fecha Inicio (MM-DD)</Label>
                      <Input
                        value={form.dateRangeStart}
                        onChange={(e) => setForm({ ...form, dateRangeStart: e.target.value })}
                        placeholder="12-08"
                        className="bg-navy-900 border-border"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Fecha Fin (MM-DD)</Label>
                      <Input
                        value={form.dateRangeEnd}
                        onChange={(e) => setForm({ ...form, dateRangeEnd: e.target.value })}
                        placeholder="01-06"
                        className="bg-navy-900 border-border"
                      />
                    </div>
                    <p className="col-span-2 text-xs text-muted">
                      Aplica cada año. Para cruzar año (Dic a Ene), usar: 12-08 al 01-06
                    </p>
                  </div>
                )}

                {form.ruleType === 'holiday' && (
                  <div className="space-y-4">
                    {/* Holidays Selection */}
                    {holidays.length > 0 && (
                      <div>
                        <Label className="text-xs mb-2 block">Feriados</Label>
                        <div className="max-h-40 overflow-y-auto space-y-1 border border-border rounded-lg p-2 bg-navy-900">
                          {holidays.map((holiday) => (
                            <label
                              key={holiday.id}
                              className={cn(
                                "flex items-center gap-2 p-2 rounded cursor-pointer transition-colors",
                                form.selectedHolidayIds.includes(holiday.id)
                                  ? "bg-gold-500/20"
                                  : "hover:bg-navy-800"
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={form.selectedHolidayIds.includes(holiday.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setForm({ ...form, selectedHolidayIds: [...form.selectedHolidayIds, holiday.id] });
                                  } else {
                                    setForm({ ...form, selectedHolidayIds: form.selectedHolidayIds.filter(id => id !== holiday.id) });
                                  }
                                }}
                                className="w-4 h-4 rounded"
                              />
                              <Star className="w-3 h-3 text-gold-400" />
                              <span className="text-white text-sm">{holiday.name}</span>
                              {holiday.month && holiday.day && (
                                <span className="text-xs text-muted">({holiday.day}/{holiday.month})</span>
                              )}
                              {holiday.is_variable && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">Variable</span>
                              )}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Periods Selection */}
                    {periods.length > 0 && (
                      <div>
                        <Label className="text-xs mb-2 block">Períodos</Label>
                        <div className="max-h-40 overflow-y-auto space-y-1 border border-border rounded-lg p-2 bg-navy-900">
                          {periods.map((period) => (
                            <label
                              key={period.id}
                              className={cn(
                                "flex items-center gap-2 p-2 rounded cursor-pointer transition-colors",
                                form.selectedPeriodIds.includes(period.id)
                                  ? "bg-gold-500/20"
                                  : "hover:bg-navy-800"
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={form.selectedPeriodIds.includes(period.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setForm({ ...form, selectedPeriodIds: [...form.selectedPeriodIds, period.id] });
                                  } else {
                                    setForm({ ...form, selectedPeriodIds: form.selectedPeriodIds.filter(id => id !== period.id) });
                                  }
                                }}
                                className="w-4 h-4 rounded"
                              />
                              <CalendarDays className="w-3 h-3 text-gold-400" />
                              <span className="text-white text-sm">{period.name}</span>
                              {period.start_month && period.start_day && period.end_month && period.end_day && (
                                <span className="text-xs text-muted">
                                  ({period.start_day}/{period.start_month} - {period.end_day}/{period.end_month})
                                </span>
                              )}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {holidays.length === 0 && periods.length === 0 && (
                      <div className="text-center py-4">
                        <CalendarDays className="w-8 h-8 text-muted mx-auto mb-2" />
                        <p className="text-sm text-muted">No hay feriados configurados</p>
                        <a href="/holidays" className="text-xs text-gold-400 hover:underline">
                          Ir a configurar feriados →
                        </a>
                      </div>
                    )}

                    {/* Days Before/After */}
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
                      <div>
                        <Label className="text-xs">Días Antes</Label>
                        <Input
                          type="number"
                          value={form.holidayDaysBefore}
                          onChange={(e) => setForm({ ...form, holidayDaysBefore: parseInt(e.target.value) || 0 })}
                          min={0}
                          className="bg-navy-900 border-border"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Días Después</Label>
                        <Input
                          type="number"
                          value={form.holidayDaysAfter}
                          onChange={(e) => setForm({ ...form, holidayDaysAfter: parseInt(e.target.value) || 0 })}
                          min={0}
                          className="bg-navy-900 border-border"
                        />
                      </div>
                      <p className="col-span-2 text-xs text-muted">
                        Incluir días antes/después del feriado en la regla
                      </p>
                    </div>
                  </div>
                )}

                {form.ruleType === 'consecutive_booking' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">Cantidad</Label>
                      <Input
                        type="number"
                        value={form.consecutiveCount}
                        onChange={(e) => setForm({ ...form, consecutiveCount: parseInt(e.target.value) || 2 })}
                        min={2}
                        className="bg-navy-900 border-border"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Unidad</Label>
                      <select
                        value={form.consecutiveUnit}
                        onChange={(e) => setForm({ ...form, consecutiveUnit: e.target.value })}
                        className="w-full px-4 py-2 bg-navy-900 border border-border rounded-lg text-white"
                      >
                        <option value="weekends">Fines de semana</option>
                        <option value="days">Días</option>
                        <option value="weeks">Semanas</option>
                      </select>
                    </div>
                    <p className="col-span-2 text-xs text-muted">
                      Ej: 2 fines de semana seguidos requiere aprobación
                    </p>
                  </div>
                )}

                {form.ruleType === 'concurrent_booking' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">Máximo de Propiedades</Label>
                      <Input
                        type="number"
                        value={form.concurrentMaxAssets}
                        onChange={(e) => setForm({ ...form, concurrentMaxAssets: parseInt(e.target.value) || 2 })}
                        min={2}
                        className="bg-navy-900 border-border"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Días Antes para Pedir (mín)</Label>
                      <Input
                        type="number"
                        value={form.concurrentMinDaysBefore}
                        onChange={(e) => setForm({ ...form, concurrentMinDaysBefore: parseInt(e.target.value) || 0 })}
                        min={0}
                        className="bg-navy-900 border-border"
                      />
                    </div>
                    <p className="col-span-2 text-xs text-muted">
                      Ej: No se puede pedir 2da propiedad antes del jueves (3 días antes)
                    </p>
                  </div>
                )}

                {form.ruleType === 'lead_time' && (
                  <div>
                    <Label className="text-xs">Horas Mínimas de Anticipación</Label>
                    <Input
                      type="number"
                      value={form.leadTimeHours}
                      onChange={(e) => setForm({ ...form, leadTimeHours: parseInt(e.target.value) || 0 })}
                      min={0}
                      className="bg-navy-900 border-border"
                    />
                    <p className="text-xs text-muted mt-2">
                      72 horas = 3 días, 168 horas = 7 días
                    </p>
                  </div>
                )}

                {form.ruleType === 'custom' && (
                  <div>
                    <Label className="text-xs">Descripción de la Condición</Label>
                    <textarea
                      value={form.customCondition}
                      onChange={(e) => setForm({ ...form, customCondition: e.target.value })}
                      placeholder="Describe la condición en detalle..."
                      className="w-full px-4 py-2 bg-navy-900 border border-border rounded-lg text-white placeholder:text-muted resize-none"
                      rows={3}
                    />
                  </div>
                )}
              </div>

              {/* Approval Settings */}
              <div>
                <Label className="mb-3 block">Configuración de Aprobación</Label>
                
                <label className={cn(
                  "flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-colors mb-3",
                  form.requiresApproval
                    ? "border-amber-500/50 bg-amber-500/10"
                    : "border-emerald-500/50 bg-emerald-500/10"
                )}>
                  <input
                    type="checkbox"
                    checked={form.requiresApproval}
                    onChange={(e) => setForm({ ...form, requiresApproval: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <div>
                    <span className="font-medium text-white">Requiere Aprobación</span>
                    <p className="text-xs text-muted">
                      {form.requiresApproval ? 'Se necesita aprobación para reservar' : 'Reserva automática sin aprobación'}
                    </p>
                  </div>
                </label>

                {form.requiresApproval && (
                  <div className="space-y-2 ml-4">
                    {APPROVAL_TYPES.map((type) => (
                      <label
                        key={type.id}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                          form.approvalType === type.id
                            ? "border-gold-500/50 bg-gold-500/10"
                            : "border-border hover:border-border/80"
                        )}
                      >
                        <input
                          type="radio"
                          name="approvalType"
                          value={type.id}
                          checked={form.approvalType === type.id}
                          onChange={(e) => setForm({ ...form, approvalType: e.target.value })}
                          className="mt-1"
                        />
                        <div>
                          <span className="font-medium text-white">{type.label}</span>
                          <p className="text-xs text-muted">{type.description}</p>
                        </div>
                      </label>
                    ))}

                    {form.approvalType === 'tier_members' && (
                      <div className="mt-3 ml-6">
                        <Label className="text-xs">Seleccionar Tier</Label>
                        <select
                          value={form.approverTierId}
                          onChange={(e) => setForm({ ...form, approverTierId: e.target.value })}
                          className="w-full px-4 py-2 bg-navy-800 border border-border rounded-lg text-white"
                        >
                          <option value="">Seleccionar...</option>
                          {tiers.map((tier) => (
                            <option key={tier.id} value={tier.id}>
                              {tier.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Asset Assignment */}
              <div>
                <Label className="mb-3 block">Activos Aplicables</Label>
                
                <div className="space-y-2">
                  <label className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                    form.appliesToAllAssets
                      ? "border-gold-500/50 bg-gold-500/10"
                      : "border-border"
                  )}>
                    <input
                      type="radio"
                      checked={form.appliesToAllAssets}
                      onChange={() => setForm({ ...form, appliesToAllAssets: true })}
                    />
                    <span className="text-white">Todos los activos</span>
                  </label>
                  
                  <label className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                    !form.appliesToAllAssets
                      ? "border-gold-500/50 bg-gold-500/10"
                      : "border-border"
                  )}>
                    <input
                      type="radio"
                      checked={!form.appliesToAllAssets}
                      onChange={() => setForm({ ...form, appliesToAllAssets: false })}
                    />
                    <span className="text-white">Activos específicos</span>
                  </label>
                </div>

                {!form.appliesToAllAssets && (
                  <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
                    {assets.map((asset) => {
                      const SectionIcon = SECTION_ICONS[asset.section] || Home;
                      return (
                        <label
                          key={asset.id}
                          className={cn(
                            "flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors",
                            form.selectedAssetIds.includes(asset.id)
                              ? "border-gold-500/50 bg-gold-500/10"
                              : "border-border hover:border-border/80"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={form.selectedAssetIds.includes(asset.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setForm({ ...form, selectedAssetIds: [...form.selectedAssetIds, asset.id] });
                              } else {
                                setForm({ ...form, selectedAssetIds: form.selectedAssetIds.filter(id => id !== asset.id) });
                              }
                            }}
                            className="w-4 h-4 rounded"
                          />
                          <SectionIcon className="w-4 h-4 text-muted" />
                          <span className="text-white">{asset.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={closeModal}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : editingRule ? (
                    'Actualizar Regla'
                  ) : (
                    'Crear Regla'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
