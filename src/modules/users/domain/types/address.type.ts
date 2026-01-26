export const AddressLabel = {
  HOME: 'home',
  WORK: 'work',
  OTHER: 'other',
} as const;

export type AddressLabel = typeof AddressLabel[keyof typeof AddressLabel];