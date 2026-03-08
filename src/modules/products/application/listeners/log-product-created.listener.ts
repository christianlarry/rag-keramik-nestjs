import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { AuditService } from "src/core/infrastructure/services/audit/audit.service";
import { ProductCreatedAppEvent } from "../events/product-created-app.event";
import { AuditTargetType } from "src/core/infrastructure/services/audit/enums/audit-target-type.enum";
import { AuditAction } from "src/core/infrastructure/services/audit/enums/audit-action.enum";

@Injectable()
export class LogProductCreatedListener {

  constructor(
    private readonly auditService: AuditService
  ) { }

  @OnEvent(ProductCreatedAppEvent.EventName, { async: true })
  async handle(event: ProductCreatedAppEvent) {

    const payload = event.payload

    await this.auditService.logUserAction(
      payload.createdBy,
      AuditAction.PRODUCT_CREATED,
      AuditTargetType.PRODUCT,
      payload.productId
    )
  }
}