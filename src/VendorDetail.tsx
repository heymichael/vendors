import { Separator } from '@haderach/shared-ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './components/ui/dialog';
import type { VendorInfo, VendorStatus } from './types';

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
  const d = new Date(iso + 'T00:00:00');
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

interface VendorDetailProps {
  vendor: VendorInfo | null;
  open: boolean;
  onClose: () => void;
}

export function VendorDetail({ vendor, open, onClose }: VendorDetailProps) {
  if (!vendor) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {vendor.name}
            <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[vendor.status]}`}>
              {statusLabels[vendor.status]}
            </span>
          </DialogTitle>
          <DialogDescription>{vendor.category}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <section>
            <h3 className="text-sm font-semibold mb-2">Account & Billing</h3>
            <Separator className="mb-3" />
            <DetailRow label="Account ID" value={vendor.accountId} />
            <DetailRow label="Billing cycle" value={cycleLabels[vendor.billingCycle]} />
            <DetailRow label="Payment method" value={paymentLabels[vendor.paymentMethod]} />
            <DetailRow label="Contract renews" value={formatDate(vendor.contractRenews)} />
            <DetailRow label="Billing contact" value={vendor.billingContact} />
            <DetailRow label="Billing address" value={vendor.billingAddress} />
          </section>

          <section>
            <h3 className="text-sm font-semibold mb-2">Contacts</h3>
            <Separator className="mb-3" />
            <DetailRow label="Internal contact" value={vendor.internalContact} />
            <DetailRow label="Vendor contact" value={vendor.vendorContact} />
            <DetailRow label="Support email" value={vendor.supportEmail} />
            <DetailRow label="Support phone" value={vendor.supportPhone} />
          </section>

          <section>
            <h3 className="text-sm font-semibold mb-2">Links & Integration</h3>
            <Separator className="mb-3" />
            <DetailRow label="Website" value={vendor.website} href />
            <DetailRow label="Login URL" value={vendor.loginUrl} href />
            <DetailRow label="Data source" value={vendor.dataSource} />
          </section>

          {vendor.notes && (
            <section>
              <h3 className="text-sm font-semibold mb-2">Notes</h3>
              <Separator className="mb-3" />
              <p className="text-sm whitespace-pre-wrap">{vendor.notes}</p>
            </section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
