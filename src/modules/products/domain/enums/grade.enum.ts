export class Grade {
  public readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  public static readonly GRADE_A = new Grade('GRADE_A');
  public static readonly GRADE_B = new Grade('GRADE_B');
  public static readonly GRADE_C = new Grade('GRADE_C');
  public static readonly PREMIUM = new Grade('PREMIUM');

  public static create(value: string): Grade {
    const normalized = value.toUpperCase().replace(/\s+/g, '_');

    switch (normalized) {
      case 'GRADE_A':
      case 'A':
        return Grade.GRADE_A;
      case 'GRADE_B':
      case 'B':
        return Grade.GRADE_B;
      case 'GRADE_C':
      case 'C':
        return Grade.GRADE_C;
      case 'PREMIUM':
        return Grade.PREMIUM;
      default:
        throw new Error(`Invalid grade: ${value}`);
    }
  }

  public isPremium(): boolean {
    return this.value === 'PREMIUM';
  }

  public isGradeA(): boolean {
    return this.value === 'GRADE_A';
  }

  public isGradeB(): boolean {
    return this.value === 'GRADE_B';
  }

  public isGradeC(): boolean {
    return this.value === 'GRADE_C';
  }

  public equals(other: Grade): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }

  public static getAllGrades(): Grade[] {
    return [Grade.PREMIUM, Grade.GRADE_A, Grade.GRADE_B, Grade.GRADE_C];
  }
}
