export const UserErrorCode = {
  INVALID_USER_ID: 'USER_INVALID_ID',
  INVALID_EMAIL: 'USER_INVALID_EMAIL',
  INVALID_ROLE: 'USER_INVALID_ROLE',
  INVALID_STATUS: 'USER_INVALID_STATUS',
  INVALID_NAME: 'USER_INVALID_NAME',
  INVALID_PHONE_NUMBER: 'USER_INVALID_PHONE_NUMBER',
  INVALID_ADDRESS: 'USER_INVALID_ADDRESS',
  INVALID_GENDER: 'USER_INVALID_GENDER',
  INVALID_AVATAR: 'USER_INVALID_AVATAR',
  INVALID_DATE_OF_BIRTH: 'USER_INVALID_DATE_OF_BIRTH',
  STATE_CONFLICT: 'USER_STATE_CONFLICT', // e.g., trying to activate an already active user, use in User.validate()
  INVALID_OPERATION: 'USER_INVALID_OPERATION', // e.g., trying to modify a deleted user
  CANNOT_TRANSITION_STATE: 'USER_CANNOT_TRANSITION_STATE', // e.g., trying to activate a suspended user without proper flow
  ADDRESS_NOT_FOUND: 'USER_ADDRESS_NOT_FOUND', // e.g., trying to update/remove an address that doesn't exist
}

export type UserErrorCode = typeof UserErrorCode[keyof typeof UserErrorCode];