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
  agentFetch,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@haderach/shared-ui';
import { useAuthUser } from './auth/AuthUserContext';
import { Loader2, Pencil } from 'lucide-react';
import type { VendorInfo } from './types';

const BILLING_FREQUENCY_OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'annual', label: 'Annual' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'usage-based', label: 'Usage-based' },
  { value: 'one-time', label: 'One-time' },
];

function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso.includes('T') ? iso : iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

interface DetailRowProps {
  label: string;
  value?: string | null;
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="grid grid-cols-[160px_1fr] gap-2 py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm">{value || '—'}</span>
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
    <div className="grid grid-cols-[160px_1fr] gap-2 py-1.5 items-center">
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
    <div className="grid grid-cols-[160px_1fr] gap-2 py-1.5 items-center">
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
    <div className="grid grid-cols-[160px_1fr] gap-2 py-1.5 items-center">
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
  owner: string;
  secondaryOwner: string;
  department: string;
  purpose: string;
  spendType: string;
  contractStartDate: string;
  contractEndDate: string;
  contractLengthMonths: string;
  autoRenew: boolean;
  renewalRate: string;
  renewalNoticeDays: string;
  billingFrequency: string;
  terminationTerms: string;
};

function vendorToForm(v: VendorInfo): FormState {
  return {
    owner: v.owner ?? '',
    secondaryOwner: v.secondaryOwner ?? '',
    department: v.department ?? '',
    purpose: v.purpose ?? '',
    spendType: v.spendType ?? '',
    contractStartDate: v.contractStartDate ?? '',
    contractEndDate: v.contractEndDate ?? '',
    contractLengthMonths: v.contractLengthMonths != null ? String(v.contractLengthMonths) : '',
    autoRenew: v.autoRenew === true || v.autoRenew === 'true',
    renewalRate: v.renewalRate != null ? String(v.renewalRate) : '',
    renewalNoticeDays: v.renewalNoticeDays != null ? String(v.renewalNoticeDays) : '',
    billingFrequency: v.billingFrequency ?? '',
    terminationTerms: v.terminationTerms ?? '',
  };
}

function formToUpdates(form: FormState, original: VendorInfo): Record<string, unknown> {
  const orig = vendorToForm(original);
  const updates: Record<string, unknown> = {};
  for (const key of Object.keys(form) as (keyof FormState)[]) {
    if (form[key] !== orig[key]) {
      if (key === 'contractLengthMonths' || key === 'renewalNoticeDays') {
        updates[key] = form[key] === '' ? null : Number(form[key]);
      } else if (key === 'renewalRate') {
        updates[key] = form[key] === '' ? null : form[key];
      } else {
        updates[key] = form[key];
      }
    }
  }
  return updates;
}

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
  const { getIdToken } = useAuthUser();
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
    agentFetch('/users?role=user&role=admin', getIdToken)
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
      const resp = await agentFetch(`/vendors/${vendor.id}`, getIdToken, {
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

  const memberOptions = vendorMembers.map((u) => ({
    value: userDisplayName(u),
    label: userDisplayName(u),
  }));

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {vendor.name}
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
          <DialogDescription>
            {vendor.billcomId ? `Bill.com ID: ${vendor.billcomId}` : 'Manually added vendor'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Bill.com Data (read-only) */}
          <section>
            <h3 className="text-sm font-semibold mb-2">Bill.com Data</h3>
            <Separator className="mb-3" />
            <DetailRow label="Bill.com ID" value={vendor.billcomId} />
            <DetailRow label="Payment method" value={vendor.paymentMethod} />
            <DetailRow label="Account type" value={vendor.accountType} />
            <DetailRow label="Track 1099" value={vendor.track1099 ? 'Yes' : 'No'} />
            <DetailRow label="Source" value={vendor.toolCall} />
            <DetailRow label="Last synced" value={formatDate(vendor.lastSyncedAt)} />
          </section>

          {/* Ownership (editable) */}
          <section>
            <h3 className="text-sm font-semibold mb-2">Ownership</h3>
            <Separator className="mb-3" />
            {isEditing ? (
              <>
                <SelectRow
                  label="Owner"
                  value={form.owner}
                  onChange={(v) => updateField('owner', v)}
                  options={memberOptions}
                />
                <SelectRow
                  label="Secondary owner"
                  value={form.secondaryOwner}
                  onChange={(v) => updateField('secondaryOwner', v)}
                  options={memberOptions}
                />
                <EditRow label="Department" value={form.department} onChange={(v) => updateField('department', v)} />
                <EditRow label="Purpose" value={form.purpose} onChange={(v) => updateField('purpose', v)} />
                <EditRow label="Spend type" value={form.spendType} onChange={(v) => updateField('spendType', v)} />
              </>
            ) : (
              <>
                <DetailRow label="Owner" value={vendor.owner} />
                <DetailRow label="Secondary owner" value={vendor.secondaryOwner} />
                <DetailRow label="Department" value={vendor.department} />
                <DetailRow label="Purpose" value={vendor.purpose} />
                <DetailRow label="Spend type" value={vendor.spendType} />
              </>
            )}
          </section>

          {/* Contract (editable) */}
          <section>
            <h3 className="text-sm font-semibold mb-2">Contract</h3>
            <Separator className="mb-3" />
            {isEditing ? (
              <>
                <EditRow label="Start date" value={form.contractStartDate} onChange={(v) => updateField('contractStartDate', v)} type="date" />
                <EditRow label="End date" value={form.contractEndDate} onChange={(v) => updateField('contractEndDate', v)} type="date" />
                <EditRow label="Length (months)" value={form.contractLengthMonths} onChange={(v) => updateField('contractLengthMonths', v)} type="number" />
                <CheckboxRow label="Auto-renew" checked={form.autoRenew} onChange={(v) => updateField('autoRenew', v)} />
                <EditRow label="Renewal rate" value={form.renewalRate} onChange={(v) => updateField('renewalRate', v)} />
                <EditRow label="Notice days" value={form.renewalNoticeDays} onChange={(v) => updateField('renewalNoticeDays', v)} type="number" />
                <SelectRow
                  label="Billing frequency"
                  value={form.billingFrequency}
                  onChange={(v) => updateField('billingFrequency', v)}
                  options={BILLING_FREQUENCY_OPTIONS}
                />
                <EditRow label="Termination terms" value={form.terminationTerms} onChange={(v) => updateField('terminationTerms', v)} />
              </>
            ) : (
              <>
                <DetailRow label="Start date" value={formatDate(vendor.contractStartDate)} />
                <DetailRow label="End date" value={formatDate(vendor.contractEndDate)} />
                <DetailRow label="Length (months)" value={vendor.contractLengthMonths != null ? String(vendor.contractLengthMonths) : undefined} />
                <DetailRow label="Auto-renew" value={vendor.autoRenew != null ? String(vendor.autoRenew) : undefined} />
                <DetailRow label="Renewal rate" value={vendor.renewalRate != null ? String(vendor.renewalRate) : undefined} />
                <DetailRow label="Notice days" value={vendor.renewalNoticeDays != null ? String(vendor.renewalNoticeDays) : undefined} />
                <DetailRow label="Billing frequency" value={vendor.billingFrequency} />
                <DetailRow label="Termination terms" value={vendor.terminationTerms} />
              </>
            )}
          </section>

          {/* Record (read-only) */}
          <section>
            <h3 className="text-sm font-semibold mb-2">Record</h3>
            <Separator className="mb-3" />
            <DetailRow label="Created" value={formatDate(vendor.created_at)} />
            <DetailRow label="Last modified" value={formatDate(vendor.modified_at)} />
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
