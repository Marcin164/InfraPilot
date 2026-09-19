import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UserCustomRole } from 'src/entities/userCustomRole.entity';
import { CustomRole } from 'src/entities/customRole.entity';
import { Users } from 'src/entities/users.entity';
import {
  ALL_PERMISSION_CODES,
  expandPermissions,
  PermissionCode,
} from 'src/decorators/permissions.catalog';
import { uuidv4 } from 'src/helpers/uuidv4';
import { logoutAllUserSessions } from 'src/helpers/propelAuthClient';

type RoleWriteFields = {
  name?: string;
  description?: string;
  grantsAllPermissions?: boolean;
  permissions?: string[];
};

@Injectable()
export class CustomRolesService {
  private readonly logger = new Logger(CustomRolesService.name);

  constructor(
    @InjectRepository(UserCustomRole)
    private readonly userCustomRoleRepository: Repository<UserCustomRole>,
    @InjectRepository(CustomRole)
    private readonly customRoleRepository: Repository<CustomRole>,
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
  ) {}

  /**
   * Effective permission set for a user: union of every assigned custom
   * role's permissions, implications expanded. A role with
   * `grantsAllPermissions` short-circuits to the full current catalog.
   */
  async getUserPermissions(userId: string): Promise<Set<PermissionCode>> {
    const assignments = await this.userCustomRoleRepository.find({
      where: { userId },
      relations: ['role'],
    });

    if (
      assignments.some((assignment) => assignment.role.grantsAllPermissions)
    ) {
      return new Set(ALL_PERMISSION_CODES);
    }

    const codes = assignments.flatMap(
      (assignment) => assignment.role.permissions,
    );
    return expandPermissions(codes);
  }

  async listRoles(): Promise<CustomRole[]> {
    return this.customRoleRepository.find({ order: { name: 'ASC' } });
  }

  async getRole(id: string): Promise<CustomRole> {
    const role = await this.customRoleRepository.findOneBy({ id });
    if (!role) throw new NotFoundException('Custom role not found');
    return role;
  }

  async createRole(dto: RoleWriteFields): Promise<CustomRole> {
    const name = dto.name?.trim();
    if (!name) throw new BadRequestException('Name is required');

    const existing = await this.customRoleRepository.findOne({
      where: { name },
    });
    if (existing) {
      throw new BadRequestException('A role with this name already exists');
    }

    const role = this.customRoleRepository.create({
      id: uuidv4(),
      name,
      description: dto.description?.trim() || null,
      isBuiltIn: false,
      grantsAllPermissions: Boolean(dto.grantsAllPermissions),
      permissions: this.validatePermissions(dto.permissions ?? []),
    });
    return this.customRoleRepository.save(role);
  }

  async updateRole(id: string, dto: RoleWriteFields): Promise<CustomRole> {
    const role = await this.getRole(id);

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name) throw new BadRequestException('Name is required');
      const existing = await this.customRoleRepository.findOne({
        where: { name },
      });
      if (existing && existing.id !== id) {
        throw new BadRequestException('A role with this name already exists');
      }
      role.name = name;
    }
    if (dto.description !== undefined) {
      role.description = dto.description?.trim() || null;
    }
    if (dto.grantsAllPermissions !== undefined) {
      role.grantsAllPermissions = dto.grantsAllPermissions;
    }
    if (dto.permissions !== undefined) {
      role.permissions = this.validatePermissions(dto.permissions);
    }

    return this.customRoleRepository.save(role);
  }

  async deleteRole(id: string): Promise<{ success: boolean }> {
    const role = await this.getRole(id);
    if (role.isBuiltIn) {
      throw new BadRequestException('Built-in roles cannot be deleted');
    }
    await this.customRoleRepository.remove(role);
    return { success: true };
  }

  async assignRole(
    roleId: string,
    userId: string,
  ): Promise<{ success: boolean }> {
    await this.getRole(roleId);
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('User not found');

    const existing = await this.userCustomRoleRepository.findOne({
      where: { userId, roleId },
    });
    if (existing) {
      return { success: true };
    }

    await this.userCustomRoleRepository.save(
      this.userCustomRoleRepository.create({ id: uuidv4(), userId, roleId }),
    );
    await this.forceLogout(user, userId);

    return { success: true };
  }

  async unassignRole(
    roleId: string,
    userId: string,
  ): Promise<{ success: boolean }> {
    await this.getRole(roleId);
    const user = await this.usersRepository.findOneBy({ id: userId });

    const result = await this.userCustomRoleRepository.delete({
      userId,
      roleId,
    });
    if (result?.affected) {
      await this.forceLogout(user, userId);
    }

    return { success: true };
  }

  /** All user ids currently holding any of the given permissions, directly
   * or via `grantsAllPermissions`. */
  async findUserIdsWithAnyPermission(
    codes: PermissionCode[],
  ): Promise<string[]> {
    const assignments = await this.userCustomRoleRepository.find({
      relations: ['role'],
    });
    const matching = new Set<string>();
    for (const assignment of assignments) {
      if (assignment.role.grantsAllPermissions) {
        matching.add(assignment.userId);
        continue;
      }
      const granted = expandPermissions(assignment.role.permissions);
      if (codes.some((code) => granted.has(code))) {
        matching.add(assignment.userId);
      }
    }
    return Array.from(matching);
  }

  /** Best-effort: cut off existing sessions when a user's role assignments
   * change, so a demoted/promoted account doesn't keep acting under its old
   * permission set until the token naturally expires. */
  private async forceLogout(user: Users | null, userId: string): Promise<void> {
    if (!user?.authUserId) return;
    try {
      await logoutAllUserSessions(user.authUserId);
      this.logger.log(
        `Forced logout of all sessions for user ${userId} (authUserId=${user.authUserId}) after role change`,
      );
    } catch (err) {
      this.logger.warn(
        `Failed to logout sessions for user ${userId}: ${(err as Error).message}`,
      );
    }
  }

  /** Role-id list per user, for the given users only (assignment matrix). */
  async getAssignmentsForUsers(
    userIds: string[],
  ): Promise<Record<string, string[]>> {
    if (!userIds.length) return {};
    const rows = await this.userCustomRoleRepository.find({
      where: { userId: In(userIds) },
    });
    const map: Record<string, string[]> = {};
    for (const row of rows) {
      (map[row.userId] ??= []).push(row.roleId);
    }
    return map;
  }

  private validatePermissions(codes: string[]): PermissionCode[] {
    const invalid = codes.filter(
      (code) => !ALL_PERMISSION_CODES.includes(code as PermissionCode),
    );
    if (invalid.length) {
      throw new BadRequestException(
        `Unknown permission code(s): ${invalid.join(', ')}`,
      );
    }
    return codes as PermissionCode[];
  }
}
