export const PaymentProvider = {
  MIDTRANS: 'MIDTRANS',
} as const;

export type PaymentProvider =
  (typeof PaymentProvider)[keyof typeof PaymentProvider];
