export const DimensionUnit = {
  MILLIMETER: 'millimeter',
  CENTIMETER: 'centimeter',
  METER: 'meter',
  INCH: 'inch',
  FOOT: 'foot',
} as const;

export type DimensionUnit = (typeof DimensionUnit)[keyof typeof DimensionUnit];