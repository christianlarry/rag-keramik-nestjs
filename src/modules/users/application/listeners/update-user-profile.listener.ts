import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { UserLoggedInWithOAuthEvent } from "../../../auth/domain/events/user-logged-in-with-oauth.event";

@Injectable()
export class UpdateUserProfileListener {

  private readonly logger = new Logger(UpdateUserProfileListener.name);

  @OnEvent(UserLoggedInWithOAuthEvent.EventName)
  async handle(e: UserLoggedInWithOAuthEvent): Promise<void> {
    this.logger.log(`User logged in with OAuth at ${e.occurredAt.toISOString()}. Payload: ${JSON.stringify(e.payload)}`);
  }
}