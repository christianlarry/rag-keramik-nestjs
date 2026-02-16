import { Inject, Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { UserLoggedInWithOAuthEvent } from "../../../auth/domain/events/user-logged-in-with-oauth.event";
import { USER_REPOSITORY_TOKEN, type UserRepository } from "../../domain/repositories/user-repository.interface";
import { UserNotFoundError } from "../../domain/errors";
import { Avatar } from "../../domain/value-objects/avatar.vo";

@Injectable()
export class UpdateUserProfileListener {

  private readonly logger = new Logger(UpdateUserProfileListener.name);

  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: UserRepository
  ) { }

  @OnEvent(UserLoggedInWithOAuthEvent.EventName, { async: true })
  async handle(e: UserLoggedInWithOAuthEvent): Promise<void> {
    const user = await this.userRepository.findById(e.payload.userId);

    if (!user) {
      throw new UserNotFoundError(`User with ID ${e.payload.userId} not found when handling ${UserLoggedInWithOAuthEvent.EventName}`);
    }

    if (e.payload.avatarUrl) {
      const avatar = Avatar.create(e.payload.avatarUrl);
      user.updateProfile({
        avatarUrl: avatar,
      })

      await this.userRepository.save(user);
    }
  }
}