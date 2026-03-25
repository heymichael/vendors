export interface VendorInfo {
  id: string;
  name: string;
  billcomId?: string;
  nameLower?: string;
  paymentMethod?: string | null;
  accountType?: string | null;
  track1099?: boolean;
  toolCall?: string;
  lastSyncedAt?: string;
  owner?: string;
  secondaryOwner?: string;
  department?: string;
  purpose?: string;
  spendType?: string;
  hide?: boolean;
  contractStartDate?: string;
  contractEndDate?: string;
  contractLengthMonths?: number;
  autoRenew?: boolean | string;
  renewalRate?: string | number;
  renewalNoticeDays?: number;
  billingFrequency?: string;
  terminationTerms?: string;
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
