/**
 * Granular permission catalog for the custom-role system (replaces the fixed
 * Role enum in roles.decorator.ts). Grouped to match the checkbox groups
 * agreed with the customer (Dashboards, Users, Devices, ...).
 *
 * `implies`: assigning this permission automatically grants the listed ones
 * too (e.g. viewing devices implies viewing the device map). Expanded via
 * `expandPermissions` so guards and UI never have to walk the graph by hand.
 */

const DASHBOARDS_PERMISSIONS = [
  { code: 'dashboards.view', label: 'Dashboard view' },
  { code: 'dashboards.edit', label: 'Dashboard edition' },
] as const;

const USERS_PERMISSIONS = [
  { code: 'users.view', label: 'View users table & user details' },
  { code: 'users.add', label: 'Add users' },
  { code: 'users.edit', label: 'Edit user' },
  { code: 'users.delete', label: 'Delete user' },
  { code: 'users.provision', label: 'Provision user' },
  {
    code: 'users.equipment.manage',
    label: 'Create/edit/delete equipment forms & edit equipment',
  },
] as const;

const DEVICES_PERMISSIONS = [
  { code: 'devices.view', label: 'View devices' },
  { code: 'devices.map.view', label: 'View map' },
  { code: 'devices.add', label: 'Add devices' },
  { code: 'devices.secret.generate', label: 'Generate secret' },
  { code: 'devices.assignment.manage', label: 'Assignment' },
  { code: 'devices.connection.manage', label: 'Connection' },
  { code: 'devices.lifecycle.edit', label: 'Lifecycle edit' },
  { code: 'devices.taskSchedule.manage', label: 'Task schedule' },
  { code: 'devices.maintenance.manage', label: 'Maintenance and service' },
  { code: 'devices.topology.view', label: 'View topology' },
  { code: 'devices.topology.edit', label: 'Edit topology' },
  { code: 'devices.lastLogonColors.view', label: 'Last logon colors' },
  { code: 'devices.tags.manage', label: 'Managing tags' },
  {
    code: 'devices.complianceRules.manage',
    label: 'Managing compliance rules',
  },
  { code: 'devices.agentConfig.manage', label: 'Agent config' },
] as const;

const SHIFTS_PERMISSIONS = [
  { code: 'shifts.viewOwn', label: 'View own shift' },
  { code: 'shifts.viewTeam', label: 'View team shifts' },
  { code: 'shifts.edit', label: 'Edit shifts' },
] as const;

const LICENSES_PERMISSIONS = [
  { code: 'licenses.view', label: 'View licenses' },
  { code: 'licenses.add', label: 'Add licenses' },
  { code: 'licenses.edit', label: 'Edit licenses' },
  { code: 'licenses.delete', label: 'Delete licenses' },
  { code: 'licenses.integrations.manage', label: 'Integrations' },
] as const;

const PROCUREMENT_PERMISSIONS = [
  { code: 'procurement.view', label: 'View procurements' },
  { code: 'procurement.add', label: 'Add orders' },
  { code: 'procurement.edit', label: 'Edit orders' },
  { code: 'procurement.delete', label: 'Remove orders' },
] as const;

const HELPDESK_PERMISSIONS = [
  { code: 'helpdesk.tickets.access', label: 'Access to tickets' },
  { code: 'helpdesk.approver', label: 'Approver' },
  { code: 'helpdesk.sla.config', label: 'SLA config' },
  { code: 'helpdesk.workflow.config', label: 'Workflow & config' },
  {
    code: 'helpdesk.assignmentGroups.manage',
    label: 'Create and assign assignment groups',
  },
  { code: 'helpdesk.ticketTemplates.manage', label: 'Ticket templates' },
] as const;

const KNOWLEDGE_PERMISSIONS = [
  { code: 'knowledge.view', label: 'View all' },
  { code: 'knowledge.manage', label: 'Add, update & delete' },
  {
    code: 'knowledge.createFromTicket',
    label: 'Create articles after ticket resolving',
  },
] as const;

const AUDIT_PERMISSIONS = [
  { code: 'audit.fullAccess', label: 'Full audit access' },
] as const;

