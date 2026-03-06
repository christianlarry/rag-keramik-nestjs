import { Body, Controller, Delete, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { CreateProductRequestDto, CreateProductResponseDto, DeleteProductResponseDto, UpdateProductRequestDto, UpdateProductResponseDto } from "./dtos";
import { JwtAuthGuard } from "src/modules/auth/presentation/http/guard/jwt-auth.guard";
import { RolesGuard } from "src/modules/auth/presentation/http/guard/roles.guard";
import { Roles } from "src/modules/auth/presentation/http/decorator/roles.decorator";
import { Throttle } from "@nestjs/throttler";
import { LIMIT, TTL } from "src/common/constants/rate-limit.constants";
import { CreateProductUseCase, DeleteProductUseCase, UpdateProductUseCase } from "../../application/use-cases";

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(
    // Use Cases
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly updateProductUseCase: UpdateProductUseCase,
    private readonly deleteProductUseCase: DeleteProductUseCase,
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

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard) // Require authentication and role-based access control
  @Roles('admin') // Only allow admin and staff roles to create products
  @Throttle({ default: { ttl: TTL.ONE_MINUTE, limit: LIMIT.MODERATE } }) // Rate limit to prevent abuse (10 requests per minute)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update an existing product',
    description: 'Endpoint to update an existing product. All fields are optional, only provide the ones you want to update.',
  })
  @ApiResponse({
    status: 200,
    description: 'Product updated successfully.',
    type: UpdateProductResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request. Validation failed.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions.',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - product with the specified ID does not exist.',
  })
  async updateProduct(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductRequestDto
  ): Promise<UpdateProductResponseDto> {
    const result = await this.updateProductUseCase.execute({
      productId: id,
      name: updateProductDto.name,
      description: updateProductDto.description,
      price: updateProductDto.price,
      currency: updateProductDto.currency,
      brand: updateProductDto.brand,
      size: updateProductDto.size ? {
        width: updateProductDto.size.width,
        height: updateProductDto.size.height,
        thickness: updateProductDto.size.thickness,
        unit: updateProductDto.size.unit,
      } : undefined,
      tilePerBox: updateProductDto.tilePerBox,
      attributes: updateProductDto.attributes ? {
        grade: updateProductDto.attributes.grade,
        finishing: updateProductDto.attributes.finishing,
        applicationAreas: updateProductDto.attributes.applicationAreas,
        antiSlipRating: updateProductDto.attributes.antiSlipRating,
        waterAbsorption: updateProductDto.attributes.waterAbsorption,
        color: updateProductDto.attributes.color,
        pattern: updateProductDto.attributes.pattern,
        isOutdoor: updateProductDto.attributes.isOutdoor,
        frostResistant: updateProductDto.attributes.frostResistant,
        peiRating: updateProductDto.attributes.peiRating,
      } : undefined,
      imageUrl: updateProductDto.imageUrl,
    });

    return {
      fieldsUpdated: result.fieldsUpdated,
      timestamp: result.timestamp,
      product: result.product,
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard) // Require authentication and role-based access control
  @Roles('admin') // Only allow admin and staff roles to delete products
  @Throttle({ default: { ttl: TTL.ONE_MINUTE, limit: LIMIT.MODERATE } }) // Rate limit to prevent abuse (10 requests per minute)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a product',
    description: 'Endpoint to delete a product by its ID.',
  })
  @ApiResponse({
    status: 200,
    description: 'Product deleted successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request. Validation failed.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions.',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - product with the specified ID does not exist.',
  })
  async deleteProduct(@Param('id') id: string): Promise<DeleteProductResponseDto> {
    const result = await this.deleteProductUseCase.execute({
      productId: id,
    });

    return new DeleteProductResponseDto({
      deletedProductId: result.deletedProductId,
      success: result.success,
      timestamp: result.timestamp,
    });
  }
}