import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import {
  ApplicationArea,
  DimensionUnit,
  FinishingType,
  Grade,
} from 'src/modules/products/domain';

type ProductSortBy =
  | 'relevance'
  | 'price'
  | 'popularity'
  | 'createdAt'
  | 'updatedAt'
  | 'name'
  | 'brand'
  | 'size';

const PRODUCT_SORT_BY_VALUES: ProductSortBy[] = [
  'relevance',
  'price',
  'popularity',
  'createdAt',
  'updatedAt',
  'name',
  'brand',
  'size',
];

const toOptionalArray = ({ value }: { value: unknown }): string[] | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value
      .flatMap((item) => String(item).split(','))
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const toOptionalBoolean = ({ value }: { value: unknown }): boolean | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') return true;
    if (normalized === 'false' || normalized === '0') return false;
  }

  return value as boolean;
};

export class BrowsingProductsRequestDto {
  @ApiPropertyOptional({ example: 1, description: 'Page number (1-based)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page must be an integer number' })
  @Min(1, { message: 'page must be at least 1' })
  page: number = 1;

  @ApiPropertyOptional({
    example: 20,
    description: 'Number of items per page (max 100)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit must be an integer number' })
  @Min(1, { message: 'limit must be at least 1' })
  @Max(100, { message: 'limit cannot be greater than 100' })
  limit: number = 20;

  @ApiPropertyOptional({
    example: 'marfil glossy',
    description: 'Keyword search query',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: 'createdAt',
    enum: PRODUCT_SORT_BY_VALUES,
    description: 'Sorting field',
  })
  @IsOptional()
  @IsIn(PRODUCT_SORT_BY_VALUES)
  sortBy: ProductSortBy = 'createdAt';

  @ApiPropertyOptional({
    example: 'desc',
    enum: ['asc', 'desc'],
    description: 'Sorting order',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({
    example: 'Arwana',
    description: 'Brand filter (partial match)',
  })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ example: 100000, description: 'Minimum price filter' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'minPrice must be a number' })
  @Min(0, { message: 'minPrice must be greater than or equal to 0' })
  minPrice?: number;

  @ApiPropertyOptional({ example: 1000000, description: 'Maximum price filter' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'maxPrice must be a number' })
  @Min(0, { message: 'maxPrice must be greater than or equal to 0' })
  maxPrice?: number;

  @ApiPropertyOptional({ example: 30, description: 'Minimum tile width' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minWidth?: number;

  @ApiPropertyOptional({ example: 120, description: 'Maximum tile width' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxWidth?: number;

  @ApiPropertyOptional({ example: 30, description: 'Minimum tile height' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minHeight?: number;

  @ApiPropertyOptional({ example: 120, description: 'Maximum tile height' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxHeight?: number;

  @ApiPropertyOptional({ example: 0.6, description: 'Minimum tile thickness' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minThickness?: number;

  @ApiPropertyOptional({ example: 1.2, description: 'Maximum tile thickness' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxThickness?: number;

  @ApiPropertyOptional({
    example: 'centimeter',
    enum: DimensionUnit,
    description: 'Dimension unit for size filters',
  })
  @IsOptional()
  @IsEnum(DimensionUnit as object)
  unit?: string;

  @ApiPropertyOptional({ example: 'GRADE_A', enum: Grade })
  @IsOptional()
  @IsEnum(Grade)
  grade?: Grade;

  @ApiPropertyOptional({ example: 'GLOSSY', enum: FinishingType })
  @IsOptional()
  @IsEnum(FinishingType)
  finishing?: FinishingType;

  @ApiPropertyOptional({
    example: ['FLOOR', 'WALL'],
    enum: ApplicationArea,
    isArray: true,
    description: 'Application areas. Supports CSV and repeated query params.',
  })
  @IsOptional()
  @Transform(toOptionalArray)
  @IsArray()
  @IsEnum(ApplicationArea, { each: true })
  applicationAreas?: ApplicationArea[];

  @ApiPropertyOptional({ example: 'R10' })
  @IsOptional()
  @IsString()
  antiSlipRating?: string;

  @ApiPropertyOptional({ example: '0.5' })
  @IsOptional()
  @IsString()
  waterAbsorption?: string;

  @ApiPropertyOptional({ example: 'Marfil' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: 'Wood Grain' })
  @IsOptional()
  @IsString()
  pattern?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Filter for outdoor suitability',
  })
  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean({ message: 'isOutdoor must be a boolean' })
  isOutdoor?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Filter for frost resistance',
  })
  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean({ message: 'frostResistant must be a boolean' })
  frostResistant?: boolean;

  @ApiPropertyOptional({ example: 4, description: 'PEI rating filter' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'peiRating must be an integer number' })
  @Min(1)
  @Max(5)
  peiRating?: number;
}
