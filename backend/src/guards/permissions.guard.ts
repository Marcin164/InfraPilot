import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Users } from 'src/entities/users.entity';
import { PERMISSIONS_KEY } from 'src/decorators/requiresPermission.decorator';
import { PermissionCode } from 'src/decorators/permissions.catalog';
import { validateAccessTokenAndGetUserClass } from 'src/helpers/propelAuthClient';
import { resolveRequestUser } from 'src/helpers/resolveRequestUser';
import { CustomRolesService } from 'src/services/customRoles.service';

/**
 * Reads `@RequiresPermission(...)` metadata and grants access if the user's
 * effective permission set (see CustomRolesService) contains any of the
 * listed codes. No-ops when a handler has no such metadata.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
    private readonly customRolesService: CustomRolesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<
      PermissionCode[] | undefined
    >(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (!required || required.length === 0) return true;

    const req = context.switchToHttp().getRequest();

    if (!req.user) {
      const authHeader = req.headers?.authorization;
      if (!authHeader) throw new UnauthorizedException('Missing Authorization');
      const [type, token] = authHeader.split(' ');
      if (type !== 'Bearer' || !token) {
        throw new UnauthorizedException('Invalid Authorization header');
      }
      try {
        req.user = await validateAccessTokenAndGetUserClass(token);
      } catch {
        throw new UnauthorizedException('Token invalid or expired');
      }
    }

    const user = await resolveRequestUser(req, this.usersRepository);
    if (!user) {
      throw new ForbiddenException('User context missing');
    }

    const granted = await this.customRolesService.getUserPermissions(user.id);
    const hasRequired = required.some((permission) => granted.has(permission));
    if (!hasRequired) {
      throw new ForbiddenException(
        `Required permission(s): ${required.join(', ')}`,
      );
    }

    req.appUser = user;
    return true;
  }
}
