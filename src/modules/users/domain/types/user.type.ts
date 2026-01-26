export const UserRole = {
  ADMIN: 'admin',
  USER: 'user',
  MODERATOR: 'moderator',
} as const;
export type UserRole = typeof UserRole[keyof typeof UserRole];

export const UserStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  DELETED: 'deleted',
} as const;
export type UserStatus = typeof UserStatus[keyof typeof UserStatus];

export const UserGender = {
  MALE: 'male',
  FEMALE: 'female'
} as const;
export type UserGender = typeof UserGender[keyof typeof UserGender];

export const UserProvider = {
  GOOGLE: 'google',
  FACEBOOK: 'facebook',
  GITHUB: 'github',
} as const;
export type UserProvider = typeof UserProvider[keyof typeof UserProvider];