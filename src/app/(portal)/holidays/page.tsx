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
  Calendar,
  CalendarDays,
  Star,
  Church,
  Building2,
  Sparkles,
  Copy,
  Check,
  Info,
} from 'lucide-react';

interface Holiday {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  date: string | null;
  month: number | null;
  day: number | null;
  is_recurring: boolean;
  is_variable: boolean;
  variable_rule: string | null;
  category: 'national' | 'religious' | 'company' | 'custom';
  is_active: boolean;
  created_at: string;
}

interface HolidayPeriod {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  start_month: number | null;
  start_day: number | null;
  end_month: number | null;
  end_day: number | null;
  is_active: boolean;
}

interface HolidayForm {
  name: string;
  description: string;
  month: string;
  day: string;
  isRecurring: boolean;
  isVariable: boolean;
  variableRule: string;
  category: string;
}

interface PeriodForm {
  name: string;
  description: string;
  startMonth: string;
  startDay: string;
  endMonth: string;
  endDay: string;
}

const CATEGORIES = [
  { id: 'national', label: 'Nacional', icon: Star, color: 'text-gold-400 bg-gold-500/20' },
  { id: 'religious', label: 'Religioso', icon: Church, color: 'text-purple-400 bg-purple-500/20' },
  { id: 'company', label: 'Empresa', icon: Building2, color: 'text-blue-400 bg-blue-500/20' },
  { id: 'custom', label: 'Personalizado', icon: Sparkles, color: 'text-emerald-400 bg-emerald-500/20' },
];

const MONTHS = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
];

const PANAMA_HOLIDAYS = [
  { name: 'Año Nuevo', month: 1, day: 1, category: 'national' },
  { name: 'Día de los Mártires', month: 1, day: 9, category: 'national' },
  { name: 'Martes de Carnaval', month: null, day: null, category: 'national', isVariable: true, variableRule: 'carnival' },
  { name: 'Miércoles de Ceniza', month: null, day: null, category: 'religious', isVariable: true, variableRule: 'ash-wednesday' },
  { name: 'Viernes Santo', month: null, day: null, category: 'religious', isVariable: true, variableRule: 'good-friday' },
  { name: 'Día del Trabajo', month: 5, day: 1, category: 'national' },
  { name: 'Separación de Panamá de Colombia', month: 11, day: 3, category: 'national' },
  { name: 'Día de la Bandera', month: 11, day: 4, category: 'national' },
  { name: 'Primer Grito de Independencia', month: 11, day: 10, category: 'national' },
  { name: 'Independencia de Panamá de España', month: 11, day: 28, category: 'national' },
  { name: 'Día de la Madre', month: 12, day: 8, category: 'national' },
  { name: 'Nochebuena', month: 12, day: 24, category: 'religious' },
  { name: 'Navidad', month: 12, day: 25, category: 'religious' },
  { name: 'Nochevieja', month: 12, day: 31, category: 'national' },
];

const DEFAULT_FORM: HolidayForm = {
  name: '',
  description: '',
  month: '',
  day: '',
  isRecurring: true,
  isVariable: false,
  variableRule: '',
  category: 'national',
};

const DEFAULT_PERIOD_FORM: PeriodForm = {
  name: '',
  description: '',
  startMonth: '',
  startDay: '',
  endMonth: '',
  endDay: '',
};

