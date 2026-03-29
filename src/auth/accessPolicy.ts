import { agentFetch } from '@haderach/shared-ui'

export {
  APP_CATALOG,
  APP_GRANTING_ROLES,
  ADMIN_CATALOG,
  ADMIN_GRANTING_ROLES,
  hasAppAccess,
  getAccessibleApps,
  getAccessibleAdminApps,
} from '@haderach/shared-ui'
export type { NavApp as AccessibleApp } from '@haderach/shared-ui'

export const APP_ID = 'vendors'

export interface UserDoc {
  roles: string[]
  firstName: string
  lastName: string
  allowedDepartments: string[]
  allowedVendorIds: string[]
  deniedVendorIds: string[]
}

export async function fetchUserDoc(getIdToken: () => Promise<string>): Promise<UserDoc> {
  const empty: UserDoc = { roles: [], firstName: '', lastName: '', allowedDepartments: [], allowedVendorIds: [], deniedVendorIds: [] }
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

export function buildDisplayName(firstName: string, lastName: string): string | undefined {
  const full = [firstName, lastName].filter(Boolean).join(' ')
  return full || undefined
}
