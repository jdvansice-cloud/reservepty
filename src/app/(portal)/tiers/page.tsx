'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  Plus,
  Edit,
  Trash2,
  GripVertical,
  Users,
  Calendar,
  Clock,
  Shield,
  X,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

// Type definitions
interface TierRules {
  maxDaysPerMonth: number | null;
  maxConsecutiveDays: number | null;
  minLeadTimeHours: number;
  requiresApproval: boolean;
  canOverride: boolean;
}

interface Tier {
  id: string;
  name: string;
  priority: number;
  color: string;
  memberCount: number;
  rules: TierRules;
}

// Mock data
const mockTiers: Tier[] = [
  {
    id: '1',
    name: 'Principals',
    priority: 1,
    color: '#c8b273',
    memberCount: 2,
    rules: {
      maxDaysPerMonth: null, // Unlimited
      maxConsecutiveDays: null,
      minLeadTimeHours: 0,
      requiresApproval: false,
      canOverride: true,
    },
  },
  {
    id: '2',
    name: 'Family',
    priority: 2,
    color: '#8b5cf6',
    memberCount: 5,
    rules: {
      maxDaysPerMonth: 10,
      maxConsecutiveDays: 5,
      minLeadTimeHours: 72, // 3 days
      requiresApproval: false,
      canOverride: false,
    },
  },
  {
    id: '3',
    name: 'Staff',
    priority: 3,
    color: '#22c55e',
    memberCount: 8,
    rules: {
      maxDaysPerMonth: 5,
      maxConsecutiveDays: 2,
      minLeadTimeHours: 168, // 7 days
      requiresApproval: true,
      canOverride: false,
    },
  },
];

interface TierForm {
  name: string;
  color: string;
  maxDaysPerMonth: string;
  maxConsecutiveDays: string;
  minLeadTimeHours: string;
  requiresApproval: boolean;
  canOverride: boolean;
}

const DEFAULT_COLORS = [
  '#c8b273', '#8b5cf6', '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4',
];

