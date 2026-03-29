import { createContext, useContext } from 'react'
import type { BaseAuthUser } from '@haderach/shared-ui'

export interface AuthUser extends BaseAuthUser {
  allowedDepartments: string[]
  allowedVendorIds: string[]
  deniedVendorIds: string[]
  isFinanceAdmin: boolean
}

export const AuthUserContext = createContext<AuthUser | null>(null)

export function useAuthUser(): AuthUser {
  const ctx = useContext(AuthUserContext)
  if (!ctx) throw new Error('useAuthUser must be used within AuthGate')
  return ctx
}
