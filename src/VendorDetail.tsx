import { useState, useEffect, useCallback } from 'react';
import {
  Separator,
  Button,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@haderach/shared-ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './components/ui/dialog';
import { Loader2, Pencil } from 'lucide-react';
import type { VendorInfo, VendorStatus, BillingCycle, PaymentMethod } from './types';

const statusLabels: Record<VendorStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  trial: 'Trial',
};

const statusColors: Record<VendorStatus, string> = {
  active: 'bg-emerald-100 text-emerald-800',
  inactive: 'bg-gray-100 text-gray-600',
  trial: 'bg-amber-100 text-amber-800',
};

const paymentLabels: Record<string, string> = {
  'credit-card': 'Credit Card',
  'credit_card': 'Credit Card',
  invoice: 'Invoice',
  ach: 'ACH',
  wire: 'Wire',
};

const cycleLabels: Record<string, string> = {
  monthly: 'Monthly',
  annual: 'Annual',
  'usage-based': 'Usage-based',
};

function formatDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso.includes('T') ? iso : iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

interface DetailRowProps {
  label: string;
  value?: string;
  href?: boolean;
}

function DetailRow({ label, value, href }: DetailRowProps) {
  const display = value || '—';
  return (
    <div className="grid grid-cols-[140px_1fr] gap-2 py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      {href && value ? (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline truncate"
        >
          {display}
        </a>
      ) : (
        <span className="text-sm">{display}</span>
      )}
    </div>
  );
}

interface EditRowProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}

function EditRow({ label, value, onChange, type = 'text' }: EditRowProps) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-2 py-1.5 items-center">
      <label className="text-sm text-muted-foreground">{label}</label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 text-sm"
      />
    </div>
  );
}

interface SelectRowProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}

function SelectRow({ label, value, onChange, options }: SelectRowProps) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-2 py-1.5 items-center">
      <label className="text-sm text-muted-foreground">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface CheckboxRowProps {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

function CheckboxRow({ label, checked, onChange }: CheckboxRowProps) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-2 py-1.5 items-center">
      <span className="text-sm text-muted-foreground">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-input accent-primary"
      />
    </div>
  );
}

interface VendorDetailProps {
  vendor: VendorInfo | null;
  open: boolean;
  onClose: () => void;
  editing?: boolean;
  onSave?: () => void;
}

type FormState = {
  name: string;
  category: string;
  status: VendorStatus;
  billingCycle: BillingCycle;
  paymentMethod: PaymentMethod;
  accountId: string;
  contractRenews: string;
  billingContact: string;
  billingAddress: string;
  internalContact: string;
  vendorContact: string;
  supportEmail: string;
  supportPhone: string;
  billingAdmin: string;
  michaelAdded: boolean;
  website: string;
  loginUrl: string;
  dataSource: string;
  notes: string;
};

function vendorToForm(v: VendorInfo): FormState {
  return {
    name: v.name ?? '',
    category: v.category ?? '',
    status: v.status ?? 'active',
    billingCycle: v.billingCycle ?? 'monthly',
    paymentMethod: v.paymentMethod ?? 'credit-card',
    accountId: v.accountId ?? '',
    contractRenews: v.contractRenews ?? '',
    billingContact: v.billingContact ?? '',
    billingAddress: v.billingAddress ?? '',
    internalContact: v.internalContact ?? '',
    vendorContact: v.vendorContact ?? '',
    supportEmail: v.supportEmail ?? '',
    supportPhone: v.supportPhone ?? '',
    billingAdmin: v.billingAdmin ?? '',
    michaelAdded: v.michaelAdded ?? false,
    website: v.website ?? '',
    loginUrl: v.loginUrl ?? '',
    dataSource: v.dataSource ?? '',
    notes: v.notes ?? '',
  };
}

function formToUpdates(form: FormState, original: VendorInfo): Record<string, unknown> {
  const orig = vendorToForm(original);
  const updates: Record<string, unknown> = {};
  for (const key of Object.keys(form) as (keyof FormState)[]) {
    if (form[key] !== orig[key]) {
      updates[key] = form[key];
    }
  }
  return updates;
}

