import { Users } from 'src/entities/users.entity';
import { CustomRolesService } from 'src/services/customRoles.service';
import { PermissionCode } from 'src/decorators/permissions.catalog';

/**
 * "Staff" = holds at least one of the app's elevated permissions, not just
 * plain end-user access. Used outside the controller/guard layer (ticket
 * worknotes, websocket presence) where there's no @RequiresPermission to
 * hang this off of.
 */
const STAFF_PERMISSIONS: PermissionCode[] = [
  'helpdesk.tickets.access',
  'audit.fullAccess',
  'devices.complianceRules.manage',
  'helpdesk.approver',
  'dpo.fullAccess',
];

export async function isStaffUser(
  user: Pick<Users, 'id'> | null | undefined,
  customRolesService: CustomRolesService,
): Promise<boolean> {
  if (!user) return false;
  const granted = await customRolesService.getUserPermissions(user.id);
  return STAFF_PERMISSIONS.some((code) => granted.has(code));
}
