import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from 'src/generated/prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaClientExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    switch (exception.code) {
      case 'P2002': // Unique constraint violation
        status = HttpStatus.CONFLICT;
        message = `Duplicate field value: ${exception.meta?.target}`;
        break;

      case 'P2025': // Record not found
        status = HttpStatus.NOT_FOUND;
        message = 'Record not found';
        break;

      case 'P2003': // Foreign key constraint
        status = HttpStatus.BAD_REQUEST;
        message = 'Foreign key constraint failed';
        break;

      case 'P2014': // Invalid ID
        status = HttpStatus.BAD_REQUEST;
        message = 'Invalid ID provided';
        break;

      default:
        this.logger.error(`Unhandled Prisma error: ${exception.code}`, exception.message);
    }

    this.logger.error(`Prisma error occurred: ${message}`, exception.stack);

    response.status(status).json({
      statusCode: status,
      message,
      error: exception.code,
    });
  }
}