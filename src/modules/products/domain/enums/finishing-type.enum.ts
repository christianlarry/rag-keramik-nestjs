export const FinishingType = {
  GLOSSY: 'GLOSSY',
  MATTE: 'MATTE',
  POLISHED: 'POLISHED',
  RUSTIC: 'RUSTIC',
  TEXTURED: 'TEXTURED',
  SEMI_POLISHED: 'SEMI_POLISHED',
  NATURAL: 'NATURAL',
} as const;

export type FinishingType =
  (typeof FinishingType)[keyof typeof FinishingType];
