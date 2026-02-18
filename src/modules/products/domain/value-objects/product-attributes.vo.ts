import {
  FinishingType,
  Grade,
  ApplicationArea,
} from '../enums';
import { InvalidProductAttributesError } from '../errors';

/**
 * Tile ceramic specific attributes
 */
export interface TileAttributes {
  // Size in centimeters (e.g., "40x40", "60x60", "30x60")
  size?: string;

  // Grade quality
  grade?: Grade;

  // Surface finishing
  finishing?: FinishingType;

  // Application areas
  applicationAreas?: ApplicationArea[];

  // Anti-slip rating (R9, R10, R11, R12, R13)
  antiSlipRating?: string;

  // Water absorption percentage
  waterAbsorption?: string;

  // Thickness in millimeters
  thickness?: number;

  // Color
  color?: string;

  // Pattern/motif name
  pattern?: string;

  // Indoor or outdoor use
  isOutdoor?: boolean;

  // Frost resistant
  frostResistant?: boolean;

  // PEI rating (1-5, wear resistance)
  peiRating?: number;

  // Additional custom attributes
  [key: string]: unknown;
}

export class ProductAttributes {
  private readonly attributes: TileAttributes;

  private constructor(attributes: TileAttributes) {
    this.attributes = attributes;
    this.validate();
  }

  private validate(): void {
    // Validate specific fields if provided
    if (this.attributes.size) {
      this.validateSize(this.attributes.size);
    }

    if (this.attributes.antiSlipRating) {
      this.validateAntiSlipRating(this.attributes.antiSlipRating);
    }

    if (
      this.attributes.thickness !== undefined &&
      this.attributes.thickness <= 0
    ) {
      throw new InvalidProductAttributesError(
        'Thickness must be greater than 0',
      );
    }

    if (this.attributes.peiRating !== undefined) {
      this.validatePeiRating(this.attributes.peiRating);
    }

    if (this.attributes.grade !== undefined) {
      this.validateGrade(this.attributes.grade);
    }

    if (this.attributes.finishing !== undefined) {
      this.validateFinishing(this.attributes.finishing);
    }

    if (this.attributes.applicationAreas !== undefined) {
      this.validateApplicationAreas(this.attributes.applicationAreas);
    }
  }

  private validateSize(size: string): void {
    // Format: "40x40" or "30x60"
    const sizePattern = /^\d+x\d+$/;
    if (!sizePattern.test(size)) {
      throw new InvalidProductAttributesError(
        'Size must be in format: "WidthxHeight" (e.g., "40x40")',
      );
    }
  }

  private validateAntiSlipRating(rating: string): void {
    const validRatings = ['R9', 'R10', 'R11', 'R12', 'R13'];
    if (!validRatings.includes(rating)) {
      throw new InvalidProductAttributesError(
        `Invalid anti-slip rating. Must be one of: ${validRatings.join(', ')}`,
      );
    }
  }

  private validatePeiRating(rating: number): void {
    if (rating < 1 || rating > 5) {
      throw new InvalidProductAttributesError(
        'PEI rating must be between 1 and 5',
      );
    }
  }

  private validateGrade(grade: Grade): void {
    if (!Object.values(Grade).includes(grade)) {
      throw new InvalidProductAttributesError(`Invalid grade: ${grade}`);
    }
  }

  private validateFinishing(finishing: FinishingType): void {
    if (!Object.values(FinishingType).includes(finishing)) {
      throw new InvalidProductAttributesError(
        `Invalid finishing type: ${finishing}`,
      );
    }
  }

  private validateApplicationAreas(areas: ApplicationArea[]): void {
    for (const area of areas) {
      if (!Object.values(ApplicationArea).includes(area)) {
        throw new InvalidProductAttributesError(
          `Invalid application area: ${area}`,
        );
      }
    }
  }

  public static create(attributes?: TileAttributes): ProductAttributes {
    return new ProductAttributes(attributes || {});
  }

  public static createEmpty(): ProductAttributes {
    return new ProductAttributes({});
  }

  public getAttributes(): TileAttributes {
    return { ...this.attributes };
  }

  public getAttribute(key: string): unknown {
    return this.attributes[key];
  }

  public hasAttribute(key: string): boolean {
    return key in this.attributes && this.attributes[key] !== undefined;
  }

  public getSize(): string | undefined {
    return this.attributes.size;
  }

  public getGrade(): Grade | undefined {
    return this.attributes.grade;
  }

  public getFinishing(): FinishingType | undefined {
    return this.attributes.finishing;
  }

  public getApplicationAreas(): ApplicationArea[] | undefined {
    return this.attributes.applicationAreas;
  }

  public equals(other: ProductAttributes): boolean {
    return (
      JSON.stringify(this.attributes) === JSON.stringify(other.attributes)
    );
  }

  public toJSON(): TileAttributes {
    return this.getAttributes();
  }

  public toString(): string {
    return JSON.stringify(this.attributes);
  }
}
