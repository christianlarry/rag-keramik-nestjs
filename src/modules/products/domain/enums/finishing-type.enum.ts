export class FinishingType {
  public readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  public static readonly GLOSSY = new FinishingType('GLOSSY');
  public static readonly MATTE = new FinishingType('MATTE');
  public static readonly POLISHED = new FinishingType('POLISHED');
  public static readonly RUSTIC = new FinishingType('RUSTIC');
  public static readonly TEXTURED = new FinishingType('TEXTURED');
  public static readonly SEMI_POLISHED = new FinishingType('SEMI_POLISHED');
  public static readonly NATURAL = new FinishingType('NATURAL');

  public static create(value: string): FinishingType {
    const normalized = value.toUpperCase().replace(/\s+/g, '_');

    switch (normalized) {
      case 'GLOSSY':
        return FinishingType.GLOSSY;
      case 'MATTE':
        return FinishingType.MATTE;
      case 'POLISHED':
        return FinishingType.POLISHED;
      case 'RUSTIC':
        return FinishingType.RUSTIC;
      case 'TEXTURED':
        return FinishingType.TEXTURED;
      case 'SEMI_POLISHED':
        return FinishingType.SEMI_POLISHED;
      case 'NATURAL':
        return FinishingType.NATURAL;
      default:
        throw new Error(`Invalid finishing type: ${value}`);
    }
  }

  public equals(other: FinishingType): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }

  public static getAllTypes(): FinishingType[] {
    return [
      FinishingType.GLOSSY,
      FinishingType.MATTE,
      FinishingType.POLISHED,
      FinishingType.RUSTIC,
      FinishingType.TEXTURED,
      FinishingType.SEMI_POLISHED,
      FinishingType.NATURAL,
    ];
  }
}
