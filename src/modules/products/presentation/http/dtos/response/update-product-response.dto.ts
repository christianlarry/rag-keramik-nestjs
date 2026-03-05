import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Grade,
  FinishingType,
  ApplicationArea,
} from 'src/modules/products/domain';

/**
 * ProductSizeResponseDto
 */
class ProductSizeResponseDto {
  @ApiProperty({ example: 60, type: Number })
  width: number;

  @ApiProperty({ example: 60, type: Number })
  height: number;

  @ApiPropertyOptional({ example: 0.8, type: Number, nullable: true })
  thickness: number | null;

  @ApiProperty({ example: 'centimeter' })
  unit: string;
}

/**
 * ProductAttributesResponseDto
 */
class ProductAttributesResponseDto {
  @ApiPropertyOptional({ example: 'GRADE_A', enum: Grade })
  grade?: Grade;

  @ApiPropertyOptional({ example: 'GLOSSY', enum: FinishingType })
  finishing?: FinishingType;

  @ApiPropertyOptional({
    example: ['FLOOR', 'WALL'],
    isArray: true,
    enum: ApplicationArea,
  })
  applicationAreas?: ApplicationArea[];

  @ApiPropertyOptional({ example: 'R10' })
  antiSlipRating?: string;

  @ApiPropertyOptional({ example: '0.5' })
  waterAbsorption?: string;

  @ApiPropertyOptional({ example: 'Marfil' })
  color?: string;

  @ApiPropertyOptional({ example: 'Wood Grain' })
  pattern?: string;

  @ApiPropertyOptional({ example: true })
  isOutdoor?: boolean;

  @ApiPropertyOptional({ example: true })
  frostResistant?: boolean;

  @ApiPropertyOptional({ example: 3, type: Number })
  peiRating?: number;
}

/**
 * ProductDataResponseDto
 * Nested product data within the update response
 */
class ProductDataResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Product ID',
  })
  id: string;

  @ApiProperty({ example: 'Keramik Lantai Glossy 60x60 Marfil' })
  name: string;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiPropertyOptional({ nullable: true })
  brand: string | null;

  @ApiPropertyOptional({ nullable: true })
  imageUrl: string | null;

  @ApiProperty({ example: 850000, type: Number })
  price: number;

  @ApiProperty({ example: 'IDR' })
  currency: string;

  @ApiProperty({ example: 6, type: Number })
  tilePerBox: number;

  @ApiProperty({ example: 'ACTIVE', description: 'Product status' })
  status: string;

  @ApiProperty({ type: ProductSizeResponseDto })
  size: ProductSizeResponseDto;

  @ApiProperty({ type: ProductAttributesResponseDto })
  attributes: ProductAttributesResponseDto;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}

/**
 * UpdateProductResponseDto
 *
 * Response DTO returned after successfully updating a product.
 * Contains tracking of fields updated, the complete updated product data,
 * and timestamps for audit purposes.
 */
export class UpdateProductResponseDto {
  @ApiProperty({
    example: ['name', 'price', 'attributes'],
    description: 'List of fields that were updated in this request',
    isArray: true,
    type: String,
  })
  fieldsUpdated: string[];

  @ApiProperty({
    example: '2026-03-06T10:30:45.123Z',
    description: 'Server timestamp when the update was completed',
  })
  timestamp: Date;

  @ApiProperty({
    description: 'Complete updated product data',
    type: ProductDataResponseDto,
  })
  product: ProductDataResponseDto;

  constructor(partial: Partial<UpdateProductResponseDto>) {
    Object.assign(this, partial);
  }
}