export default function TiersPage() {
  const [tiers, setTiers] = useState<Tier[]>(mockTiers);
  const [showModal, setShowModal] = useState(false);
  const [editingTier, setEditingTier] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [form, setForm] = useState<TierForm>({
    name: '',
    color: DEFAULT_COLORS[0],
    maxDaysPerMonth: '',
    maxConsecutiveDays: '',
    minLeadTimeHours: '0',
    requiresApproval: false,
    canOverride: false,
  });

  const openCreateModal = () => {
    setEditingTier(null);
    setForm({
      name: '',
      color: DEFAULT_COLORS[tiers.length % DEFAULT_COLORS.length],
      maxDaysPerMonth: '',
      maxConsecutiveDays: '',
      minLeadTimeHours: '0',
      requiresApproval: false,
      canOverride: false,
    });
    setShowModal(true);
  };

  const openEditModal = (tier: Tier) => {
    setEditingTier(tier.id);
    setForm({
      name: tier.name,
      color: tier.color,
      maxDaysPerMonth: tier.rules.maxDaysPerMonth?.toString() || '',
      maxConsecutiveDays: tier.rules.maxConsecutiveDays?.toString() || '',
      minLeadTimeHours: tier.rules.minLeadTimeHours.toString(),
      requiresApproval: tier.rules.requiresApproval,
      canOverride: tier.rules.canOverride,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    if (editingTier) {
      setTiers((prev) =>
        prev.map((t) =>
          t.id === editingTier
            ? {
                ...t,
                name: form.name,
                color: form.color,
                rules: {
                  maxDaysPerMonth: form.maxDaysPerMonth ? parseInt(form.maxDaysPerMonth) : null,
                  maxConsecutiveDays: form.maxConsecutiveDays ? parseInt(form.maxConsecutiveDays) : null,
                  minLeadTimeHours: parseInt(form.minLeadTimeHours) || 0,
                  requiresApproval: form.requiresApproval,
                  canOverride: form.canOverride,
                },
              }
            : t
        )
      );
    } else {
      const newTier = {
        id: Date.now().toString(),
        name: form.name,
        priority: tiers.length + 1,
        color: form.color,
        memberCount: 0,
        rules: {
          maxDaysPerMonth: form.maxDaysPerMonth ? parseInt(form.maxDaysPerMonth) : null,
          maxConsecutiveDays: form.maxConsecutiveDays ? parseInt(form.maxConsecutiveDays) : null,
          minLeadTimeHours: parseInt(form.minLeadTimeHours) || 0,
          requiresApproval: form.requiresApproval,
          canOverride: form.canOverride,
        },
      };
      setTiers((prev) => [...prev, newTier]);
    }
    
    setIsSubmitting(false);
    setShowModal(false);
  };

  const handleDelete = (tierId: string) => {
    setTiers((prev) => prev.filter((t) => t.id !== tierId));
    setShowDeleteConfirm(null);
  };

  const formatLeadTime = (hours: number) => {
    if (hours === 0) return 'None';
    if (hours < 24) return `${hours} hours`;
    const days = hours / 24;
    return `${days} day${days > 1 ? 's' : ''}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">Tiers</h1>
          <p className="text-muted mt-1">
            Configure member tiers and booking priority rules
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={openCreateModal}>
            <Plus className="w-4 h-4 mr-2" />
            Add Tier
          </Button>
        </div>
      </div>

      {/* Info Card */}
      <Card className="border-gold-500/20 bg-gold-500/5">
        <CardContent className="p-4 flex items-start gap-3">
          <Shield className="w-5 h-5 text-gold-500 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-white">How Tiers Work</p>
            <p className="text-sm text-muted mt-1">
              Tiers determine booking priority. Higher priority tiers (lower numbers) can override
              lower priority bookings when conflicts occur. Configure rules like booking limits,
              lead times, and approval requirements for each tier.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tiers List */}
      <div className="space-y-4">
        {tiers.map((tier, index) => (
          <Card key={tier.id} className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                {/* Drag Handle & Priority */}
                <div className="flex items-center gap-3">
                  <div className="cursor-grab text-muted hover:text-white">
                    <GripVertical className="w-5 h-5" />
                  </div>
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-display font-bold"
                    style={{ backgroundColor: `${tier.color}20`, color: tier.color }}
                  >
                    {tier.priority}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-display font-semibold text-white">{tier.name}</h3>
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: tier.color }}
                    />
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      <span>{tier.memberCount} members</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {tier.rules.maxDaysPerMonth
                          ? `${tier.rules.maxDaysPerMonth} days/month`
                          : 'Unlimited'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      <span>{formatLeadTime(tier.rules.minLeadTimeHours)} lead time</span>
                    </div>
                  </div>

                  {/* Rules Badges */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {tier.rules.requiresApproval && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-400/10 text-amber-400">
                        Requires Approval
                      </span>
                    )}
                    {tier.rules.canOverride && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gold-500/10 text-gold-500">
                        Can Override
                      </span>
                    )}
                    {tier.rules.maxConsecutiveDays && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-surface text-muted">
                        Max {tier.rules.maxConsecutiveDays} consecutive days
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => openEditModal(tier)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  {tier.priority > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowDeleteConfirm(tier.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <Card className="relative max-w-lg w-full animate-fade-up max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-display">
                {editingTier ? 'Edit Tier' : 'Create Tier'}
              </CardTitle>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-surface text-muted hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Name & Color */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <Label>Tier Name</Label>
                  <Input
                    placeholder="e.g., Family"
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Color</Label>
                  <div className="flex gap-2 flex-wrap mt-2">
                    {DEFAULT_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setForm((prev) => ({ ...prev, color }))}
                        className={cn(
                          'w-8 h-8 rounded-lg transition-all',
                          form.color === color && 'ring-2 ring-white ring-offset-2 ring-offset-navy-900'
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Booking Limits */}
              <div>
                <Label className="text-white font-medium">Booking Limits</Label>
                <p className="text-xs text-muted mb-3">Leave empty for unlimited</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">Days per Month</Label>
                    <Input
                      type="number"
                      placeholder="Unlimited"
                      value={form.maxDaysPerMonth}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, maxDaysPerMonth: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Max Consecutive Days</Label>
                    <Input
                      type="number"
                      placeholder="Unlimited"
                      value={form.maxConsecutiveDays}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, maxConsecutiveDays: e.target.value }))
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Lead Time */}
              <div>
                <Label>Minimum Lead Time</Label>
                <select
                  value={form.minLeadTimeHours}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, minLeadTimeHours: e.target.value }))
                  }
                  className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-white focus:outline-none focus:border-gold-500"
                >
                  <option value="0">No minimum</option>
                  <option value="24">1 day</option>
                  <option value="48">2 days</option>
                  <option value="72">3 days</option>
                  <option value="168">7 days</option>
                  <option value="336">14 days</option>
                </select>
              </div>

              {/* Permissions */}
              <div className="space-y-3">
                <Label className="text-white font-medium">Permissions</Label>
                
                <label className="flex items-center gap-3 p-3 rounded-lg bg-surface cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.requiresApproval}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, requiresApproval: e.target.checked }))
                    }
                    className="w-4 h-4 rounded border-border text-gold-500 focus:ring-gold-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-white">Requires Approval</p>
                    <p className="text-xs text-muted">Bookings must be approved by admins</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-lg bg-surface cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.canOverride}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, canOverride: e.target.checked }))
                    }
                    className="w-4 h-4 rounded border-border text-gold-500 focus:ring-gold-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-white">Can Override</p>
                    <p className="text-xs text-muted">
                      Can override lower-tier bookings when conflicts occur
                    </p>
                  </div>
                </label>
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-4">
                <Button variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSubmit}
                  disabled={!form.name || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {editingTier ? 'Save Changes' : 'Create Tier'}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(null)}
          />
          <Card className="relative max-w-md w-full animate-fade-up">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 mx-auto flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-xl font-display font-semibold text-white mb-2">Delete Tier?</h3>
              <p className="text-muted mb-6">
                Are you sure you want to delete this tier? Members will need to be reassigned to
                another tier.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowDeleteConfirm(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={() => handleDelete(showDeleteConfirm)}
                >
                  Delete Tier
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
