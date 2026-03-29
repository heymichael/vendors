import { agentFetch } from '@haderach/shared-ui'

export {
  APP_CATALOG,
  APP_GRANTING_ROLES,
  ADMIN_CATALOG,
  ADMIN_GRANTING_ROLES,
  hasAppAccess,
  getAccessibleApps,
  getAccessibleAdminApps,
  buildDisplayName,
} from '@haderach/shared-ui'
export type { NavApp as AccessibleApp } from '@haderach/shared-ui'

export const APP_ID = 'vendors'

export interface VendorUserDoc {
  roles: string[]
  firstName: string
  lastName: string
  allowedDepartments: string[]
  allowedVendorIds: string[]
  deniedVendorIds: string[]
}

export async function fetchUserDoc(getIdToken: () => Promise<string>): Promise<VendorUserDoc> {
  const empty: VendorUserDoc = { roles: [], firstName: '', lastName: '', allowedDepartments: [], allowedVendorIds: [], deniedVendorIds: [] }
  try {
    const res = await agentFetch('/me', getIdToken)
    if (!res.ok) return empty
    const data = await res.json()
    return {
      roles: Array.isArray(data.roles) ? data.roles : [],
      firstName: typeof data.firstName === 'string' ? data.firstName : '',
      lastName: typeof data.lastName === 'string' ? data.lastName : '',
      allowedDepartments: Array.isArray(data.allowedDepartments) ? data.allowedDepartments : [],
      allowedVendorIds: Array.isArray(data.allowedVendorIds) ? data.allowedVendorIds : [],
      deniedVendorIds: Array.isArray(data.deniedVendorIds) ? data.deniedVendorIds : [],
    }
  } catch {
    return empty
  }
}
