import { Inject, Injectable, Logger } from "@nestjs/common";
import { ApplicationArea, FinishingType, Grade, PRODUCT_QUERY_REPOSITORY_TOKEN, ProductQueryListItemResult, type ProductQueryRepository } from "../../domain";
import { ProductListItem } from "../interfaces/product-list-item.interface";

interface BrowsingProductsCommand {
  page?: number;
  limit?: number;
  searchQuery?: string;
  sizeRange?: {
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    minThickness?: number;
    maxThickness?: number;
    unit?: string;
  };
  brand?: string;
  priceRange?: {
    min?: number;
    max?: number;
  };
  attributes?: {
    grade?: Grade;
    finishing?: FinishingType;
    applicationAreas?: ApplicationArea[];
    antiSlipRating?: string;
    waterAbsorption?: string;
    color?: string;
    pattern?: string;
    isOutdoor?: boolean;
    frostResistant?: boolean;
    peiRating?: number;
  };
  sortOptions: {
    sortBy: 'relevance' | 'price' | 'popularity' | 'createdAt' | 'updatedAt' | 'name' | 'brand' | 'size';
    sortOrder: 'asc' | 'desc';
  };
}

interface BrowsingProductsResult {
  products: Array<ProductListItem>;
  pagination: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

@Injectable()
export class BrowsingProductsUseCase {
  // This use case would typically include methods for:
  // - Listing products with pagination
  // - Searching products by name, description, or attributes
  // - Filtering products by category, brand, price range, etc.
  // - Sorting products by relevance, price, popularity, etc.
  // - Searching with elasticsearch for advanced querying capabilities

  private readonly logger = new Logger(BrowsingProductsUseCase.name);

  constructor(
    @Inject(PRODUCT_QUERY_REPOSITORY_TOKEN)
    private readonly productQueryRepository: ProductQueryRepository
  ) { }

  async execute(command: BrowsingProductsCommand): Promise<BrowsingProductsResult> {

    const page = command.page || 1;
    const limit = command.limit || 10;

    if (command.searchQuery) {
      // Implement search logic here, potentially using Elasticsearch for full-text search capabilities
      throw new Error("Search functionality not implemented yet");

      // TODO: Implement search logic
    } else {
      // Implement standard listing logic here, applying filters, pagination, and sorting as needed
      const { products, total: totalItems } = await this.productQueryRepository.findAllProducts({
        page,
        limit,
        size: command.sizeRange ? {
          minWidth: command.sizeRange?.minWidth,
          maxWidth: command.sizeRange?.maxWidth,
          minHeight: command.sizeRange?.minHeight,
          maxHeight: command.sizeRange?.maxHeight,
          minThickness: command.sizeRange?.minThickness,
          maxThickness: command.sizeRange?.maxThickness,
          unit: command.sizeRange?.unit,
        } : undefined,
        brand: command.brand,
        priceRange: command.priceRange,
        attributes: command.attributes,
        sortOptions: {
          sortBy: command.sortOptions.sortBy,
          sortOrder: command.sortOptions.sortOrder,
        }
      });

      const totalPages = Math.ceil(totalItems / limit);
      return {
        products: products.map(product => this.mapToProductListItem(product)),
        pagination: {
          currentPage: page,
          itemsPerPage: limit,
          totalItems,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        }
      };
    }
  }

  mapToProductListItem(product: ProductQueryListItemResult): ProductListItem {
    return {
      id: product.id,
      sku: product.sku,
      name: product.name,
      brand: product.brand,
      imageUrl: product.imageUrl,
      price: product.price,
      currency: product.currency,
      tilePerBox: product.tilePerBox,
      status: product.status,
      size: product.size,
      attributes: {
        grade: product.attributes.grade as Grade,
        finishing: product.attributes.finishing as FinishingType,
        applicationAreas: product.attributes.applicationAreas as ApplicationArea[],
      },
    };
  }
}