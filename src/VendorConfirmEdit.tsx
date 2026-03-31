import { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  agentFetch,
} from '@haderach/shared-ui';
import { useAuthUser } from './auth/AuthUserContext';
import { Loader2, ArrowRight } from 'lucide-react';

interface DisplayField {
  key: string;
  label: string;
  currentValue?: string | null;
  currentDisplay: string;
  newValue: string;
  newDisplay: string;
  inputType: 'select' | 'text';
  source?: string;
  options?: string[];
}

interface OptionItem {
  value: string;
  label: string;
}

interface VendorConfirmEditProps {
  vendorId: string;
  vendorName: string;
  proposedUpdates: Record<string, unknown>;
  displayFields: DisplayField[];
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const SOURCE_ENDPOINTS: Record<string, string> = {
  departments: '/departments',
  users: '/users?role=user&role=admin',
};

export function VendorConfirmEdit({
  vendorId,
  vendorName,
  proposedUpdates,
  displayFields,
  open,
  onConfirm,
  onCancel,
}: VendorConfirmEditProps) {
  const { getIdToken } = useAuthUser();
  const [values, setValues] = useState<Record<string, string>>({});
  const [sourceOptions, setSourceOptions] = useState<Record<string, OptionItem[]>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const initial: Record<string, string> = {};
    for (const f of displayFields) {
      initial[f.key] = String(f.newValue ?? '');
    }
    setValues(initial);
    setError(null);
  }, [open, displayFields]);

  useEffect(() => {
    if (!open) return;
    const needed = new Set<string>();
    for (const f of displayFields) {
      if (f.inputType === 'select' && f.source && f.source !== 'enum') {
        needed.add(f.source);
      }
    }
    if (needed.size === 0) return;

    let cancelled = false;
    const fetches = [...needed].map(async (source) => {
      const endpoint = SOURCE_ENDPOINTS[source];
      if (!endpoint) return;
      const resp = await agentFetch(endpoint, getIdToken);
      const data = await resp.json();
      if (cancelled) return;

      let opts: OptionItem[];
      if (source === 'departments') {
        opts = data.map((d: { id: string; name: string }) => ({ value: d.id, label: d.name }));
      } else {
        opts = data.map((u: { id?: string; email: string; firstName?: string; lastName?: string }) => {
          const name = [u.firstName, u.lastName].filter(Boolean).join(' ');
          return { value: u.id ?? u.email, label: name || u.email };
        });
      }
      setSourceOptions((prev) => ({ ...prev, [source]: opts }));
    });

    Promise.all(fetches).catch(() => {});
    return () => { cancelled = true; };
  }, [open, displayFields]);

  const updateValue = useCallback((key: string, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  }, []);

  const allFieldsFilled = displayFields.every((f) => {
    const val = values[f.key] ?? f.newValue;
    return val !== '' && val != null;
  });

  const handleConfirm = useCallback(async () => {
    setSaving(true);
    setError(null);
    const updates: Record<string, unknown> = {};
    for (const f of displayFields) {
      const val = values[f.key] ?? f.newValue;
      if (val) updates[f.key] = val;
    }
    try {
      const resp = await agentFetch(`/vendors/${vendorId}`, getIdToken, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!resp.ok) {
        const text = await resp.text();
        setError(`Error ${resp.status}: ${text}`);
        return;
      }
      onConfirm();
    } catch (err) {
      setError(`Network error: ${err instanceof Error ? err.message : err}`);
    } finally {
      setSaving(false);
    }
  }, [vendorId, displayFields, values, onConfirm]);

  function renderNewValue(field: DisplayField) {
    const val = values[field.key] ?? field.newValue;

    if (field.inputType === 'select') {
      let opts: OptionItem[];
      if (field.source === 'enum' && field.options) {
        opts = field.options.map((o) => ({ value: o, label: o }));
      } else if (field.source && sourceOptions[field.source]) {
        opts = sourceOptions[field.source];
      } else {
        return <span className="text-sm">{field.newDisplay}</span>;
      }

      return (
        <Select value={val || undefined} onValueChange={(v) => updateValue(field.key, v)}>
          <SelectTrigger className="h-7 min-w-[140px] max-w-[200px] text-xs">
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent>
            {opts.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    return (
      <Input
        value={val}
        onChange={(e) => updateValue(field.key, e.target.value)}
        className="h-7 min-w-[140px] max-w-[200px] text-xs"
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onCancel(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{vendorName}</DialogTitle>
          <DialogDescription className="sr-only">Confirm vendor changes</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {displayFields.map((field) => (
            <div key={field.key} className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="shrink-0 text-sm text-muted-foreground">
                {field.label}
              </span>
              <span className="text-sm text-muted-foreground truncate">
                {field.currentDisplay}
              </span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              {renderNewValue(field)}
            </div>
          ))}
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <DialogFooter className="justify-center sm:justify-center">
          <Button variant="outline" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={saving || !allFieldsFilled}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
