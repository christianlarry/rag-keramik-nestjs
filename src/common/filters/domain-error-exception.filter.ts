import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from "@nestjs/common";
import { DomainError } from "../errors/domain.error";
import { Response } from "express";

@Catch(DomainError)
export class DomainErrorExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainErrorExceptionFilter.name)
  catch(exception: DomainError, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()

    const status = HttpStatus.INTERNAL_SERVER_ERROR

    response.status(status).json({
      message: exception.message,
      statusCode: status,
      error: exception.code
    })
  }
}