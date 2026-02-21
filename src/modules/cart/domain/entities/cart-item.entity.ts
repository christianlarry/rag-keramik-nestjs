import { CartItemId } from '../value-objects/cart-item-id.vo';
import { Quantity } from '../value-objects/quantity.vo';

interface CartItemProps {
  productId: string;
  quantity: Quantity;
  readonly createdAt: Date;
  updatedAt: Date;
}

interface CreateCartItemParams {
  productId: string;
  quantity: number;
}

/**
 * CartItem — Child Entity of Cart Aggregate
 *
 * Represents a single item (product + quantity) within a shopping cart.
 * CartItems are always managed through the Cart aggregate root.
 */
export class CartItem {
  private readonly _id: CartItemId;
  private props: CartItemProps;

  private constructor(id: CartItemId, props: CartItemProps) {
    this._id = id;
    this.props = props;
  }

  // ============================================
  // Factory Methods
  // ============================================

  /**
   * Create a new cart item
   */
  public static create(params: CreateCartItemParams): CartItem {
    const cartItemId = CartItemId.create();
    const quantity = Quantity.create(params.quantity);

    return new CartItem(cartItemId, {
      productId: params.productId,
      quantity,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Reconstruct cart item from persistence
   */
  public static reconstruct(id: string, props: CartItemProps): CartItem {
    return new CartItem(CartItemId.fromString(id), props);
  }

  // ============================================
  // Command Methods
  // ============================================

  /**
   * Update quantity
   */
  public updateQuantity(newQuantity: number): void {
    this.props.quantity = Quantity.create(newQuantity);
    this.props.updatedAt = new Date();
  }

  /**
   * Increase quantity by amount
   */
  public increaseQuantity(amount: number): void {
    this.props.quantity = this.props.quantity.add(amount);
    this.props.updatedAt = new Date();
  }

  // ============================================
  // Query Methods
  // ============================================

  public isForProduct(productId: string): boolean {
    return this.props.productId === productId;
  }

  // ============================================
  // Getters
  // ============================================

  public get id(): CartItemId {
    return this._id;
  }

  public get productId(): string {
    return this.props.productId;
  }

  public get quantity(): Quantity {
    return this.props.quantity;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
