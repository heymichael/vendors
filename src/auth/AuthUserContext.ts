import { useAuthUser as useSharedAuthUser } from '@haderach/shared-ui'
import type { BaseAuthUser } from '@haderach/shared-ui'

export interface AuthUser extends BaseAuthUser {
  allowedDepartments: string[]
  allowedVendorIds: string[]
  deniedVendorIds: string[]
  isFinanceAdmin: boolean
}

export function useAuthUser(): AuthUser {
  return useSharedAuthUser<AuthUser>()
}
