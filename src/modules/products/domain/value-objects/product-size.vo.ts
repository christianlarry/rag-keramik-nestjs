import { InvalidProductSizeError } from "../errors";
import { DimensionUnit } from "./dimension-unit.vo";

interface ProductSizeProps {
  width: number;
  height: number;
  thickness: number | null;
  dimensionUnit: DimensionUnit;
}

export class ProductSize {
  private readonly width: number;
  private readonly height: number;
  private readonly thickness: number | null;
  private readonly dimensionUnit: DimensionUnit;

  constructor(props: ProductSizeProps) {
    this.width = props.width;
    this.height = props.height;
    this.thickness = props.thickness;
    this.dimensionUnit = props.dimensionUnit;

    this.validate()
  }

  private validate() {
    if (this.width <= 0) {
      throw new InvalidProductSizeError('Width must be greater than 0');
    }
    if (this.height <= 0) {
      throw new InvalidProductSizeError('Height must be greater than 0');
    }
    if (this.thickness !== null && this.thickness <= 0) {
      throw new InvalidProductSizeError('Thickness must be greater than 0 if provided');
    }
  }

  public static create(props: ProductSizeProps): ProductSize {
    return new ProductSize(props);
  }

  // Getters
  public getWidth(): number { return this.width; }
  public getHeight(): number { return this.height; }
  public getThickness(): number | null { return this.thickness; }
  public getDimensionUnit(): DimensionUnit { return this.dimensionUnit; }
  public getSize(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }

  public toString(): string {
    return `${this.width}x${this.height}${this.thickness !== null ? `x${this.thickness}` : ''} ${this.dimensionUnit.toAbbreviation()}`;
  }
}