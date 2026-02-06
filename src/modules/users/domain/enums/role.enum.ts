export const Role = {
  ADMIN: 'admin',
  STAFF: 'staff',
  CUSTOMER: 'customer',
} as const

export type Role = typeof Role[keyof typeof Role];