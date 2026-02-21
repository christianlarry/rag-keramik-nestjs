import { Inventory } from '../entities/inventory.entity';
import { InventoryId } from '../value-objects/inventory-id.vo';

/**
 * InventoryRepository
 *
 * Repository untuk domain operations yang memerlukan full entity rehydration.
 * Digunakan untuk operasi write (create, update, delete) dan read yang memerlukan business logic.
 *
 * Pattern: Domain-Driven Design Repository
 */
export interface InventoryRepository {
  /**
   * Find inventory by ID
   */
  findById(inventoryId: InventoryId): Promise<Inventory | null>;

  /**
   * Find inventory by product ID (1:1 relationship)
   */
  findByProductId(productId: string): Promise<Inventory | null>;

  /**
   * Check if inventory exists for a product
   */
  existsByProductId(productId: string): Promise<boolean>;

  /**
   * Save inventory (create or update)
   */
  save(inventory: Inventory): Promise<void>;

  /**
   * Delete inventory
   */
  delete(inventoryId: InventoryId): Promise<void>;
}

export const INVENTORY_REPOSITORY_TOKEN = 'INVENTORY_REPOSITORY';
