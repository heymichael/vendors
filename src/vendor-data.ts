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
}

export const VENDOR_DATA: VendorInfo[] = [
  {
    id: 'aws',
    name: 'Amazon Web Services',
    category: 'Cloud Infrastructure',
    status: 'active',
    billingCycle: 'monthly',
    paymentMethod: 'invoice',
    contractRenews: '2026-06-15',
    accountId: '',
    billingContact: '',
    internalContact: '',
    dataSource: 'Cost Explorer API',
    vendorContact: '',
    supportPhone: '',
    supportEmail: '',
    billingAddress: '',
    website: 'https://aws.amazon.com',
    loginUrl: 'https://console.aws.amazon.com',
    notes: '',
  },
  {
    id: 'gcs',
    name: 'Google Cloud Platform',
    category: 'Cloud Infrastructure',
    status: 'active',
    billingCycle: 'monthly',
    paymentMethod: 'invoice',
    contractRenews: '2026-12-01',
    accountId: '',
    billingContact: '',
    internalContact: '',
    dataSource: '',
    vendorContact: '',
    supportPhone: '',
    supportEmail: '',
    billingAddress: '',
    website: 'https://cloud.google.com',
    loginUrl: 'https://console.cloud.google.com',
    notes: '',
  },
  {
    id: 'cursor',
    name: 'Cursor',
    category: 'DevTools',
    status: 'active',
    billingCycle: 'monthly',
    paymentMethod: 'credit-card',
    accountId: '',
    billingContact: '',
    internalContact: '',
    dataSource: '',
    vendorContact: '',
    supportPhone: '',
    supportEmail: '',
    billingAddress: '',
    website: 'https://cursor.com',
    loginUrl: 'https://cursor.com/settings',
    notes: '',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    category: 'Advertising',
    status: 'active',
    billingCycle: 'monthly',
    paymentMethod: 'credit-card',
    accountId: '',
    billingContact: '',
    internalContact: '',
    dataSource: '',
    vendorContact: '',
    supportPhone: '',
    supportEmail: '',
    billingAddress: '',
    website: 'https://business.facebook.com',
    loginUrl: 'https://business.facebook.com',
    notes: '',
  },
  {
    id: 'rhonda-bender',
    name: 'Rhonda Bender',
    category: 'Consulting',
    status: 'active',
    billingCycle: 'monthly',
    paymentMethod: 'invoice',
    accountId: '',
    billingContact: '',
    internalContact: '',
    dataSource: '',
    vendorContact: '',
    supportPhone: '',
    supportEmail: '',
    billingAddress: '',
    notes: '',
  },
];
