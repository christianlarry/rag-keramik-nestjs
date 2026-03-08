import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Observable } from "rxjs";
import { RequestedUser } from "../interfaces/requested-user.interface";
import { ConfigService } from "@nestjs/config";
import { AllConfigType } from "src/config/config.type";

@Injectable()
export class AuthContextGuard implements CanActivate {

  /*
  This guard is responsible for parsing the JWT token from the Authorization header of incoming requests. It verifies the token and, if valid, attaches the decoded user information to the request object. This allows subsequent guards and interceptors to access the user's role and other details for authorization and serialization purposes.

  The Purpose is just to extract the user information from the jwt and always return true, so that the request can proceed to the next step in the request handling pipeline. The actual authorization logic based on user roles will be handled by other guards or interceptors that check the user's role and permissions.

  Terima Gaji!!!
  */

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService<AllConfigType>
  ) { }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();

    // Parse JWT Token from the Authorization header
    const authHeader = request.headers['authorization'];
    const token: string = authHeader && authHeader.split(' ')[1]; // Assuming Bearer token

    if (token) {
      try {
        const decoded = this.verifyToken(token);
        if (decoded) {
          request.user = decoded;
        }
      } catch {
        request.user = null; // Invalid token, set user to null
      }
    }

    return true
  }

  private verifyToken(token: string): RequestedUser {
    const payload = this.jwtService.verify<RequestedUser>(token, {
      secret: this.config.get('auth.accessTokenSecret', { infer: true }),
    });

    return payload;
  }
}