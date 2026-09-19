import { SetMetadata } from '@nestjs/common';
import { PermissionCode } from './permissions.catalog';

export const PERMISSIONS_KEY = 'requiredPermissions';

/**
 * Grants access if the current user's effective permission set (unioned
 * across their custom roles, implications expanded) contains any of the
 * listed codes. No metadata = PermissionsGuard no-ops.
 */
export const RequiresPermission = (...permissions: PermissionCode[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
