import type { SodPair } from "../Services/rbac";

export type RoleKey =
  | "isAdmin"
  | "isApprover"
  | "isAuditor"
  | "isCompliance"
  | "isHelpdesk"
  | "isDpo";

export const ROLE_DEFS: { key: RoleKey; labelKey: string; color: string; role: string }[] = [
  { key: "isAdmin", labelKey: "settings.admin.roles.role.admin", color: "#F3606E", role: "admin" },
  { key: "isApprover", labelKey: "settings.admin.roles.role.approver", color: "#2B9AE9", role: "approver" },
  { key: "isAuditor", labelKey: "settings.admin.roles.role.auditor", color: "#8E44AD", role: "auditor" },
  { key: "isCompliance", labelKey: "settings.admin.roles.role.compliance", color: "#16A085", role: "compliance" },
  { key: "isHelpdesk", labelKey: "settings.admin.roles.role.helpdesk", color: "#F1C40F", role: "helpdesk" },
  { key: "isDpo", labelKey: "settings.admin.roles.role.dpo", color: "#E67E22", role: "dpo" },
];

export const ROLE_BY_NAME: Record<string, RoleKey> = ROLE_DEFS.reduce(
  (acc, def) => ({ ...acc, [def.role]: def.key }),
  {} as Record<string, RoleKey>,
);

export const makeRoleLabel = (t: (k: string) => string) => (name: string) => {
  const def = ROLE_DEFS.find((d) => d.role === name);
  return def ? t(def.labelKey) : name;
};

/**
 * For each role checkbox on this row, return `{ disabled, reason }`.
 * A currently-ON role is never disabled (user must be able to clear it).
 * An OFF role is disabled when enabling it would trigger any SoD pair with a
 * currently-ON role.
 */
export const computeRowSoD = (
  row: any,
  pairs: SodPair[],
  t: (k: string, opts?: any) => string,
): Record<RoleKey, { disabled: boolean; reason: string | null }> => {
  const roleLabel = makeRoleLabel(t);
  const result = {} as Record<RoleKey, { disabled: boolean; reason: string | null }>;
  for (const def of ROLE_DEFS) {
    if (row[def.key]) {
      result[def.key] = { disabled: false, reason: null };
      continue;
    }
    const conflict = pairs.find((p) => {
      const aKey = ROLE_BY_NAME[p.a];
      const bKey = ROLE_BY_NAME[p.b];
      if (p.a === def.role && bKey && row[bKey]) return true;
      if (p.b === def.role && aKey && row[aKey]) return true;
      return false;
    });
    if (conflict) {
      const other = conflict.a === def.role ? conflict.b : conflict.a;
      result[def.key] = {
        disabled: true,
        reason: t("settings.admin.roles.sodConflict", {
          other: roleLabel(other),
          reason: conflict.reason,
        }),
      };
    } else {
      result[def.key] = { disabled: false, reason: null };
    }
  }
  return result;
};
