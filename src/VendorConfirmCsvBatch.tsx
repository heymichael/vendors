import { useState, useCallback } from 'react';
import {
  Button,
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

interface DisplayChange {
  label: string;
  from: string;
  to: string;
}

interface BatchUpdate {
  vendor_id: string;
  vendor_name: string;
  changes: Record<string, unknown>;
  display_changes: DisplayChange[];
}

interface BatchSummary {
  vendor_count: number;
  field_counts: Record<string, number>;
}

interface VendorConfirmCsvBatchProps {
  updates: BatchUpdate[];
  summary: BatchSummary;
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const FIELD_LABELS: Record<string, string> = {
  department: 'Department',
  owner: 'Owner',
  secondaryOwner: 'Secondary owner',
  billingFrequency: 'Billing frequency',
  purpose: 'Purpose',
  spendType: 'Spend type',
  contractStartDate: 'Contract start',
  contractEndDate: 'Contract end',
  autoRenew: 'Auto renew',
};

export function VendorConfirmCsvBatch({
  updates,
  summary,
  open,
  onConfirm,
  onCancel,
}: VendorConfirmCsvBatchProps) {
  const { getIdToken } = useAuthUser();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const resp = await agentFetch('/vendors/batch-update', getIdToken, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
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
  }, [updates, getIdToken, onConfirm]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onCancel(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Confirm batch update</DialogTitle>
          <DialogDescription>
            {summary.vendor_count} vendor{summary.vendor_count === 1 ? '' : 's'} will be updated.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto py-2">
          <div
            className="grid gap-y-1.5 text-sm items-center"
            style={{ gridTemplateColumns: 'auto auto auto auto 1fr' }}
          >
            {updates.map((u) => (
              u.display_changes.map((dc, i) => (
                <div key={`${u.vendor_id}-${dc.label}`} className="contents">
                  <span className="font-semibold pr-4 truncate">
                    {i === 0 ? u.vendor_name : ''}
                  </span>
                  <span className="font-semibold pr-3">
                    {FIELD_LABELS[dc.label] ?? dc.label}
                  </span>
                  <span className="text-muted-foreground text-right pr-2 truncate">
                    {dc.from}
                  </span>
                  <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground mx-1" />
                  <span>{dc.to}</span>
                </div>
              ))
            ))}
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <DialogFooter className="justify-center sm:justify-center">
          <Button variant="outline" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm All ({summary.vendor_count})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
