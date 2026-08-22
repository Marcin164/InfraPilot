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

