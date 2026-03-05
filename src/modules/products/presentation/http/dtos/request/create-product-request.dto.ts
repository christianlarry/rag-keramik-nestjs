import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsOptional,
  MinLength,
  MaxLength,
  Min,
  IsUrl,
  IsEnum,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { ApplicationArea, DimensionUnit, FinishingType, Grade } from 'src/modules/products/domain';

/**
 * Size sub-DTO for product tile dimensions
 */
class ProductSizeDto {
  @ApiProperty({
    example: 60,
    description: 'Tile width',
    type: Number,
  })
  @IsNumber({}, { message: 'width must be a number' })
  @Min(0.1, { message: 'width must be greater than 0' })
  width: number;

  @ApiProperty({
    example: 60,
    description: 'Tile height',
    type: Number,
  })
  @IsNumber({}, { message: 'height must be a number' })
  @Min(0.1, { message: 'height must be greater than 0' })
  height: number;

  @ApiProperty({
    example: 0.8,
    description: 'Tile thickness',
    type: Number,
  })
  @IsNumber({}, { message: 'thickness must be a number' })
  @Min(0.1, { message: 'thickness must be greater than 0' })
  thickness: number;

  @ApiProperty({
    example: 'centimeter',
    description: 'Dimension unit for measurements',
    enum: DimensionUnit,
  })
  @IsEnum(DimensionUnit as object, {
    message: 'unit must be a valid dimension unit',
  })
  unit: DimensionUnit;
}

/**
 * Tile attributes sub-DTO
 */
class ProductAttributesDto {
  @ApiPropertyOptional({
    example: 'GRADE_A',
    description: 'Quality grade of the tile',
    enum: Grade,
  })
  @IsOptional()
  @IsEnum(Grade, { message: `grade must be one of: ${Object.values(Grade).join(', ')}` })
  grade?: Grade;

  @ApiPropertyOptional({
    example: 'GLOSSY',
    description: 'Surface finishing type',
    enum: FinishingType,
  })
  @IsOptional()
  @IsEnum(FinishingType, {
    message: `finishing must be one of: ${Object.values(FinishingType).join(', ')}`,
  })
  finishing?: FinishingType;

  @ApiPropertyOptional({
    example: ['FLOOR', 'WALL'],
    description: 'Applicable areas for this tile',
    isArray: true,
    enum: ApplicationArea,
  })
  @IsOptional()
  // Note: Custom validator would be needed for array enum validation
  applicationAreas?: ApplicationArea[];

  @ApiPropertyOptional({
    example: 'R10',
    description: 'Anti-slip rating (R9, R10, R11, R12, R13)',
  })
  @IsOptional()
  @IsString()
  antiSlipRating?: string;

  @ApiPropertyOptional({
    example: '0.5',
    description: 'Water absorption percentage',
  })
  @IsOptional()
  @IsString()
  waterAbsorption?: string;

  @ApiPropertyOptional({
    example: 'Marfil',
    description: 'Color name of the tile',
  })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({
    example: 'Wood Grain',
    description: 'Pattern or motif name',
  })
  @IsOptional()
  @IsString()
  pattern?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether tile is suitable for outdoor use',
  })
  @IsOptional()
  // Note: Boolean validation
  isOutdoor?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether tile is frost resistant',
  })
  @IsOptional()
  // Note: Boolean validation
  frostResistant?: boolean;

  @ApiPropertyOptional({
    example: 3,
    description: 'PEI wear-resistance rating (1-5)',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  peiRating?: number;
}

/**
 * CreateProductRequestDto
 *
 * Input DTO for creating a new product.
 * Validates all incoming data and transforms it into a format
 * suitable for the CreateProductUseCase.
 */
export class CreateProductRequestDto {
  @ApiProperty({
    example: 'CERAMIC-60X60-GLOSS-001',
    description: 'Unique SKU identifier for the product',
    minLength: 3,
    maxLength: 100,
  })
  @IsString({ message: 'sku must be a string' })
  @MinLength(3, { message: 'sku must be at least 3 characters' })
  @MaxLength(100, { message: 'sku must not exceed 100 characters' })
  sku: string;

  @ApiProperty({
    example: 'Keramik Lantai Glossy 60x60 Marfil',
    description: 'Product name',
    minLength: 3,
    maxLength: 500,
  })
  @IsString({ message: 'name must be a string' })
  @MinLength(3, { message: 'name must be at least 3 characters' })
  @MaxLength(500, { message: 'name must not exceed 500 characters' })
  name: string;

  @ApiPropertyOptional({
    example: 'Keramik berkualitas premium dengan permukaan mengkilap sempurna',
    description: 'Detailed product description',
  })
  @IsOptional()
  @IsString({ message: 'description must be a string' })
  description?: string;

  @ApiPropertyOptional({
    example: 'Arwana',
    description: 'Product brand name',
  })
  @IsOptional()
  @IsString({ message: 'brand must be a string' })
  brand?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/products/ceramic-60x60.jpg',
    description: 'Product image URL',
  })
  @IsOptional()
  @IsUrl({}, { message: 'imageUrl must be a valid URL' })
  imageUrl?: string;

  @ApiProperty({
    example: 850000,
    description: 'Price in the specified currency',
    type: Number,
  })
  @IsNumber({}, { message: 'price must be a number' })
  @Min(0, { message: 'price must be greater than or equal to 0' })
  price: number;

  @ApiPropertyOptional({
    example: 'IDR',
    description: 'Currency code (IDR, USD, EUR, SGD, MYR). Defaults to IDR.',
    default: 'IDR',
  })
  @IsOptional()
  @IsString()
  @IsEnum(['IDR', 'USD', 'EUR', 'SGD', 'MYR'], {
    message: 'currency must be one of: IDR, USD, EUR, SGD, MYR',
  })
  currency?: string;

  @ApiProperty({
    example: 6,
    description: 'Number of tiles per box',
    type: Number,
  })
  @IsNumber({}, { message: 'tilePerBox must be a number' })
  @Min(1, { message: 'tilePerBox must be at least 1' })
  tilePerBox: number;

  @ApiProperty({
    description: 'Tile size and dimension information',
    type: ProductSizeDto,
  })
  @IsObject({ message: 'size must be an object' })
  @ValidateNested()
  @Type(() => ProductSizeDto)
  size: ProductSizeDto;

  @ApiPropertyOptional({
    description: 'Tile-specific attributes (grade, finishing, color, etc.)',
    type: ProductAttributesDto,
  })
  @IsOptional()
  @IsObject({ message: 'attributes must be an object' })
  @ValidateNested()
  @Type(() => ProductAttributesDto)
  attributes?: ProductAttributesDto;
}
