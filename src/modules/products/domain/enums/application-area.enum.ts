export const ApplicationArea = {
  FLOOR: 'FLOOR',
  WALL: 'WALL',
  OUTDOOR: 'OUTDOOR',
  BATHROOM: 'BATHROOM',
  KITCHEN: 'KITCHEN',
  COMMERCIAL: 'COMMERCIAL',
  RESIDENTIAL: 'RESIDENTIAL',
  POOL: 'POOL',
  FACADE: 'FACADE',
} as const;

export type ApplicationArea =
  (typeof ApplicationArea)[keyof typeof ApplicationArea];
