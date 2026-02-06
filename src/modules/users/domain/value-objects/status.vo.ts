import { Status as StatusEnum } from "../enums/status.enum"
import { InvalidStatusError } from "../errors";

export class Status {
  private readonly value: StatusEnum;

  private constructor(value: StatusEnum) {
    this.value = value;

    this.validate();
  }

  private validate(): void {
    if (!Object.values(StatusEnum).includes(this.value)) {
      throw new InvalidStatusError(this.value);
    }
  }

  public static create(value: string): Status {
    return new Status(value as StatusEnum);
  }

  public getValue(): StatusEnum {
    return this.value;
  }

  public equals(other: Status): boolean {
    return this.value === other.value;
  }

  public isActive(): boolean {
    return this.value === StatusEnum.ACTIVE;
  }

  public isInactive(): boolean {
    return this.value === StatusEnum.INACTIVE;
  }

  public isSuspended(): boolean {
    return this.value === StatusEnum.SUSPENDED;
  }

  public isDeleted(): boolean {
    return this.value === StatusEnum.DELETED;
  }
}