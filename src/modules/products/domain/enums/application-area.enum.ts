export class ApplicationArea {
  public readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  public static readonly FLOOR = new ApplicationArea('FLOOR');
  public static readonly WALL = new ApplicationArea('WALL');
  public static readonly OUTDOOR = new ApplicationArea('OUTDOOR');
  public static readonly BATHROOM = new ApplicationArea('BATHROOM');
  public static readonly KITCHEN = new ApplicationArea('KITCHEN');
  public static readonly COMMERCIAL = new ApplicationArea('COMMERCIAL');
  public static readonly RESIDENTIAL = new ApplicationArea('RESIDENTIAL');
  public static readonly POOL = new ApplicationArea('POOL');
  public static readonly FACADE = new ApplicationArea('FACADE');

  public static create(value: string): ApplicationArea {
    const normalized = value.toUpperCase().replace(/\s+/g, '_');

    switch (normalized) {
      case 'FLOOR':
        return ApplicationArea.FLOOR;
      case 'WALL':
        return ApplicationArea.WALL;
      case 'OUTDOOR':
        return ApplicationArea.OUTDOOR;
      case 'BATHROOM':
        return ApplicationArea.BATHROOM;
      case 'KITCHEN':
        return ApplicationArea.KITCHEN;
      case 'COMMERCIAL':
        return ApplicationArea.COMMERCIAL;
      case 'RESIDENTIAL':
        return ApplicationArea.RESIDENTIAL;
      case 'POOL':
        return ApplicationArea.POOL;
      case 'FACADE':
        return ApplicationArea.FACADE;
      default:
        throw new Error(`Invalid application area: ${value}`);
    }
  }

  public equals(other: ApplicationArea): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }

  public static getAllAreas(): ApplicationArea[] {
    return [
      ApplicationArea.FLOOR,
      ApplicationArea.WALL,
      ApplicationArea.OUTDOOR,
      ApplicationArea.BATHROOM,
      ApplicationArea.KITCHEN,
      ApplicationArea.COMMERCIAL,
      ApplicationArea.RESIDENTIAL,
      ApplicationArea.POOL,
      ApplicationArea.FACADE,
    ];
  }
}
