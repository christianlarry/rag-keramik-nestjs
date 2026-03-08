import { HttpStatus } from '@nestjs/common';
import { ProductApplicationErrorEnum } from '../../../application/errors/enums/product-application-error.enum';

export const ProductApplicationErrorToHttpStatusMap: Record<
  ProductApplicationErrorEnum,
  HttpStatus
> = {
  [ProductApplicationErrorEnum.PRODUCT_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ProductApplicationErrorEnum.PRODUCT_ALREADY_EXISTS]: HttpStatus.CONFLICT,
  [ProductApplicationErrorEnum.SKU_ALREADY_EXISTS]: HttpStatus.CONFLICT,
};

export const getHttpStatusForProductApplicationError = (
  error: ProductApplicationErrorEnum,
): HttpStatus => {
  return ProductApplicationErrorToHttpStatusMap[error] ?? HttpStatus.INTERNAL_SERVER_ERROR;
};
