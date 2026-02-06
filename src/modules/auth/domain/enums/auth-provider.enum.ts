export const AuthProvider = {
  LOCAL: 'local',
  GOOGLE: 'google',
  FACEBOOK: 'facebook',
} as const;

export type AuthProvider = typeof AuthProvider[keyof typeof AuthProvider];