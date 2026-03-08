import { ClassSerializerContextOptions, ClassSerializerInterceptor, ExecutionContext } from "@nestjs/common";

export class RoleBasedClassSerializerInterceptor extends ClassSerializerInterceptor {
  protected getContextOptions(context: ExecutionContext): ClassSerializerContextOptions | undefined {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Determine the groups based on the user's role
    const groups = user?.role ? [user.role] : [];

    console.log("User role:", user?.role);

    return { groups };
  }
}