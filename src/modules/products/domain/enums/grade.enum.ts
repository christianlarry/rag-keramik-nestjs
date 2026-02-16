export const Grade = {
  PREMIUM: 'PREMIUM',
  GRADE_A: 'GRADE_A',
  GRADE_B: 'GRADE_B',
  GRADE_C: 'GRADE_C',
} as const;

export type Grade = (typeof Grade)[keyof typeof Grade];
