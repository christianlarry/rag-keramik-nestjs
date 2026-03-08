import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { AuditService } from "src/core/infrastructure/services/audit/audit.service";
import { AuditTargetType } from "src/core/infrastructure/services/audit/enums/audit-target-type.enum";
import { AuditAction } from "src/core/infrastructure/services/audit/enums/audit-action.enum";
import { ProductDeletedAppEvent } from "../events/product-deleted-app.event";

@Injectable()
export class LogProductDeletedListener {

  constructor(
    private readonly auditService: AuditService
  ) { }

  @OnEvent(ProductDeletedAppEvent.EventName, { async: true })
  async handle(event: ProductDeletedAppEvent) {

    const payload = event.payload

    await this.auditService.logUserAction(
      payload.deletedBy,
      AuditAction.PRODUCT_DELETED,
      AuditTargetType.PRODUCT,
      payload.productId
    )
  }
}