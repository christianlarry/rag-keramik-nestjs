import { Inject } from "@nestjs/common";
import { PRODUCT_QUERY_REPOSITORY_TOKEN, ProductQueryDetailResult, type ProductQueryRepository } from "../../domain";
import { ProductItem } from "../interfaces/product-item.interface";
import { ProductNotFoundError } from "../errors";

interface GetProductDetailCommand {
  productId: string,
}

interface GetProductDetailResult {
  product: ProductItem;
}

export class GetProductDetailUseCase {

  constructor(
    @Inject(PRODUCT_QUERY_REPOSITORY_TOKEN)
    private readonly productQueryRepository: ProductQueryRepository,
  ) { }

  async execute(command: GetProductDetailCommand): Promise<GetProductDetailResult> {
    const { productId } = command

    const product = await this.productQueryRepository.getProductDetailById(productId)

    if (!product) throw new ProductNotFoundError(productId)

    return {
      product: this.mapToProductItem(product)
    }
  }

  private mapToProductItem(product: ProductQueryDetailResult): ProductItem {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      attributes: product.attributes,
      brand: product.brand,
      imageUrl: product.imageUrl,
      currency: product.currency,
      size: product.size,
      sku: product.sku,
      status: product.status,
      tilePerBox: product.tilePerBox,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    }
  }
}