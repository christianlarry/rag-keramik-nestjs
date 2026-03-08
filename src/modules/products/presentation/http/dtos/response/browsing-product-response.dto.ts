import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  ApplicationArea,
  FinishingType,
  Grade,
} from 'src/modules/products/domain';

class BrowsingProductSizeResponseDto {
  @ApiProperty({ example: 60, type: Number })
  width: number;

  @ApiProperty({ example: 60, type: Number })
  height: number;

  @ApiPropertyOptional({ example: 0.8, nullable: true, type: Number })
  thickness: number | null;

  @ApiProperty({ example: 'centimeter' })
  unit: string;
}

class BrowsingProductAttributesResponseDto {
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

class BrowsingProductItemResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'CERAMIC-60X60-GLOSS-001' })
  sku: string;

  @ApiProperty({ example: 'Keramik Lantai Glossy 60x60 Marfil' })
  name: string;

  @ApiPropertyOptional({ nullable: true, example: 'Keramik lantai dengan finishing glossy, cocok untuk area dalam ruangan.' })
  description: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'Keramik Marfil' })
  brand: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'https://example.com/image.jpg' })
  imageUrl: string | null;

  @ApiProperty({ example: 850000, type: Number })
  price: number;

  @ApiProperty({ example: 'IDR' })
  currency: string;

  @ApiProperty({ example: 6, type: Number })
  tilePerBox: number;

  @ApiProperty({ example: 'ACTIVE' })
  @Expose({ groups: ['admin'] })
  status: string;

  @ApiProperty({ type: BrowsingProductSizeResponseDto })
  size: BrowsingProductSizeResponseDto;

  @ApiProperty({ type: BrowsingProductAttributesResponseDto })
  attributes: BrowsingProductAttributesResponseDto;

  @ApiProperty({ description: 'Last update timestamp' })
  @Expose({ groups: ['admin'] })
  updatedAt: Date;

  @ApiProperty({ description: 'Creation timestamp' })
  @Expose({ groups: ['admin'] })
  createdAt: Date;
}

class BrowsingProductPaginationResponseDto {
  @ApiProperty({ example: 1, type: Number })
  currentPage: number;

  @ApiProperty({ example: 20, type: Number })
  itemsPerPage: number;

  @ApiProperty({ example: 120, type: Number })
  totalItems: number;

  @ApiProperty({ example: 6, type: Number })
  totalPages: number;

  @ApiProperty({ example: true })
  hasNextPage: boolean;

  @ApiProperty({ example: false })
  hasPreviousPage: boolean;
}

export class BrowsingProductResponseDto {
  @ApiProperty({ type: BrowsingProductItemResponseDto, isArray: true })
  @Type(() => BrowsingProductItemResponseDto)
  products: BrowsingProductItemResponseDto[];

  @ApiProperty({ type: BrowsingProductPaginationResponseDto })
  @Type(() => BrowsingProductPaginationResponseDto)
  pagination: BrowsingProductPaginationResponseDto;

  constructor(partial: Partial<BrowsingProductResponseDto>) {
    Object.assign(this, partial);
  }
}