const DPO_PERMISSIONS = [
  { code: 'dpo.viewUserAsDpo', label: 'View user as DPO' },
  { code: 'dpo.fullAccess', label: 'Full access to DPO tab' },
  { code: 'dpo.retentionPolicy.config', label: 'Retention policy config' },
] as const;

const ADMIN_PERMISSIONS = [
  { code: 'admin.activeDirectory.config', label: 'Active Directory' },
  { code: 'admin.o365.config', label: 'O365' },
  { code: 'admin.opsAlertEmails.config', label: 'Ops alert emails config' },
  { code: 'admin.roleAssignment.manage', label: 'Role assignment' },
  { code: 'admin.smtp.config', label: 'Mail (SMTP) config' },
  { code: 'admin.locations.config', label: 'Locations config' },
] as const;

export const PERMISSION_GROUPS = [
  {
    key: 'dashboards',
    label: 'Dashboards',
    permissions: DASHBOARDS_PERMISSIONS,
  },
  { key: 'users', label: 'Users', permissions: USERS_PERMISSIONS },
  { key: 'devices', label: 'Devices', permissions: DEVICES_PERMISSIONS },
  { key: 'shifts', label: 'Shift', permissions: SHIFTS_PERMISSIONS },
  { key: 'licenses', label: 'Licenses', permissions: LICENSES_PERMISSIONS },
  {
    key: 'procurement',
    label: 'Procurement',
    permissions: PROCUREMENT_PERMISSIONS,
  },
  { key: 'helpdesk', label: 'Helpdesk', permissions: HELPDESK_PERMISSIONS },
  { key: 'knowledge', label: 'Knowledge', permissions: KNOWLEDGE_PERMISSIONS },
  { key: 'audit', label: 'Audit log', permissions: AUDIT_PERMISSIONS },
  { key: 'dpo', label: 'DPO', permissions: DPO_PERMISSIONS },
  { key: 'admin', label: 'Admin', permissions: ADMIN_PERMISSIONS },
] as const;

export type PermissionCode =
  (typeof PERMISSION_GROUPS)[number]['permissions'][number]['code'];

const codesOf = (
  permissions: readonly { code: PermissionCode }[],
): PermissionCode[] => permissions.map((permission) => permission.code);

export const ALL_PERMISSION_CODES: PermissionCode[] = [
  ...codesOf(DASHBOARDS_PERMISSIONS),
  ...codesOf(USERS_PERMISSIONS),
  ...codesOf(DEVICES_PERMISSIONS),
  ...codesOf(SHIFTS_PERMISSIONS),
  ...codesOf(LICENSES_PERMISSIONS),
  ...codesOf(PROCUREMENT_PERMISSIONS),
  ...codesOf(HELPDESK_PERMISSIONS),
  ...codesOf(KNOWLEDGE_PERMISSIONS),
  ...codesOf(AUDIT_PERMISSIONS),
  ...codesOf(DPO_PERMISSIONS),
  ...codesOf(ADMIN_PERMISSIONS),
];

/** Permission -> permissions it automatically grants alongside it. */
export const PERMISSION_IMPLIES: Partial<
  Record<PermissionCode, PermissionCode[]>
> = {
  'devices.view': ['devices.map.view'],
  'audit.fullAccess': [
    ...codesOf(USERS_PERMISSIONS),
    ...codesOf(DEVICES_PERMISSIONS),
    ...codesOf(LICENSES_PERMISSIONS),
    ...codesOf(PROCUREMENT_PERMISSIONS),
    ...codesOf(HELPDESK_PERMISSIONS),
  ],
};

/**
 * Expands a set of directly-assigned permission codes with everything they
 * imply (transitively). Unknown codes are passed through unchanged so a
 * stale role referencing a since-removed permission doesn't crash the guard.
 */
export function expandPermissions(
  codes: Iterable<PermissionCode>,
): Set<PermissionCode> {
  const expanded = new Set<PermissionCode>();
  const queue = [...codes];

  while (queue.length > 0) {
    const code = queue.pop();
    if (!code || expanded.has(code)) continue;
    expanded.add(code);
    for (const implied of PERMISSION_IMPLIES[code] ?? []) {
      if (!expanded.has(implied)) queue.push(implied);
    }
  }

  return expanded;
}
