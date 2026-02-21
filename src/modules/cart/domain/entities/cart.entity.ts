import { AggregateRoot } from 'src/core/domain/aggregate-root.base';
import { CartId } from '../value-objects/cart-id.vo';
import { Quantity } from '../value-objects/quantity.vo';
import { CartItem } from './cart-item.entity';
import {
  CartItemNotFoundError,
  DuplicateCartItemError,
  CartIsEmptyError,
  CartStateConflictError,
} from '../errors';
import {
  CartCreatedEvent,
  CartItemAddedEvent,
  CartItemRemovedEvent,
  CartItemQuantityUpdatedEvent,
  CartClearedEvent,
} from '../events';

interface CartProps {
  userId: string;
  items: CartItem[];
  readonly createdAt: Date;
  updatedAt: Date;
}

interface CreateCartParams {
  userId: string;
}

/**
 * Cart — Aggregate Root
 *
 * Represents a shopping cart belonging to a single user.
 * Each user can have only one active cart (1:1 relationship).
 * All CartItem operations must go through the Cart aggregate.
 */
export class Cart extends AggregateRoot {
  private readonly _id: CartId;
  private props: CartProps;

  private constructor(id: CartId, props: CartProps) {
    super();
    this._id = id;
    this.props = props;
    this.validate();
  }

  private validate(): void {
    if (!this.props.userId || this.props.userId.trim().length === 0) {
      throw new CartStateConflictError('Cart must have a valid user ID');
    }

    if (!(this.props.createdAt instanceof Date) || isNaN(this.props.createdAt.getTime())) {
      throw new CartStateConflictError('Cart created date is invalid');
    }

    if (!(this.props.updatedAt instanceof Date) || isNaN(this.props.updatedAt.getTime())) {
      throw new CartStateConflictError('Cart updated date is invalid');
    }
  }

  // ============================================
  // Factory Methods
  // ============================================

  /**
   * Create a new empty cart for a user
   */
  public static create(params: CreateCartParams): Cart {
    const cartId = CartId.create();

    const cart = new Cart(cartId, {
      userId: params.userId,
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    cart.addDomainEvent(
      new CartCreatedEvent({
        cartId: cartId.getValue(),
        userId: params.userId,
      }),
    );

    return cart;
  }

  /**
   * Reconstruct cart from persistence
   */
  public static reconstruct(id: string, props: CartProps): Cart {
    return new Cart(CartId.fromString(id), props);
  }

  // ============================================
  // Query Methods
  // ============================================

  public isEmpty(): boolean {
    return this.props.items.length === 0;
  }

  public getItemCount(): number {
    return this.props.items.length;
  }

  public getTotalQuantity(): number {
    return this.props.items.reduce(
      (total, item) => total + item.quantity.getValue(),
      0,
    );
  }

  public hasProduct(productId: string): boolean {
    return this.props.items.some((item) => item.isForProduct(productId));
  }

  public findItemByProductId(productId: string): CartItem | undefined {
    return this.props.items.find((item) => item.isForProduct(productId));
  }

  public findItemById(cartItemId: string): CartItem | undefined {
    return this.props.items.find(
      (item) => item.id.getValue() === cartItemId,
    );
  }

  // ============================================
  // Command Methods
  // ============================================

  /**
   * Add a product to the cart.
   * If the product already exists, increases the quantity instead.
   */
  public addItem(productId: string, quantity: number): void {
    const existingItem = this.findItemByProductId(productId);

    if (existingItem) {
      const oldQuantity = existingItem.quantity.getValue();
      existingItem.increaseQuantity(quantity);
      this.applyChange();

      this.addDomainEvent(
        new CartItemQuantityUpdatedEvent({
          cartId: this._id.getValue(),
          cartItemId: existingItem.id.getValue(),
          productId,
          oldQuantity,
          newQuantity: existingItem.quantity.getValue(),
        }),
      );
      return;
    }

    const cartItem = CartItem.create({ productId, quantity });
    this.props.items.push(cartItem);
    this.applyChange();

    this.addDomainEvent(
      new CartItemAddedEvent({
        cartId: this._id.getValue(),
        cartItemId: cartItem.id.getValue(),
        productId,
        quantity,
      }),
    );
  }

  /**
   * Remove an item from the cart by cart item ID
   */
  public removeItem(cartItemId: string): void {
    const index = this.props.items.findIndex(
      (item) => item.id.getValue() === cartItemId,
    );

    if (index === -1) {
      throw new CartItemNotFoundError(cartItemId);
    }

    const removedItem = this.props.items[index];
    this.props.items.splice(index, 1);
    this.applyChange();

    this.addDomainEvent(
      new CartItemRemovedEvent({
        cartId: this._id.getValue(),
        cartItemId: removedItem.id.getValue(),
        productId: removedItem.productId,
      }),
    );
  }

  /**
   * Remove an item from the cart by product ID
   */
  public removeItemByProductId(productId: string): void {
    const item = this.findItemByProductId(productId);

    if (!item) {
      throw new CartItemNotFoundError(productId);
    }

    this.removeItem(item.id.getValue());
  }

  /**
   * Update quantity of a cart item
   */
  public updateItemQuantity(cartItemId: string, newQuantity: number): void {
    const item = this.findItemById(cartItemId);

    if (!item) {
      throw new CartItemNotFoundError(cartItemId);
    }

    const oldQuantity = item.quantity.getValue();
    item.updateQuantity(newQuantity);
    this.applyChange();

    this.addDomainEvent(
      new CartItemQuantityUpdatedEvent({
        cartId: this._id.getValue(),
        cartItemId: item.id.getValue(),
        productId: item.productId,
        oldQuantity,
        newQuantity,
      }),
    );
  }

  /**
   * Clear all items from the cart
   */
  public clear(): void {
    if (this.isEmpty()) {
      return;
    }

    const itemCount = this.props.items.length;
    this.props.items = [];
    this.applyChange();

    this.addDomainEvent(
      new CartClearedEvent({
        cartId: this._id.getValue(),
        userId: this.props.userId,
        itemCount,
      }),
    );
  }

  /**
   * Ensure cart is not empty (used before checkout)
   */
  public ensureNotEmpty(): void {
    if (this.isEmpty()) {
      throw new CartIsEmptyError(this._id.getValue());
    }
  }

  // ============================================
  // Private Helpers
  // ============================================

  private applyChange(): void {
    this.props.updatedAt = new Date();
  }

  // ============================================
  // Getters
  // ============================================

  public get id(): CartId {
    return this._id;
  }

  public get userId(): string {
    return this.props.userId;
  }

  public get items(): ReadonlyArray<CartItem> {
    return [...this.props.items];
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
