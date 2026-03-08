import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BrowsingProductsUseCase, GetProductDetailUseCase } from '../../application/use-cases';
import { Throttle } from '@nestjs/throttler';
import { LIMIT, TTL } from 'src/common/constants/rate-limit.constants';
import {
  BrowsingProductResponseDto,
  BrowsingProductsRequestDto,
  GetProductDetailResponseDto,
} from './dtos';

@ApiTags('Products')
@Controller('products')
export class ProductsReadController {
  constructor(
    private readonly browsingProductsUseCase: BrowsingProductsUseCase,
    private readonly getProductDetailUseCase: GetProductDetailUseCase,
  ) { }

  private validateRange(
    min: number | undefined,
    max: number | undefined,
    field: string,
  ): void {
    if (min !== undefined && max !== undefined && min > max) {
      throw new BadRequestException(
        `${field} minimum cannot be greater than maximum`,
      );
    }
  }

  @Get()
  @Throttle({ default: { ttl: TTL.ONE_MINUTE, limit: LIMIT.LENIENT } }) // Rate limit to prevent abuse (20 requests per minute)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Browse products',
    description: 'Endpoint to browse products with pagination, filtering, and sorting capabilities.',
  })
  @ApiResponse({
    status: 200,
    description: 'Products retrieved successfully.',
    type: BrowsingProductResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request. Validation failed for one or more query params.',
  })
  async browseProducts(
    @Query() query: BrowsingProductsRequestDto,
  ): Promise<BrowsingProductResponseDto> {

    this.validateRange(query.minPrice, query.maxPrice, 'price');
    this.validateRange(query.minWidth, query.maxWidth, 'width');
    this.validateRange(query.minHeight, query.maxHeight, 'height');
    this.validateRange(query.minThickness, query.maxThickness, 'thickness');

    const result = await this.browsingProductsUseCase.execute({
      page: query.page,
      limit: query.limit,
      searchQuery: query.search,
      sizeRange:
        query.minWidth !== undefined ||
          query.maxWidth !== undefined ||
          query.minHeight !== undefined ||
          query.maxHeight !== undefined ||
          query.minThickness !== undefined ||
          query.maxThickness !== undefined ||
          query.unit !== undefined
          ? {
            minWidth: query.minWidth,
            maxWidth: query.maxWidth,
            minHeight: query.minHeight,
            maxHeight: query.maxHeight,
            minThickness: query.minThickness,
            maxThickness: query.maxThickness,
            unit: query.unit,
          }
          : undefined,
      brand: query.brand,
      priceRange:
        query.minPrice !== undefined || query.maxPrice !== undefined
          ? {
            min: query.minPrice,
            max: query.maxPrice,
          }
          : undefined,
      attributes:
        query.grade !== undefined ||
          query.finishing !== undefined ||
          query.applicationAreas !== undefined ||
          query.antiSlipRating !== undefined ||
          query.waterAbsorption !== undefined ||
          query.color !== undefined ||
          query.pattern !== undefined ||
          query.isOutdoor !== undefined ||
          query.frostResistant !== undefined ||
          query.peiRating !== undefined
          ? {
            grade: query.grade,
            finishing: query.finishing,
            applicationAreas: query.applicationAreas,
            antiSlipRating: query.antiSlipRating,
            waterAbsorption: query.waterAbsorption,
            color: query.color,
            pattern: query.pattern,
            isOutdoor: query.isOutdoor,
            frostResistant: query.frostResistant,
            peiRating: query.peiRating,
          }
          : undefined,
      sortOptions: {
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      },
    });

    return new BrowsingProductResponseDto(result);
  }

  @Get(':id')
  @Throttle({ default: { ttl: TTL.ONE_MINUTE, limit: LIMIT.LENIENT } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get product detail',
    description: 'Endpoint to retrieve detailed information about a specific product by its ID.',
  })
  @ApiResponse({
    status: 200,
    description: 'Product details retrieved successfully.',
    type: GetProductDetailResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found.',
  })
  async getProductDetail(
    @Param('id') productId: string,
  ): Promise<GetProductDetailResponseDto> {
    const result = await this.getProductDetailUseCase.execute({
      productId,
    });

    return new GetProductDetailResponseDto(result.product);
  }
}