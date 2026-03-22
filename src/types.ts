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
