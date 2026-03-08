import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { AuditService } from "src/core/infrastructure/services/audit/audit.service";
import { AuditTargetType } from "src/core/infrastructure/services/audit/enums/audit-target-type.enum";
import { AuditAction } from "src/core/infrastructure/services/audit/enums/audit-action.enum";
import { ProductUpdatedAppEvent } from "../events/product-updated-app.event";

@Injectable()
export class LogProductUpdatedListener {

  constructor(
    private readonly auditService: AuditService
  ) { }

  @OnEvent(ProductUpdatedAppEvent.EventName, { async: true })
  async handle(event: ProductUpdatedAppEvent) {

    const payload = event.payload

    await this.auditService.logUserAction(
      payload.updatedBy,
      AuditAction.PRODUCT_UPDATED,
      AuditTargetType.PRODUCT,
      payload.productId,
      {
        fieldChanges: payload.fieldsUpdated.join(", ")
      }
    )
  }
}