const STATUS_OPTIONS: { value: VendorStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'trial', label: 'Trial' },
];

const CYCLE_OPTIONS: { value: BillingCycle; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'annual', label: 'Annual' },
  { value: 'usage-based', label: 'Usage-based' },
];

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'credit-card', label: 'Credit Card' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'ach', label: 'ACH' },
  { value: 'wire', label: 'Wire' },
];

interface PlatformUser {
  email: string;
  firstName: string;
  lastName: string;
}

function userDisplayName(u: PlatformUser): string {
  const full = [u.firstName, u.lastName].filter(Boolean).join(' ');
  return full || u.email;
}

export function VendorDetail({ vendor, open, onClose, editing: editingProp = false, onSave }: VendorDetailProps) {
  const [isEditing, setIsEditing] = useState(editingProp);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [vendorMembers, setVendorMembers] = useState<PlatformUser[]>([]);

  useEffect(() => {
    if (vendor && open) {
      setForm(vendorToForm(vendor));
      setIsEditing(editingProp);
    }
  }, [vendor, open, editingProp]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch('/agent/api/users?role=vendors_member')
      .then((r) => r.json())
      .then((data: PlatformUser[]) => { if (!cancelled) setVendorMembers(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [open]);

  const updateField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => prev ? { ...prev, [key]: value } : prev);
  }, []);

  const handleSave = useCallback(async () => {
    if (!vendor || !form) return;
    const updates = formToUpdates(form, vendor);
    if (Object.keys(updates).length === 0) {
      setIsEditing(false);
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      const resp = await fetch(`/agent/api/vendors/${vendor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!resp.ok) {
        const text = await resp.text();
        setSaveError(`Error ${resp.status}: ${text}`);
        return;
      }
      setIsEditing(false);
      onSave?.();
    } catch (err) {
      setSaveError(`Network error: ${err instanceof Error ? err.message : err}`);
    } finally {
      setSaving(false);
    }
  }, [vendor, form, onSave]);

  const handleCancel = useCallback(() => {
    if (vendor) setForm(vendorToForm(vendor));
    setSaveError(null);
    setIsEditing(false);
  }, [vendor]);

  const handleClose = useCallback(() => {
    setIsEditing(false);
    setSaveError(null);
    onClose();
  }, [onClose]);

  if (!vendor || !form) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {vendor.name}
            <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[vendor.status]}`}>
              {statusLabels[vendor.status]}
            </span>
            {!isEditing && (
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto size-7"
                onClick={() => setIsEditing(true)}
                aria-label="Edit vendor"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
          </DialogTitle>
          <DialogDescription>{vendor.category}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Account & Billing */}
          <section>
            <h3 className="text-sm font-semibold mb-2">Account & Billing</h3>
            <Separator className="mb-3" />
            {isEditing ? (
              <>
                <EditRow label="Name" value={form.name} onChange={(v) => updateField('name', v)} />
                <EditRow label="Category" value={form.category} onChange={(v) => updateField('category', v)} />
                <SelectRow label="Status" value={form.status} onChange={(v) => updateField('status', v as VendorStatus)} options={STATUS_OPTIONS} />
                <EditRow label="Account ID" value={form.accountId} onChange={(v) => updateField('accountId', v)} />
                <SelectRow label="Billing cycle" value={form.billingCycle} onChange={(v) => updateField('billingCycle', v as BillingCycle)} options={CYCLE_OPTIONS} />
                <SelectRow label="Payment method" value={form.paymentMethod} onChange={(v) => updateField('paymentMethod', v as PaymentMethod)} options={PAYMENT_OPTIONS} />
                <EditRow label="Contract renews" value={form.contractRenews} onChange={(v) => updateField('contractRenews', v)} type="date" />
                <SelectRow
                  label="Billing contact"
                  value={form.billingContact}
                  onChange={(v) => updateField('billingContact', v)}
                  options={vendorMembers.map((u) => ({ value: userDisplayName(u), label: userDisplayName(u) }))}
                />
                <EditRow label="Billing address" value={form.billingAddress} onChange={(v) => updateField('billingAddress', v)} />
              </>
            ) : (
              <>
                <DetailRow label="Account ID" value={vendor.accountId} />
                <DetailRow label="Billing cycle" value={cycleLabels[vendor.billingCycle]} />
                <DetailRow label="Payment method" value={paymentLabels[vendor.paymentMethod]} />
                <DetailRow label="Contract renews" value={formatDate(vendor.contractRenews)} />
                <DetailRow label="Billing contact" value={vendor.billingContact} />
                <DetailRow label="Billing address" value={vendor.billingAddress} />
              </>
            )}
          </section>

          {/* Contacts */}
          <section>
            <h3 className="text-sm font-semibold mb-2">Contacts</h3>
            <Separator className="mb-3" />
            {isEditing ? (
              <>
                <SelectRow
                  label="Internal contact"
                  value={form.internalContact}
                  onChange={(v) => updateField('internalContact', v)}
                  options={vendorMembers.map((u) => ({ value: userDisplayName(u), label: userDisplayName(u) }))}
                />
                <EditRow label="Vendor contact" value={form.vendorContact} onChange={(v) => updateField('vendorContact', v)} />
                <EditRow label="Support email" value={form.supportEmail} onChange={(v) => updateField('supportEmail', v)} type="email" />
                <EditRow label="Support phone" value={form.supportPhone} onChange={(v) => updateField('supportPhone', v)} type="tel" />
                <EditRow label="Billing admin" value={form.billingAdmin} onChange={(v) => updateField('billingAdmin', v)} />
                <CheckboxRow label="Michael added" checked={form.michaelAdded} onChange={(v) => updateField('michaelAdded', v)} />
              </>
            ) : (
              <>
                <DetailRow label="Internal contact" value={vendor.internalContact} />
                <DetailRow label="Vendor contact" value={vendor.vendorContact} />
                <DetailRow label="Support email" value={vendor.supportEmail} />
                <DetailRow label="Support phone" value={vendor.supportPhone} />
                <DetailRow label="Billing admin" value={vendor.billingAdmin} />
                <DetailRow label="Michael added" value={vendor.michaelAdded ? 'Yes' : 'No'} />
              </>
            )}
          </section>

          {/* Links & Integration */}
          <section>
            <h3 className="text-sm font-semibold mb-2">Links & Integration</h3>
            <Separator className="mb-3" />
            {isEditing ? (
              <>
                <EditRow label="Website" value={form.website} onChange={(v) => updateField('website', v)} type="url" />
                <EditRow label="Login URL" value={form.loginUrl} onChange={(v) => updateField('loginUrl', v)} type="url" />
                <EditRow label="Data source" value={form.dataSource} onChange={(v) => updateField('dataSource', v)} />
              </>
            ) : (
              <>
                <DetailRow label="Website" value={vendor.website} href />
                <DetailRow label="Login URL" value={vendor.loginUrl} href />
                <DetailRow label="Data source" value={vendor.dataSource} />
              </>
            )}
          </section>

          {/* Record */}
          <section>
            <h3 className="text-sm font-semibold mb-2">Record</h3>
            <Separator className="mb-3" />
            <DetailRow label="Created" value={formatDate(vendor.created_at)} />
            <DetailRow label="Last modified" value={formatDate(vendor.modified_at)} />
          </section>

          {/* Notes */}
          <section>
            <h3 className="text-sm font-semibold mb-2">Notes</h3>
            <Separator className="mb-3" />
            {isEditing ? (
              <textarea
                value={form.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                rows={3}
                className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            ) : (
              <p className="text-sm whitespace-pre-wrap">{vendor.notes || '—'}</p>
            )}
          </section>

          {/* Save / Cancel */}
          {isEditing && (
            <div className="flex items-center justify-end gap-2 pt-2">
              {saveError && (
                <p className="mr-auto text-sm text-red-600">{saveError}</p>
              )}
              <Button variant="outline" onClick={handleCancel} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