export default function HolidaysPage() {
  const { session, organization } = useAuth();
  const { toast } = useToast();

  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [periods, setPeriods] = useState<HolidayPeriod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'holidays' | 'periods'>('holidays');

  // Holiday modal state
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [holidayForm, setHolidayForm] = useState<HolidayForm>(DEFAULT_FORM);
  const [isSaving, setIsSaving] = useState(false);

  // Period modal state
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<HolidayPeriod | null>(null);
  const [periodForm, setPeriodForm] = useState<PeriodForm>(DEFAULT_PERIOD_FORM);

  // Bulk import state
  const [isImporting, setIsImporting] = useState(false);

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

      // Fetch holidays
      const holidaysRes = await fetch(
        `${baseUrl}/rest/v1/organization_holidays?organization_id=eq.${organization!.id}&order=month.asc,day.asc`,
        { headers }
      );
      if (holidaysRes.ok) {
        setHolidays(await holidaysRes.json());
      }

      // Fetch periods
      const periodsRes = await fetch(
        `${baseUrl}/rest/v1/holiday_periods?organization_id=eq.${organization!.id}&order=start_month.asc`,
        { headers }
      );
      if (periodsRes.ok) {
        setPeriods(await periodsRes.json());
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ title: 'Error', description: 'Failed to load holidays', variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const openHolidayModal = (holiday?: Holiday) => {
    if (holiday) {
      setEditingHoliday(holiday);
      setHolidayForm({
        name: holiday.name,
        description: holiday.description || '',
        month: holiday.month?.toString() || '',
        day: holiday.day?.toString() || '',
        isRecurring: holiday.is_recurring,
        isVariable: holiday.is_variable,
        variableRule: holiday.variable_rule || '',
        category: holiday.category,
      });
    } else {
      setEditingHoliday(null);
      setHolidayForm(DEFAULT_FORM);
    }
    setShowHolidayModal(true);
  };

  const openPeriodModal = (period?: HolidayPeriod) => {
    if (period) {
      setEditingPeriod(period);
      setPeriodForm({
        name: period.name,
        description: period.description || '',
        startMonth: period.start_month?.toString() || '',
        startDay: period.start_day?.toString() || '',
        endMonth: period.end_month?.toString() || '',
        endDay: period.end_day?.toString() || '',
      });
    } else {
      setEditingPeriod(null);
      setPeriodForm(DEFAULT_PERIOD_FORM);
    }
    setShowPeriodModal(true);
  };

  const handleSaveHoliday = async () => {
    if (!holidayForm.name) {
      toast({ title: 'Error', description: 'Nombre es requerido', variant: 'error' });
      return;
    }

    if (!holidayForm.isVariable && (!holidayForm.month || !holidayForm.day)) {
      toast({ title: 'Error', description: 'Mes y día son requeridos para fechas fijas', variant: 'error' });
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

      const holidayData = {
        organization_id: organization!.id,
        name: holidayForm.name,
        description: holidayForm.description || null,
        month: holidayForm.isVariable ? null : parseInt(holidayForm.month),
        day: holidayForm.isVariable ? null : parseInt(holidayForm.day),
        is_recurring: holidayForm.isRecurring,
        is_variable: holidayForm.isVariable,
        variable_rule: holidayForm.isVariable ? holidayForm.variableRule : null,
        category: holidayForm.category,
        is_active: true,
      };

      if (editingHoliday) {
        const res = await fetch(
          `${baseUrl}/rest/v1/organization_holidays?id=eq.${editingHoliday.id}`,
          { method: 'PATCH', headers, body: JSON.stringify(holidayData) }
        );
        if (!res.ok) throw new Error('Failed to update');
      } else {
        const res = await fetch(
          `${baseUrl}/rest/v1/organization_holidays`,
          { method: 'POST', headers, body: JSON.stringify(holidayData) }
        );
        if (!res.ok) throw new Error('Failed to create');
      }

      toast({ title: 'Éxito', description: editingHoliday ? 'Feriado actualizado' : 'Feriado creado' });
      setShowHolidayModal(false);
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo guardar', variant: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePeriod = async () => {
    if (!periodForm.name) {
      toast({ title: 'Error', description: 'Nombre es requerido', variant: 'error' });
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

      const periodData = {
        organization_id: organization!.id,
        name: periodForm.name,
        description: periodForm.description || null,
        start_month: periodForm.startMonth ? parseInt(periodForm.startMonth) : null,
        start_day: periodForm.startDay ? parseInt(periodForm.startDay) : null,
        end_month: periodForm.endMonth ? parseInt(periodForm.endMonth) : null,
        end_day: periodForm.endDay ? parseInt(periodForm.endDay) : null,
        is_active: true,
      };

      if (editingPeriod) {
        const res = await fetch(
          `${baseUrl}/rest/v1/holiday_periods?id=eq.${editingPeriod.id}`,
          { method: 'PATCH', headers, body: JSON.stringify(periodData) }
        );
        if (!res.ok) throw new Error('Failed to update');
      } else {
        const res = await fetch(
          `${baseUrl}/rest/v1/holiday_periods`,
          { method: 'POST', headers, body: JSON.stringify(periodData) }
        );
        if (!res.ok) throw new Error('Failed to create');
      }

      toast({ title: 'Éxito', description: editingPeriod ? 'Período actualizado' : 'Período creado' });
      setShowPeriodModal(false);
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo guardar', variant: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (type: 'holiday' | 'period', id: string, name: string) => {
    if (!confirm(`¿Eliminar "${name}"?`)) return;

    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const table = type === 'holiday' ? 'organization_holidays' : 'holiday_periods';

      const res = await fetch(
        `${baseUrl}/rest/v1/${table}?id=eq.${id}`,
        {
          method: 'DELETE',
          headers: {
            'apikey': apiKey!,
            'Authorization': `Bearer ${session!.access_token}`,
          },
        }
      );

      if (!res.ok) throw new Error('Failed to delete');

      toast({ title: 'Eliminado' });
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo eliminar', variant: 'error' });
    }
  };

  const handleImportPanamaHolidays = async () => {
    if (!confirm('¿Importar todos los feriados de Panamá? Esto agregará los feriados que no existan.')) return;

    setIsImporting(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const headers = {
        'Content-Type': 'application/json',
        'apikey': apiKey!,
        'Authorization': `Bearer ${session!.access_token}`,
      };

      // Filter out holidays that already exist
      const existingNames = holidays.map(h => h.name.toLowerCase());
      const toImport = PANAMA_HOLIDAYS.filter(h => !existingNames.includes(h.name.toLowerCase()));

      if (toImport.length === 0) {
        toast({ title: 'Info', description: 'Todos los feriados ya están importados' });
        return;
      }

      const holidaysToCreate = toImport.map(h => ({
        organization_id: organization!.id,
        name: h.name,
        month: h.month,
        day: h.day,
        is_recurring: true,
        is_variable: h.isVariable || false,
        variable_rule: h.variableRule || null,
        category: h.category,
        is_active: true,
      }));

      const res = await fetch(
        `${baseUrl}/rest/v1/organization_holidays`,
        { method: 'POST', headers, body: JSON.stringify(holidaysToCreate) }
      );

      if (!res.ok) throw new Error('Failed to import');

      toast({ title: 'Éxito', description: `${toImport.length} feriados importados` });
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudieron importar', variant: 'error' });
    } finally {
      setIsImporting(false);
    }
  };

  const getCategoryInfo = (category: string) => {
    return CATEGORIES.find(c => c.id === category) || CATEGORIES[3];
  };

  const formatDate = (month: number | null, day: number | null) => {
    if (!month || !day) return 'Fecha variable';
    return `${day} de ${MONTHS[month - 1]?.label}`;
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
          <h1 className="text-2xl font-display font-bold text-white">Feriados y Períodos</h1>
          <p className="text-muted mt-1">Configura días festivos para usar en reglas de reserva</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleImportPanamaHolidays}
            disabled={isImporting}
          >
            {isImporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Copy className="w-4 h-4 mr-2" />
            )}
            Importar Panamá
          </Button>
          <Button onClick={() => activeTab === 'holidays' ? openHolidayModal() : openPeriodModal()}>
            <Plus className="w-4 h-4 mr-2" />
            {activeTab === 'holidays' ? 'Nuevo Feriado' : 'Nuevo Período'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === 'holidays' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('holidays')}
          className={cn(
            activeTab === 'holidays'
              ? 'bg-gold-500 text-navy-900'
              : 'border-border text-muted'
          )}
        >
          <Calendar className="w-4 h-4 mr-2" />
          Feriados ({holidays.length})
        </Button>
        <Button
          variant={activeTab === 'periods' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('periods')}
          className={cn(
            activeTab === 'periods'
              ? 'bg-gold-500 text-navy-900'
              : 'border-border text-muted'
          )}
        >
          <CalendarDays className="w-4 h-4 mr-2" />
          Períodos ({periods.length})
        </Button>
      </div>

      {/* Info Card */}
      <Card className="bg-gold-500/5 border-gold-500/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-gold-500 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="text-white font-medium">¿Cómo usar feriados en reglas?</p>
              <p className="text-muted mt-1">
                {activeTab === 'holidays'
                  ? 'Los feriados individuales se pueden seleccionar en las reglas de reserva. Por ejemplo, "Navidad" o "Día de los Mártires".'
                  : 'Los períodos definen rangos de fechas como "Temporada Alta" o "Semana Santa" que agrupan varios días.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Holidays List */}
      {activeTab === 'holidays' && (
        <div className="grid gap-3">
          {holidays.length === 0 ? (
            <Card className="bg-surface border-border">
              <CardContent className="py-12 text-center">
                <Calendar className="w-12 h-12 text-muted mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Sin feriados configurados</h3>
                <p className="text-muted mb-4">Agrega feriados o importa los de Panamá</p>
                <div className="flex justify-center gap-2">
                  <Button variant="outline" onClick={handleImportPanamaHolidays}>
                    <Copy className="w-4 h-4 mr-2" />
                    Importar Panamá
                  </Button>
                  <Button onClick={() => openHolidayModal()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Feriado
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            holidays.map((holiday) => {
              const categoryInfo = getCategoryInfo(holiday.category);
              const CategoryIcon = categoryInfo.icon;

              return (
                <Card key={holiday.id} className="bg-surface border-border hover:border-gold-500/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg", categoryInfo.color)}>
                          <CategoryIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-medium text-white">{holiday.name}</h3>
                          <p className="text-sm text-muted">
                            {formatDate(holiday.month, holiday.day)}
                            {holiday.is_variable && holiday.variable_rule && (
                              <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-purple-500/20 text-purple-400">
                                Variable
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "px-2 py-0.5 text-xs rounded border",
                          holiday.is_active
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                            : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                        )}>
                          {holiday.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                        <button
                          onClick={() => openHolidayModal(holiday)}
                          className="p-2 rounded hover:bg-navy-800 text-muted hover:text-white"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete('holiday', holiday.id, holiday.name)}
                          className="p-2 rounded hover:bg-red-500/20 text-muted hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Periods List */}
      {activeTab === 'periods' && (
        <div className="grid gap-3">
          {periods.length === 0 ? (
            <Card className="bg-surface border-border">
              <CardContent className="py-12 text-center">
                <CalendarDays className="w-12 h-12 text-muted mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Sin períodos configurados</h3>
                <p className="text-muted mb-4">Los períodos agrupan rangos de fechas para usar en reglas</p>
                <Button onClick={() => openPeriodModal()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Período
                </Button>
              </CardContent>
            </Card>
          ) : (
            periods.map((period) => (
              <Card key={period.id} className="bg-surface border-border hover:border-gold-500/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gold-500/20">
                        <CalendarDays className="w-4 h-4 text-gold-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-white">{period.name}</h3>
                        <p className="text-sm text-muted">
                          {period.start_month && period.start_day && period.end_month && period.end_day
                            ? `${period.start_day}/${period.start_month} - ${period.end_day}/${period.end_month}`
                            : 'Fechas no definidas'}
                        </p>
                        {period.description && (
                          <p className="text-xs text-muted mt-1">{period.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openPeriodModal(period)}
                        className="p-2 rounded hover:bg-navy-800 text-muted hover:text-white"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete('period', period.id, period.name)}
                        className="p-2 rounded hover:bg-red-500/20 text-muted hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Holiday Modal */}
      {showHolidayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowHolidayModal(false)} />
          <Card className="relative z-10 w-full max-w-md bg-surface border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xl font-display">
                {editingHoliday ? 'Editar Feriado' : 'Nuevo Feriado'}
              </CardTitle>
              <button onClick={() => setShowHolidayModal(false)} className="p-2 rounded hover:bg-navy-800 text-muted hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nombre *</Label>
                <Input
                  value={holidayForm.name}
                  onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })}
                  placeholder="Ej: Navidad"
                  className="bg-navy-800 border-border"
                />
              </div>

              <div>
                <Label>Descripción</Label>
                <Input
                  value={holidayForm.description}
                  onChange={(e) => setHolidayForm({ ...holidayForm, description: e.target.value })}
                  placeholder="Opcional"
                  className="bg-navy-800 border-border"
                />
              </div>

              <div>
                <Label>Categoría</Label>
                <select
                  value={holidayForm.category}
                  onChange={(e) => setHolidayForm({ ...holidayForm, category: e.target.value })}
                  className="w-full px-4 py-2 bg-navy-800 border border-border rounded-lg text-white"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <label className={cn(
                "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                holidayForm.isVariable
                  ? "border-purple-500/50 bg-purple-500/10"
                  : "border-border"
              )}>
                <input
                  type="checkbox"
                  checked={holidayForm.isVariable}
                  onChange={(e) => setHolidayForm({ ...holidayForm, isVariable: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <div>
                  <span className="text-white">Fecha Variable</span>
                  <p className="text-xs text-muted">Para feriados como Carnaval o Semana Santa</p>
                </div>
              </label>

              {!holidayForm.isVariable ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Mes *</Label>
                    <select
                      value={holidayForm.month}
                      onChange={(e) => setHolidayForm({ ...holidayForm, month: e.target.value })}
                      className="w-full px-4 py-2 bg-navy-800 border border-border rounded-lg text-white"
                    >
                      <option value="">Seleccionar...</option>
                      {MONTHS.map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Día *</Label>
                    <Input
                      type="number"
                      value={holidayForm.day}
                      onChange={(e) => setHolidayForm({ ...holidayForm, day: e.target.value })}
                      min={1}
                      max={31}
                      className="bg-navy-800 border-border"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <Label>Regla Variable</Label>
                  <select
                    value={holidayForm.variableRule}
                    onChange={(e) => setHolidayForm({ ...holidayForm, variableRule: e.target.value })}
                    className="w-full px-4 py-2 bg-navy-800 border border-border rounded-lg text-white"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="carnival">Carnaval</option>
                    <option value="ash-wednesday">Miércoles de Ceniza</option>
                    <option value="good-friday">Viernes Santo</option>
                    <option value="easter">Domingo de Pascua</option>
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-border">
                <Button variant="outline" onClick={() => setShowHolidayModal(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleSaveHoliday} disabled={isSaving} className="flex-1">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingHoliday ? 'Actualizar' : 'Crear')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Period Modal */}
      {showPeriodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowPeriodModal(false)} />
          <Card className="relative z-10 w-full max-w-md bg-surface border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xl font-display">
                {editingPeriod ? 'Editar Período' : 'Nuevo Período'}
              </CardTitle>
              <button onClick={() => setShowPeriodModal(false)} className="p-2 rounded hover:bg-navy-800 text-muted hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nombre *</Label>
                <Input
                  value={periodForm.name}
                  onChange={(e) => setPeriodForm({ ...periodForm, name: e.target.value })}
                  placeholder="Ej: Temporada Alta"
                  className="bg-navy-800 border-border"
                />
              </div>

              <div>
                <Label>Descripción</Label>
                <Input
                  value={periodForm.description}
                  onChange={(e) => setPeriodForm({ ...periodForm, description: e.target.value })}
                  placeholder="Opcional"
                  className="bg-navy-800 border-border"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Inicio - Mes</Label>
                  <select
                    value={periodForm.startMonth}
                    onChange={(e) => setPeriodForm({ ...periodForm, startMonth: e.target.value })}
                    className="w-full px-4 py-2 bg-navy-800 border border-border rounded-lg text-white"
                  >
                    <option value="">Mes...</option>
                    {MONTHS.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Inicio - Día</Label>
                  <Input
                    type="number"
                    value={periodForm.startDay}
                    onChange={(e) => setPeriodForm({ ...periodForm, startDay: e.target.value })}
                    min={1}
                    max={31}
                    className="bg-navy-800 border-border"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Fin - Mes</Label>
                  <select
                    value={periodForm.endMonth}
                    onChange={(e) => setPeriodForm({ ...periodForm, endMonth: e.target.value })}
                    className="w-full px-4 py-2 bg-navy-800 border border-border rounded-lg text-white"
                  >
                    <option value="">Mes...</option>
                    {MONTHS.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Fin - Día</Label>
                  <Input
                    type="number"
                    value={periodForm.endDay}
                    onChange={(e) => setPeriodForm({ ...periodForm, endDay: e.target.value })}
                    min={1}
                    max={31}
                    className="bg-navy-800 border-border"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-border">
                <Button variant="outline" onClick={() => setShowPeriodModal(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleSavePeriod} disabled={isSaving} className="flex-1">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingPeriod ? 'Actualizar' : 'Crear')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
