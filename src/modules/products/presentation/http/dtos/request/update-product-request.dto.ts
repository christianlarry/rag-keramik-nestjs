import { ApiPropertyOptional } from '@nestjs/swagger';
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
import {
  Grade,
  FinishingType,
  ApplicationArea,
  DimensionUnit,
} from 'src/modules/products/domain';

/**
 * Size sub-DTO for update operations (all fields optional)
 */
class UpdateProductSizeDto {
  @ApiPropertyOptional({
    example: 60,
    description: 'Tile width',
    type: Number,
  })
  @IsOptional()
  @IsNumber({}, { message: 'width must be a number' })
  @Min(0.1, { message: 'width must be greater than 0' })
  width?: number;

  @ApiPropertyOptional({
    example: 60,
    description: 'Tile height',
    type: Number,
  })
  @IsOptional()
  @IsNumber({}, { message: 'height must be a number' })
  @Min(0.1, { message: 'height must be greater than 0' })
  height?: number;

  @ApiPropertyOptional({
    example: 0.8,
    description: 'Tile thickness',
    type: Number,
  })
  @IsOptional()
  @IsNumber({}, { message: 'thickness must be a number' })
  @Min(0.1, { message: 'thickness must be greater than 0' })
  thickness?: number;

  @ApiPropertyOptional({
    example: 'centimeter',
    description: 'Dimension unit for measurements',
    enum: DimensionUnit,
  })
  @IsOptional()
  @IsEnum(DimensionUnit, {
    message: 'unit must be a valid dimension unit',
  })
  unit?: string;
}

/**
 * Tile attributes sub-DTO for update operations (all fields optional)
 */
class UpdateProductAttributesDto {
  @ApiPropertyOptional({
    example: 'GRADE_A',
    description: 'Quality grade of the tile',
    enum: Grade,
  })
  @IsOptional()
  @IsEnum(Grade, { message: 'grade must be a valid grade' })
  grade?: Grade;

  @ApiPropertyOptional({
    example: 'GLOSSY',
    description: 'Surface finishing type',
    enum: FinishingType,
  })
  @IsOptional()
  @IsEnum(FinishingType, {
    message: 'finishing must be a valid finishing type',
  })
  finishing?: FinishingType;

  @ApiPropertyOptional({
    example: ['FLOOR', 'WALL'],
    description: 'Applicable areas for this tile',
    isArray: true,
    enum: ApplicationArea,
  })
  @IsOptional()
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
  isOutdoor?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether tile is frost resistant',
  })
  @IsOptional()
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
 * UpdateProductRequestDto
 *
 * Input DTO for updating an existing product.
 * All fields are optional to support partial updates.
 */
export class UpdateProductRequestDto {
  @ApiPropertyOptional({
    example: 'Keramik Lantai Glossy 60x60 Marfil',
    description: 'Product name',
    minLength: 3,
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'name must be a string' })
  @MinLength(3, { message: 'name must be at least 3 characters' })
  @MaxLength(500, { message: 'name must not exceed 500 characters' })
  name?: string;

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

  @ApiPropertyOptional({
    example: 850000,
    description: 'Price in the specified currency',
    type: Number,
  })
  @IsOptional()
  @IsNumber({}, { message: 'price must be a number' })
  @Min(0, { message: 'price must be greater than or equal to 0' })
  price?: number;

  @ApiPropertyOptional({
    example: 'IDR',
    description: 'Currency code (IDR, USD, EUR, SGD, MYR)',
  })
  @IsOptional()
  @IsString()
  @IsEnum(['IDR', 'USD', 'EUR', 'SGD', 'MYR'], {
    message: 'currency must be one of: IDR, USD, EUR, SGD, MYR',
  })
  currency?: string;

  @ApiPropertyOptional({
    example: 6,
    description: 'Number of tiles per box',
    type: Number,
  })
  @IsOptional()
  @IsNumber({}, { message: 'tilePerBox must be a number' })
  @Min(1, { message: 'tilePerBox must be at least 1' })
  tilePerBox?: number;

  @ApiPropertyOptional({
    description: 'Tile size and dimension information (partial update)',
    type: UpdateProductSizeDto,
  })
  @IsOptional()
  @IsObject({ message: 'size must be an object' })
  @ValidateNested()
  @Type(() => UpdateProductSizeDto)
  size?: UpdateProductSizeDto;

  @ApiPropertyOptional({
    description: 'Tile-specific attributes (partial update)',
    type: UpdateProductAttributesDto,
  })
  @IsOptional()
  @IsObject({ message: 'attributes must be an object' })
  @ValidateNested()
  @Type(() => UpdateProductAttributesDto)
  attributes?: UpdateProductAttributesDto;
}
