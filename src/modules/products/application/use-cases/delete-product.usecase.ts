import { Inject } from "@nestjs/common";
import { PRODUCT_REPOSITORY_TOKEN, ProductId, ProductNotFoundError, type ProductRepository } from "../../domain";

interface DeleteProductCommand {
  productId: string;
}

interface DeleteProductResult {
  success: boolean;
  deletedProductId: string;
  timestamp: Date;
}

export class DeleteProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY_TOKEN)
    private readonly productRepository: ProductRepository
  ) { }

  async execute(command: DeleteProductCommand): Promise<DeleteProductResult> {
    const productId: ProductId = ProductId.fromString(command.productId);

    const product = await this.productRepository.findById(productId);

    if (!product) {
      throw new ProductNotFoundError(productId.getValue());
    }

    await this.productRepository.delete(product.id);

    return {
      success: true,
      deletedProductId: product.id.getValue(),
      timestamp: new Date()
    };
  }
}