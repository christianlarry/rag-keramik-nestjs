import { Inject } from "@nestjs/common";
import { PRODUCT_REPOSITORY_TOKEN, ProductId, ProductNotFoundError, type ProductRepository } from "../../domain";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { ProductDeletedAppEvent } from "../events/product-deleted-app.event";

interface DeleteProductCommand {
  productId: string;
  deletedBy: string;
}

interface DeleteProductResult {
  success: boolean;
  deletedProductId: string;
  timestamp: Date;
}

export class DeleteProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY_TOKEN)
    private readonly productRepository: ProductRepository,
    private readonly eventEmitter: EventEmitter2,
  ) { }

  async execute(command: DeleteProductCommand): Promise<DeleteProductResult> {
    const productId: ProductId = ProductId.fromString(command.productId);

    const product = await this.productRepository.findById(productId);

    if (!product) {
      throw new ProductNotFoundError(productId.getValue());
    }

    await this.productRepository.delete(product.id);

    this.eventEmitter.emit(
      ProductDeletedAppEvent.EventName,
      new ProductDeletedAppEvent({
        deletedBy: command.deletedBy,
        productId: product.id.getValue(),
      })
    );

    return {
      success: true,
      deletedProductId: product.id.getValue(),
      timestamp: new Date()
    };
  }
}