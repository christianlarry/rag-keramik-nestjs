import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { CreateProductRequestDto, CreateProductResponseDto } from "./dtos";
import { JwtAuthGuard } from "src/modules/auth/presentation/http/guard/jwt-auth.guard";
import { RolesGuard } from "src/modules/auth/presentation/http/guard/roles.guard";
import { Roles } from "src/modules/auth/presentation/http/decorator/roles.decorator";
import { Throttle } from "@nestjs/throttler";
import { LIMIT, TTL } from "src/common/constants/rate-limit.constants";
import { CreateProductUseCase } from "../../application/use-cases";

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(
    // Use Cases
    private readonly createProductUseCase: CreateProductUseCase
  ) { }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard) // Require authentication and role-based access control
  @Roles('admin') // Only allow admin and staff roles to create products
  @Throttle({ default: { ttl: TTL.ONE_MINUTE, limit: LIMIT.MODERATE } }) // Rate limit to prevent abuse (10 requests per minute)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new product',
    description: 'Endpoint to create a new product with detailed attributes.',
  })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully.',
    type: CreateProductResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request. Validation failed or product with the same SKU already exists.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions.',
  })
  async createProduct(@Body() createProductDto: CreateProductRequestDto): Promise<CreateProductResponseDto> {
    const result = await this.createProductUseCase.execute({
      name: createProductDto.name,
      sku: createProductDto.sku,
      description: createProductDto.description,
      price: createProductDto.price,
      currency: createProductDto.currency,
      brand: createProductDto.brand,
      size: {
        width: createProductDto.size.width,
        height: createProductDto.size.height,
        thickness: createProductDto.size.thickness,
        unit: createProductDto.size.unit,
      },
      tilePerBox: createProductDto.tilePerBox,
      attributes: {
        grade: createProductDto.attributes?.grade,
        finishing: createProductDto.attributes?.finishing,
        applicationAreas: createProductDto.attributes?.applicationAreas,
        antiSlipRating: createProductDto.attributes?.antiSlipRating,
        waterAbsorption: createProductDto.attributes?.waterAbsorption,
        color: createProductDto.attributes?.color,
        pattern: createProductDto.attributes?.pattern,
        isOutdoor: createProductDto.attributes?.isOutdoor,
        frostResistant: createProductDto.attributes?.frostResistant,
        peiRating: createProductDto.attributes?.peiRating,
      },
      imageUrl: createProductDto.imageUrl,
    });

    return {
      id: result.id,
      name: result.name,
      sku: result.sku,
    }
  }
}