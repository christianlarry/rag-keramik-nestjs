interface ProductProps {
  sku: string,
  name: string,
  description: string,
  price: string,
  attribute: string // TODO Attr VO
  // TODO: Add Others
}

export class Product {
  private readonly _id: string // TODO: Product ID VO
  private props: ProductProps

  private constructor(
    id: string,
    props: ProductProps
  ) {
    this._id = id;
    this.props = props

    this.validate()
  }

  private validate(): void {
    // Add validation logic, Invariant and others validation
  }

  // ===== Getters =====
  get id(): string { return this._id }
  get sku(): string { return this.props.sku }
  get name(): string { return this.props.name }
  get description(): string { return this.props.description }
  get price(): string { return this.props.price }
  get attribute(): string { return this.props.attribute }
} 