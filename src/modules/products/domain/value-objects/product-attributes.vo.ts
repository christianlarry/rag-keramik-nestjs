import { FinishingType } from '../enums/finishing-type.enum';
import { Grade } from '../enums/grade.enum';
import { ApplicationArea } from '../enums/application-area.enum';

/**
 * Tile ceramic specific attributes
 */
export interface TileAttributes {
  // Size in centimeters (e.g., "40x40", "60x60", "30x60")
  size?: string;

  // Grade quality
  grade?: Grade['value'];

  // Surface finishing
  finishing?: FinishingType['value'];

  // Application areas
  applicationAreas?: ApplicationArea['value'][];

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
  }

  public static create(attributes?: TileAttributes): ProductAttributes {
    const attrs = attributes || {};

    // Validate specific fields if provided
    if (attrs.size) {
      this.validateSize(attrs.size);
    }

    if (attrs.antiSlipRating) {
      this.validateAntiSlipRating(attrs.antiSlipRating);
    }

    if (attrs.thickness !== undefined && attrs.thickness <= 0) {
      throw new Error('Thickness must be greater than 0');
    }

    if (attrs.peiRating !== undefined) {
      this.validatePeiRating(attrs.peiRating);
    }

    return new ProductAttributes(attrs);
  }

  private static validateSize(size: string): void {
    // Format: "40x40" or "30x60"
    const sizePattern = /^\d+x\d+$/;
    if (!sizePattern.test(size)) {
      throw new Error('Size must be in format: "WidthxHeight" (e.g., "40x40")');
    }
  }

  private static validateAntiSlipRating(rating: string): void {
    const validRatings = ['R9', 'R10', 'R11', 'R12', 'R13'];
    if (!validRatings.includes(rating)) {
      throw new Error(
        `Invalid anti-slip rating. Must be one of: ${validRatings.join(', ')}`,
      );
    }
  }

  private static validatePeiRating(rating: number): void {
    if (rating < 1 || rating > 5) {
      throw new Error('PEI rating must be between 1 and 5');
    }
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

  public getGrade(): Grade['value'] | undefined {
    return this.attributes.grade;
  }

  public getFinishing(): FinishingType['value'] | undefined {
    return this.attributes.finishing;
  }

  public getApplicationAreas(): ApplicationArea['value'][] | undefined {
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
