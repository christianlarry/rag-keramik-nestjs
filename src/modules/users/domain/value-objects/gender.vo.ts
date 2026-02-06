import { InvalidGenderError } from "../errors";
import { Gender as GenderEnum } from "../enums/gender.enum";

export class Gender {
  private readonly value: GenderEnum;

  private constructor(gender: GenderEnum) {
    this.value = gender;
    this.validate();
  }

  private validate(): void {
    if (!Object.values(GenderEnum).includes(this.value)) {
      throw new InvalidGenderError(this.value);
    }
  }

  public static create(value: string): Gender {
    return new Gender(value as GenderEnum);
  }

  public static createMale(): Gender {
    return new Gender(GenderEnum.MALE);
  }

  public static createFemale(): Gender {
    return new Gender(GenderEnum.FEMALE);
  }

  public getValue(): GenderEnum {
    return this.value;
  }

  public isMale(): boolean {
    return this.value === GenderEnum.MALE;
  }

  public isFemale(): boolean {
    return this.value === GenderEnum.FEMALE;
  }

  public getDisplayName(): string {
    return this.value === GenderEnum.MALE ? 'Male' : 'Female';
  }

  public equals(other: Gender): boolean {
    return this.value === other.value;
  }
}