import { ApplicationArea, FinishingType, Grade } from "../../domain";
import { ProductItem } from "../interfaces/product-item.interface";

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
  sortBy?: 'relevance' | 'priceAsc' | 'priceDesc' | 'popularity';
}

interface BrowsingProductsResult {
  products: Array<ProductItem>;
  pagination: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export class BrowsingProductsUseCase {
  // This use case would typically include methods for:
  // - Listing products with pagination
  // - Searching products by name, description, or attributes
  // - Filtering products by category, brand, price range, etc.
  // - Sorting products by relevance, price, popularity, etc.
  // - Searching with elasticsearch for advanced querying capabilities

  constructor() { }

  async execute(command: BrowsingProductsCommand): Promise<BrowsingProductsResult> {
    if (command.searchQuery) {
      // Implement search logic here, potentially using Elasticsearch for full-text search capabilities

    } else {
      // Implement standard listing logic here, applying filters, pagination, and sorting as needed

    }
  }
}