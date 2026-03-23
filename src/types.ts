export type VendorStatus = 'active' | 'inactive' | 'trial';
export type BillingCycle = 'monthly' | 'annual' | 'usage-based';
export type PaymentMethod = 'credit-card' | 'invoice' | 'ach' | 'wire';

export interface VendorInfo {
  id: string;
  name: string;
  category: string;
  status: VendorStatus;
  billingCycle: BillingCycle;
  paymentMethod: PaymentMethod;
  contractRenews?: string;
  accountId?: string;
  billingContact?: string;
  notes?: string;
  internalContact?: string;
  dataSource?: string;
  vendorContact?: string;
  supportPhone?: string;
  supportEmail?: string;
  billingAddress?: string;
  website?: string;
  loginUrl?: string;
  created_at?: string;
  modified_at?: string;
}

export interface SpendRow {
  vendor: string;
  month: string;
  amount: number;
}

export interface SpendResponse {
  vendors: string[];
  from: string;
  to: string;
  data: SpendRow[];
}

export interface SpendErrorResponse {
  error: string;
  details: string;
}

export interface VendorOption {
  value: string;
  label: string;
}

export const VENDORS: VendorOption[] = [
  { value: 'aws', label: 'AWS' },
  { value: 'gcs', label: 'GCS' },
  { value: 'cursor', label: 'Cursor' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'rhonda-bender', label: 'Rhonda Bender' },
];
