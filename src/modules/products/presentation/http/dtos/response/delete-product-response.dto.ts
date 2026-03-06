import { ApiProperty } from "@nestjs/swagger";

export class DeleteProductResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Unique identifier of the deleted product',
  })
  deletedProductId: string;
  @ApiProperty({
    example: true,
    description: 'Indicates whether the deletion was successful',
  })
  success: boolean;
  @ApiProperty({
    example: '2024-06-01T12:00:00Z',
    description: 'Timestamp of when the product was deleted',
  })
  timestamp: Date;

  constructor(partial: Partial<DeleteProductResponseDto>) {
    Object.assign(this, partial);
  }
}