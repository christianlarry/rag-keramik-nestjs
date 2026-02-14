import { HttpStatus } from "@nestjs/common";
import { UserErrorCode } from "../../domain/errors/enums/user-error-code.enum";

export const userErrorToHttpStatusMap: Record<UserErrorCode, HttpStatus> = {
  // 400 Bad Request
  USER_INVALID_ID: HttpStatus.BAD_REQUEST,
  USER_INVALID_EMAIL: HttpStatus.BAD_REQUEST,
  USER_INVALID_ROLE: HttpStatus.BAD_REQUEST,
  USER_INVALID_STATUS: HttpStatus.BAD_REQUEST,
  USER_INVALID_NAME: HttpStatus.BAD_REQUEST,
  USER_INVALID_PHONE_NUMBER: HttpStatus.BAD_REQUEST,
  USER_INVALID_ADDRESS: HttpStatus.BAD_REQUEST,
  USER_INVALID_GENDER: HttpStatus.BAD_REQUEST,
  USER_INVALID_AVATAR: HttpStatus.BAD_REQUEST,
  USER_INVALID_DATE_OF_BIRTH: HttpStatus.BAD_REQUEST,
  USER_INVALID_OPERATION: HttpStatus.BAD_REQUEST,
  USER_CANNOT_TRANSITION_STATE: HttpStatus.BAD_REQUEST,

  // 404 Not Found
  USER_NOT_FOUND: HttpStatus.NOT_FOUND,
  USER_ADDRESS_NOT_FOUND: HttpStatus.NOT_FOUND,

  // 409 Conflict
  USER_STATE_CONFLICT: HttpStatus.CONFLICT,
}