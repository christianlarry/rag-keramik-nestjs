import { Injectable } from "@nestjs/common";

interface CreateProductCommand {
  name: string;
  sku: string;
  description?: string;
  // TODO: Add more fields as needed (price, category, etc.)
}

interface CreateProductResult {
  id: string;
  // TODO: Add more fields as needed (createdAt, etc.)
}

@Injectable()
export class CreateProductUseCase {
  constructor() { }

  async execute(command: CreateProductCommand): Promise<CreateProductResult> {
    // TODO: Implement the logic to create a product, e.g.:
  }
}