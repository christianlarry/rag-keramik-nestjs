import { UserResponseDto } from "src/modules/users/dto/response/user-response.dto";

export class AuthLoginResponseDto {
  accessToken: string;
  refreshToken: string;
  user: UserResponseDto; // Replace 'any' with the actual UserResponseDto type when imported

  constructor(data: AuthLoginResponseDto) {
    Object.assign(this, data);
  }
}