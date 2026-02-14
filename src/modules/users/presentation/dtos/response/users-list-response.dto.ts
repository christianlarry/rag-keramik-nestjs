import { ApiProperty } from '@nestjs/swagger';
import { UserProfileResponseDto } from './user-profile-response.dto';

class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  currentPage: number;

  @ApiProperty({ example: 10 })
  itemsPerPage: number;

  @ApiProperty({ example: 100 })
  totalItems: number;

  @ApiProperty({ example: 10 })
  totalPages: number;

  @ApiProperty({ example: true })
  hasNextPage: boolean;

  @ApiProperty({ example: false })
  hasPreviousPage: boolean;
}

export class UsersListResponseDto {
  @ApiProperty({ type: [UserProfileResponseDto] })
  data: UserProfileResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;

  constructor(partial: Partial<UsersListResponseDto>) {
    Object.assign(this, partial);
  }
}
