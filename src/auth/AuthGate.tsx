import type { ReactNode } from 'react'
import { AuthGate as SharedAuthGate } from '@haderach/shared-ui'
import type { UserDoc } from '@haderach/shared-ui'
import type { AuthUser } from './AuthUserContext'

interface AuthGateProps {
  children: ReactNode
}

type VendorsAuthExtra = Pick<
  AuthUser,
  'allowedDepartments' | 'allowedVendorIds' | 'deniedVendorIds' | 'isFinanceAdmin'
>

const APP_PATH = '/vendors/'
const APP_ID = 'vendors'

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

function mapUserDocToVendorsExtra(userDoc: UserDoc): VendorsAuthExtra {
  const roles = asStringArray(userDoc.roles)
  return {
    allowedDepartments: asStringArray(userDoc.allowedDepartments),
    allowedVendorIds: asStringArray(userDoc.allowedVendorIds),
    deniedVendorIds: asStringArray(userDoc.deniedVendorIds),
    isFinanceAdmin: roles.includes('finance_admin'),
  }
}

export function AuthGate({ children }: AuthGateProps) {
  return (
    <SharedAuthGate<VendorsAuthExtra>
      appPath={APP_PATH}
      appId={APP_ID}
      mapUserDocToExtra={mapUserDocToVendorsExtra}
    >
      {children}
    </SharedAuthGate>
  )
}
