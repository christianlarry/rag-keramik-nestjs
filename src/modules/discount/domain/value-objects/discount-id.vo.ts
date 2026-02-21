import { v4 as uuidv4, validate as isUuid } from 'uuid';
import { InvalidDiscountIdError } from '../errors';

export class DiscountId {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
    this.validate();
  }

  private validate(): void {
    if (!isUuid(this.value)) {
      throw new InvalidDiscountIdError(this.value);
    }
  }

  public static create(id?: string): DiscountId {
    return new DiscountId(id || uuidv4());
  }

  public static fromString(id: string): DiscountId {
    return new DiscountId(id);
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: DiscountId): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
