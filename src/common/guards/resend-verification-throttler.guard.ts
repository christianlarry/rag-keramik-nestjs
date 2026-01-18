import { Injectable } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";

@Injectable()
export class ResendVerificationThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, any>): Promise<string> {
    // Use email as the unique identifier for rate limiting
    const email = req.body?.email;
    return Promise.resolve(email || req.ip);
  }
}