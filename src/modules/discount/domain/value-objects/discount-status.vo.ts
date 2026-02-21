import { DiscountStatusEnum } from '../enums';
import { InvalidDiscountStatusError } from '../errors';
import { InvalidDiscountStatusTransitionError } from '../errors/invalid-discount-status-transition.error';

/**
 * DiscountStatus Value Object
 *
 * Encapsulates discount status with state transition rules.
 *
 * Valid transitions:
 *   ACTIVE -> INACTIVE, EXPIRED
 *   INACTIVE -> ACTIVE
 *   EXPIRED -> (terminal)
 */
export class DiscountStatus {
  private readonly value: DiscountStatusEnum;

  private static readonly VALID_TRANSITIONS: Record<
    DiscountStatusEnum,
    DiscountStatusEnum[]
  > = {
      [DiscountStatusEnum.ACTIVE]: [
        DiscountStatusEnum.INACTIVE,
        DiscountStatusEnum.EXPIRED,
      ],
      [DiscountStatusEnum.INACTIVE]: [DiscountStatusEnum.ACTIVE],
      [DiscountStatusEnum.EXPIRED]: [],
    };

  private constructor(value: DiscountStatusEnum) {
    this.value = value;
  }

  public static create(value: string): DiscountStatus {
    const validStatuses = Object.values(DiscountStatusEnum) as string[];
    if (!validStatuses.includes(value)) {
      throw new InvalidDiscountStatusError(value);
    }
    return new DiscountStatus(value as DiscountStatusEnum);
  }

  public static createActive(): DiscountStatus {
    return new DiscountStatus(DiscountStatusEnum.ACTIVE);
  }

  public static createInactive(): DiscountStatus {
    return new DiscountStatus(DiscountStatusEnum.INACTIVE);
  }

  public static createExpired(): DiscountStatus {
    return new DiscountStatus(DiscountStatusEnum.EXPIRED);
  }

  public getValue(): DiscountStatusEnum {
    return this.value;
  }

  public equals(other: DiscountStatus): boolean {
    return this.value === other.value;
  }

  public isActive(): boolean {
    return this.value === DiscountStatusEnum.ACTIVE;
  }

  public isInactive(): boolean {
    return this.value === DiscountStatusEnum.INACTIVE;
  }

  public isExpired(): boolean {
    return this.value === DiscountStatusEnum.EXPIRED;
  }

  public canTransitionTo(newStatus: DiscountStatus): boolean {
    const allowedTransitions = DiscountStatus.VALID_TRANSITIONS[this.value];
    return allowedTransitions.includes(newStatus.value);
  }

  public transitionTo(newStatus: DiscountStatus): DiscountStatus {
    if (!this.canTransitionTo(newStatus)) {
      throw new InvalidDiscountStatusTransitionError(
        this.value,
        newStatus.value,
      );
    }
    return newStatus;
  }

  public toString(): string {
    return this.value;
  }
}
