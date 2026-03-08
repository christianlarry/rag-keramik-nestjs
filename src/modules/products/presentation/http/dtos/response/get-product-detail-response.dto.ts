import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  ApplicationArea,
  FinishingType,
  Grade,
} from 'src/modules/products/domain';

class ProductDetailSizeResponseDto {
  @ApiProperty({ example: 60, type: Number })
  width: number;

  @ApiProperty({ example: 60, type: Number })
  height: number;

  @ApiPropertyOptional({ example: 0.8, nullable: true, type: Number })
  thickness: number | null;

  @ApiProperty({ example: 'centimeter' })
  unit: string;
}

class ProductDetailAttributesResponseDto {
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

  @ApiPropertyOptional({
    example: 'R10',
    description: 'Anti-slip rating',
  })
  antiSlipRating?: string;

  @ApiPropertyOptional({
    example: '0.5%',
    description: 'Water absorption percentage',
  })
  waterAbsorption?: string;

  @ApiPropertyOptional({
    example: 'Marfil White',
    description: 'Product color',
  })
  color?: string;

  @ApiPropertyOptional({
    example: 'Marble',
    description: 'Product pattern type',
  })
  pattern?: string;

  @ApiPropertyOptional({
    type: Boolean,
    example: true,
    description: 'Whether product is suitable for outdoor use',
  })
  isOutdoor?: boolean;

  @ApiPropertyOptional({
    type: Boolean,
    example: true,
    description: 'Whether product is frost resistant',
  })
  frostResistant?: boolean;

  @ApiPropertyOptional({
    type: Number,
    example: 4,
    description: 'PEI durability rating',
  })
  peiRating?: number;
}

/**
 * GetProductDetailResponseDto
 *
 * Response DTO for retrieving detailed information about a single product.
 * Contains all product details with proper field visibility based on user roles.
 */
export class GetProductDetailResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Unique identifier of the product',
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

  @ApiPropertyOptional({
    nullable: true,
    example: 'Premium ceramic floor tiles with glossy finish, suitable for residential and commercial applications.',
    description: 'Detailed product description',
  })
  description: string | null;

  @ApiPropertyOptional({
    nullable: true,
    example: 'Premium Ceramics',
    description: 'Product brand name',
  })
  brand: string | null;

  @ApiPropertyOptional({
    nullable: true,
    example: 'https://example.com/images/product-60x60-marfil.jpg',
    description: 'Product image URL',
  })
  imageUrl: string | null;

  @ApiProperty({
    example: 850000,
    type: Number,
    description: 'Product price',
  })
  price: number;

  @ApiProperty({
    example: 'IDR',
    description: 'Currency code for the price',
  })
  currency: string;

  @ApiProperty({
    example: 6,
    type: Number,
    description: 'Number of tiles per box',
  })
  tilePerBox: number;

  @ApiProperty({
    example: 'ACTIVE',
    description: 'Current product status',
  })
  @Expose({ groups: ['admin'] })
  status: string;

  @ApiProperty({
    type: ProductDetailSizeResponseDto,
    description: 'Product dimensions',
  })
  @Type(() => ProductDetailSizeResponseDto)
  size: ProductDetailSizeResponseDto;

  @ApiProperty({
    type: ProductDetailAttributesResponseDto,
    description: 'Product attributes and specifications',
  })
  @Type(() => ProductDetailAttributesResponseDto)
  attributes: ProductDetailAttributesResponseDto;

  @ApiProperty({
    example: '2024-01-15T10:30:00Z',
    type: String,
    description: 'Timestamp when the product was created',
  })
  @Expose({ groups: ['admin'] })
  createdAt: Date;

  @ApiProperty({
    example: '2024-06-01T14:45:00Z',
    type: String,
    description: 'Timestamp when the product was last updated',
  })
  @Expose({ groups: ['admin'] })
  updatedAt: Date;

  constructor(partial: Partial<GetProductDetailResponseDto>) {
    Object.assign(this, partial);
  }
}
