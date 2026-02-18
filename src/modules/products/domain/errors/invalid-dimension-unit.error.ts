import { DomainError } from 'src/core/domain/domain-error.base';
import { ProductErrorCode } from './enums/product-error-code.enum';

export class InvalidDimensionUnitError extends DomainError {
  readonly code = ProductErrorCode.INVALID_DIMENSION_UNIT;

  constructor(unit: string, message?: string) {
    super(
      `Invalid dimension unit: ${unit}${message ? `. ${message}` : ''}`,
    );
  }
}
