export const AddressLabel = {
  HOME: 'home',
  OFFICE: 'office',
  OTHER: 'other',
} as const;

export type AddressLabel = typeof AddressLabel[keyof typeof AddressLabel];
