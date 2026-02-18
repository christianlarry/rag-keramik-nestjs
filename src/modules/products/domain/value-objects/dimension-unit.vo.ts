import { DimensionUnit as DimensionUnitEnum } from "../enums/dimension-unit.enum";
import { InvalidDimensionUnitError } from "../errors";

export class DimensionUnit {
  private readonly unit: DimensionUnitEnum;

  constructor(unit: DimensionUnitEnum) {
    this.unit = unit;

    this.validate();
  }

  private validate() {
    const validUnits = Object.values(DimensionUnitEnum);

    // Ensure the provided unit is one of the valid dimension units
    if (!validUnits.includes(this.unit)) {
      throw new InvalidDimensionUnitError(this.unit, `Invalid dimension unit: ${this.unit}`);
    }
  }

  public static create(unit: DimensionUnitEnum): DimensionUnit {
    return new DimensionUnit(unit);
  }

  public static fromString(unitStr: string): DimensionUnit {
    const unit = DimensionUnitEnum[unitStr as keyof typeof DimensionUnitEnum];
    if (!unit) {
      throw new InvalidDimensionUnitError(unitStr, `Invalid dimension unit string: ${unitStr}`);
    }
    return new DimensionUnit(unit);
  }

  public getValue(): DimensionUnitEnum {
    return this.unit;
  }

  public toString(): string {
    return this.unit;
  }

  // Get abbreviation (e.g., 'cm' for 'CENTIMETER')
  public toAbbreviation(): string {
    switch (this.unit) {
      case DimensionUnitEnum.MILLIMETER:
        return 'mm';
      case DimensionUnitEnum.CENTIMETER:
        return 'cm';
      case DimensionUnitEnum.METER:
        return 'm';
      case DimensionUnitEnum.INCH:
        return 'in';
      case DimensionUnitEnum.FOOT:
        return 'ft';
    }
  }

  public equals(other: DimensionUnit): boolean {
    return this.unit === other.unit;
  }
}