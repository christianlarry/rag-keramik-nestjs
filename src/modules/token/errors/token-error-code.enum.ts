export const TokenErrorCode = {
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
} as const

export type TokenErrorCode = (typeof TokenErrorCode)[keyof typeof TokenErrorCode];