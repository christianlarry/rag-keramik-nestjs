import { ApiProperty } from '@nestjs/swagger';

/**
 * CreateProductResponseDto
 *
 * Response DTO returned after successfully creating a product.
 * Contains the ID of the newly created product.
 */
export class CreateProductResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Unique identifier of the newly created product',
  })
  id: string;
  @ApiProperty({
    example: 'CERAMIC-60X60-GLOSS-001',
    description: 'Unique SKU identifier for the product',
  })
  sku: string;
  @ApiProperty({
    example: 'Keramik Lantai Glossy 60x60 Marfil',
    description: 'Product name',
  })
  name: string;

  constructor(partial: Partial<CreateProductResponseDto>) {
    Object.assign(this, partial);
  }
}
