import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthInfo } from "@propelauth/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faTrash,
  faUsers,
  faPen,
  faXmark,
  faCheck,
  faUserShield,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";

import { getUserSettings, updateUserSettings } from "../../../../Services/settings";
import {
  AssignmentGroup,
  createAssignmentGroup,
  deleteAssignmentGroup,
  getAssignmentGroups,
  setAssignmentGroupMembers,
  updateAssignmentGroup,
} from "../../../../Services/assignmentGroups";
import { getUser, getUsers, getUsersTable, updateUser } from "../../../../Services/users";
import { getSodMatrix, type SodPair } from "../../../../Services/rbac";
import CardHeader from "../../../../Components/Headers/CardHeader";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import Input from "../../../../Components/Inputs/Input";
import Checkbox from "../../../../Components/Inputs/Checkbox";
import Search from "../../../../Components/Inputs/Search";
import SelectSecondary from "../../../../Components/Inputs/SelectSecondary";
import MainTable from "../../../../Components/Tables/MainTable";
import { buildQuery } from "../../../../Helpers/queries";
import { useDebounce } from "../../../../Hooks/useDebounce";
import type { LastLogonThreshold, User } from "../../../../Types";

const DEFAULT_THRESHOLDS: LastLogonThreshold[] = [
  { maxDays: 7, color: "#30A712", label: "Recent" },
  { maxDays: 30, color: "#F1C40F", label: "Warning" },
  { maxDays: 90, color: "#F3606E", label: "Inactive" },
];

/* ───────────────────── Last Logon Section ───────────────────── */

const LastLogonSection = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: ["userSettings"],
    queryFn: () => getUserSettings(),
  });

  const [thresholds, setThresholds] = useState<LastLogonThreshold[]>(DEFAULT_THRESHOLDS);
  const [defaultColor, setDefaultColor] = useState("#8A8A8A");

  useEffect(() => {
    if (settingsQuery.data) {
      setThresholds(settingsQuery.data.lastLogonThresholds ?? DEFAULT_THRESHOLDS);
      setDefaultColor(settingsQuery.data.lastLogonDefaultColor ?? "#8A8A8A");
    }
  }, [settingsQuery.data]);

  const mutation = useMutation({
    mutationFn: (data: {
      lastLogonThresholds: LastLogonThreshold[];
      lastLogonDefaultColor: string;
    }) => updateUserSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userSettings"] });
      toast.success(t("toast.success.settingsSaved"));
    },
    onError: () => toast.error(t("toast.error.settingsSave")),
  });

  const save = (next: LastLogonThreshold[], nextDefault: string = defaultColor) => {
    const sorted = [...next].sort((a, b) => a.maxDays - b.maxDays);
    setThresholds(sorted);
    mutation.mutate({ lastLogonThresholds: sorted, lastLogonDefaultColor: nextDefault });
  };

  const updateThreshold = (idx: number, field: keyof LastLogonThreshold, value: string | number) => {
    setThresholds((prev) => prev.map((t, i) => (i === idx ? { ...t, [field]: value } : t)));
  };

  const removeThreshold = (idx: number) => save(thresholds.filter((_, i) => i !== idx));

  const addThreshold = () => {
    const maxExisting = thresholds.length ? Math.max(...thresholds.map((t) => t.maxDays)) : 0;
    save([...thresholds, { maxDays: maxExisting + 30, color: "#535353", label: "New" }]);
  };

  const getDaysSinceText = (maxDays: number, idx: number) => {
    const prev = idx > 0 ? thresholds[idx - 1].maxDays : 0;
    return t("settings.admin.colors.range", { from: prev, to: maxDays });
  };

  return (
    <div className="bg-white shadow-xl rounded-[10px] p-6">
      <h2 className="text-[20px] font-bold text-[#3C3C3C] pb-1">{t("settings.admin.colors.title")}</h2>
      <p className="text-[14px] text-[#535353] pb-4">
        {t("settings.admin.colors.help")}
      </p>

      <div className="space-y-2">
        {thresholds.map((threshold, idx) => (
          <div
            key={idx}
            className="flex flex-wrap items-center gap-3 rounded-[10px] border border-[#E0E0E0] bg-[#FAFAFA] px-4 py-3"
          >
            <div className="relative">
              <div
                className="h-[36px] w-[36px] rounded-[8px] border border-[#E0E0E0] cursor-pointer"
                style={{ backgroundColor: threshold.color }}
              />
              <input
                type="color"
                value={threshold.color}
                onChange={(e) => updateThreshold(idx, "color", e.target.value)}
                onBlur={() => save(thresholds)}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </div>

            <input
              type="text"
              value={threshold.label}
              onChange={(e) => updateThreshold(idx, "label", e.target.value)}
              onBlur={() => save(thresholds)}
              className="h-[36px] w-[120px] rounded-[8px] border border-[#535353] px-2 text-[14px] font-bold text-[#3C3C3C] outline-none focus:border-[#2B9AE9]"
              placeholder={t("settings.admin.colors.label")}
            />

            <div className="flex items-center gap-2">
              <span className="text-[13px] text-[#535353]">{t("settings.admin.colors.within")}</span>
              <input
                type="number"
                min={1}
                value={threshold.maxDays}
                onChange={(e) => updateThreshold(idx, "maxDays", parseInt(e.target.value) || 1)}
                onBlur={() => save(thresholds)}
                className="h-[36px] w-[70px] rounded-[8px] border border-[#535353] px-2 text-center text-[14px] font-bold text-[#3C3C3C] outline-none focus:border-[#2B9AE9]"
              />
              <span className="text-[13px] text-[#535353]">{t("settings.admin.colors.days")}</span>
            </div>

            <span className="text-[12px] text-[#8A8A8A] ml-auto hidden sm:inline">
              {getDaysSinceText(threshold.maxDays, idx)}
            </span>

            <button
              type="button"
              onClick={() => removeThreshold(idx)}
              className="flex h-[28px] w-[28px] items-center justify-center rounded-[6px] text-[14px] text-[#F3606E] hover:bg-[#FDE8EA] cursor-pointer"
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addThreshold}
        className="mt-3 flex items-center gap-2 rounded-[10px] border border-dashed border-[#535353] px-4 py-2 text-[14px] font-bold text-[#535353] hover:bg-[#F0F0F0] cursor-pointer transition"
      >
        <FontAwesomeIcon icon={faPlus} />
        {t("settings.admin.colors.addThreshold")}
      </button>

      <div className="mt-6 flex items-center gap-3">
        <span className="text-[14px] font-bold text-[#3C3C3C]">
          {t("settings.admin.colors.defaultLabel")}
        </span>
        <div className="relative">
          <div
            className="h-[36px] w-[36px] rounded-[8px] border border-[#E0E0E0] cursor-pointer"
            style={{ backgroundColor: defaultColor }}
          />
          <input
            type="color"
            value={defaultColor}
            onChange={(e) => setDefaultColor(e.target.value)}
            onBlur={() => save(thresholds, defaultColor)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </div>
        <span className="text-[13px] text-[#8A8A8A]">
          {t("settings.admin.colors.defaultRange", { days: thresholds.length ? thresholds[thresholds.length - 1].maxDays : 0 })}
        </span>
      </div>

      <div className="mt-6">
        <h3 className="text-[16px] font-bold text-[#3C3C3C] pb-2">{t("settings.admin.colors.preview")}</h3>
        <div className="flex flex-wrap gap-2">
          {thresholds.map((t, idx) => (
            <div
              key={idx}
              className="rounded-[10px] px-4 py-2 text-center text-[13px] font-bold text-white"
              style={{ backgroundColor: t.color }}
            >
              {t.label} ({getDaysSinceText(t.maxDays, idx)})
            </div>
          ))}
          <div
            className="rounded-[10px] px-4 py-2 text-center text-[13px] font-bold text-white"
            style={{ backgroundColor: defaultColor }}
          >
            {t("settings.admin.colors.default")} ({t("settings.admin.colors.defaultRange", { days: thresholds.length ? thresholds[thresholds.length - 1].maxDays : 0 })})
          </div>
        </div>
      </div>
    </div>
  );
};

/* ───────────────── Assignment Groups Section ────────────────── */

const AssignmentGroupsSection = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const authInfo: any = useAuthInfo();
  const currentUserId = authInfo?.user?.metadata?.id;

  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const currentUserQuery = useQuery({
    queryKey: ["current-user", currentUserId],
    queryFn: () => getUser(currentUserId),
    enabled: Boolean(currentUserId),
  });

  const isAdmin = Boolean(currentUserQuery.data?.isAdmin);

  const groupsQuery = useQuery({
    queryKey: ["assignment-groups"],
    queryFn: getAssignmentGroups,
  });

  const usersQuery = useQuery({
    queryKey: ["users-all"],
    queryFn: getUsers,
  });

  const userOptions = useMemo(
    () =>
      (usersQuery.data ?? []).map((u: User) => ({
        value: u.id,
        label: `${u.name} ${u.surname}${u.email ? ` (${u.email})` : ""}`,
      })),
    [usersQuery.data],
  );

  const invalidateGroups = () =>
    queryClient.invalidateQueries({ queryKey: ["assignment-groups"] });

  const createMutation = useMutation({
    mutationFn: () =>
      createAssignmentGroup({
        name: newName.trim(),
        description: newDescription.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success(t("toast.success.assignmentGroupCreated"));
      setNewName("");
      setNewDescription("");
      invalidateGroups();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("settings.admin.groups.createGroupFailed")),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name, description }: { id: string; name?: string; description?: string }) =>
      updateAssignmentGroup(id, { name, description }),
    onSuccess: () => {
      toast.success(t("toast.success.groupUpdated"));
      setEditingId(null);
      invalidateGroups();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("settings.admin.groups.updateGroupFailed")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAssignmentGroup(id),
    onSuccess: () => {
      toast.success(t("toast.success.groupDeleted"));
      invalidateGroups();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("settings.admin.groups.deleteGroupFailed")),
  });

  const setMembersMutation = useMutation({
    mutationFn: ({ id, userIds }: { id: string; userIds: string[] }) =>
      setAssignmentGroupMembers(id, userIds),
    onSuccess: () => {
      toast.success(t("toast.success.membersUpdated"));
      invalidateGroups();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("settings.admin.groups.updateMembersFailed")),
  });

  const startEdit = (group: AssignmentGroup) => {
    setEditingId(group.id);
    setEditName(group.name);
    setEditDescription(group.description ?? "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditDescription("");
  };

  const handleCreate = () => {
    if (!newName.trim()) {
      toast.error(t("toast.error.nameRequired"));
      return;
    }
    createMutation.mutate();
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) {
      toast.error(t("toast.error.nameRequired"));
      return;
    }
    updateMutation.mutate({ id, name: editName.trim(), description: editDescription.trim() || undefined });
  };

  const handleMembersChange = (groupId: string, options: any) => {
    const userIds = (options ?? []).map((o: any) => o.value);
    setMembersMutation.mutate({ id: groupId, userIds });
  };

  if (currentUserQuery.isLoading || groupsQuery.isLoading) {
    return (
      <div className="bg-white shadow-xl rounded-[10px] p-4">{t("common.loading2")}</div>
    );
  }

  return (
    <>
      {isAdmin && (
        <div className="bg-white shadow-xl rounded-[10px] p-4">
          <CardHeader text={t("settings.assignmentGroups.create")} icon={faPlus} />
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Name" value={newName} onChange={(e: any) => setNewName(e.target.value)} />
            <Input
              label="Description"
              value={newDescription}
              onChange={(e: any) => setNewDescription(e.target.value)}
            />
          </div>
          <div className="mt-4">
            <ButtonPrimary icon={faPlus} text={t("common.create")} onClick={handleCreate} disabled={createMutation.isPending} />
          </div>
        </div>
      )}

      <div className="bg-white shadow-xl rounded-[10px] p-4">
        <CardHeader text={t("settings.assignmentGroups.title")} icon={faUsers} />

        {!isAdmin && (
          <p className="text-[14px] text-[#7a7a7a] mt-2">
            Read-only view. Only administrators can manage assignment groups.
          </p>
        )}

        <div className="mt-4 space-y-4 max-h-[600px] overflow-y-auto pr-1">
          {(groupsQuery.data ?? []).length === 0 && (
            <div className="text-[14px] text-[#7a7a7a]">No assignment groups yet.</div>
          )}

          {(groupsQuery.data ?? []).map((group) => {
            const memberValues = (group.members ?? []).map((m) => ({
              value: m.id,
              label: `${m.name} ${m.surname}${m.email ? ` (${m.email})` : ""}`,
            }));
            const isEditing = editingId === group.id;

            return (
              <div key={group.id} className="border border-[#E6E6E6] rounded-[10px] p-4">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="flex-1 min-w-[140px]">
                    {isEditing ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Name" value={editName} onChange={(e: any) => setEditName(e.target.value)} />
                        <Input
                          label="Description"
                          value={editDescription}
                          onChange={(e: any) => setEditDescription(e.target.value)}
                        />
                      </div>
                    ) : (
                      <>
                        <div className="text-[18px] font-semibold text-[#3C3C3C]">{group.name}</div>
                        {group.description && (
                          <div className="text-[14px] text-[#7a7a7a]">{group.description}</div>
                        )}
                        <div className="text-[12px] text-[#9a9a9a] mt-1">
                          {(group.members ?? []).length} member
                          {(group.members ?? []).length === 1 ? "" : "s"}
                        </div>
                      </>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="flex gap-2 shrink-0">
                      {isEditing ? (
                        <>
                          <ButtonPrimary
                            icon={faCheck}
                            text={t("common.save")}
                            onClick={() => handleSaveEdit(group.id)}
                            disabled={updateMutation.isPending}
                          />
                          <ButtonPrimary icon={faXmark} text={t("common.cancel")} onClick={cancelEdit} />
                        </>
                      ) : (
                        <>
                          <ButtonPrimary icon={faPen} text={t("common.edit")} onClick={() => startEdit(group)} />
                          <ButtonPrimary
                            icon={faTrash}
                            text={t("common.delete")}
                            onClick={() => {
                              if (window.confirm(t("settings.admin.groups.deleteConfirm", { name: group.name }))) {
                                deleteMutation.mutate(group.id);
                              }
                            }}
                          />
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  {isAdmin ? (
                    <SelectSecondary
                      label="Members"
                      options={userOptions}
                      value={memberValues}
                      isMulti
                      isClearable={false}
                      onSelect={(opts: any) => handleMembersChange(group.id, opts)}
                    />
                  ) : (
                    <div>
                      <div className="font-bold text-[#3C3C3C] mb-1">Members</div>
                      <div className="flex flex-wrap gap-2">
                        {(group.members ?? []).length === 0 && (
                          <span className="text-[14px] text-[#9a9a9a]">No members</span>
                        )}
                        {(group.members ?? []).map((m) => (
                          <span
                            key={m.id}
                            className="inline-flex items-center gap-1 bg-[#F0F7FE] text-[#2B9AE9] text-[13px] font-medium rounded-full px-3 py-1"
                          >
                            <FontAwesomeIcon icon={faUsers} />
                            {m.name} {m.surname}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

/* ─────────────────────── Roles Section ──────────────────────── */

type RoleKey =
  | "isAdmin"
  | "isApprover"
  | "isAuditor"
  | "isCompliance"
  | "isHelpdesk"
  | "isDpo";

const ROLE_DEFS: { key: RoleKey; labelKey: string; color: string; role: string }[] = [
  { key: "isAdmin", labelKey: "settings.admin.roles.role.admin", color: "#F3606E", role: "admin" },
  { key: "isApprover", labelKey: "settings.admin.roles.role.approver", color: "#2B9AE9", role: "approver" },
  { key: "isAuditor", labelKey: "settings.admin.roles.role.auditor", color: "#8E44AD", role: "auditor" },
  { key: "isCompliance", labelKey: "settings.admin.roles.role.compliance", color: "#16A085", role: "compliance" },
  { key: "isHelpdesk", labelKey: "settings.admin.roles.role.helpdesk", color: "#F1C40F", role: "helpdesk" },
  { key: "isDpo", labelKey: "settings.admin.roles.role.dpo", color: "#E67E22", role: "dpo" },
];

const ROLE_BY_NAME: Record<string, RoleKey> = ROLE_DEFS.reduce(
  (acc, def) => ({ ...acc, [def.role]: def.key }),
  {} as Record<string, RoleKey>,
);

const makeRoleLabel = (t: (k: string) => string) => (name: string) => {
  const def = ROLE_DEFS.find((d) => d.role === name);
  return def ? t(def.labelKey) : name;
};

/**
 * For each role checkbox on this row, return `{ disabled, reason }`.
 * A currently-ON role is never disabled (user must be able to clear it).
 * An OFF role is disabled when enabling it would trigger any SoD pair with a
 * currently-ON role.
 */
const computeRowSoD = (
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

const RolesSection = () => {
  const { t } = useTranslation();
  const roleLabel = makeRoleLabel(t);
  const queryClient = useQueryClient();
  const authInfo: any = useAuthInfo();
  const currentUserId = authInfo?.user?.metadata?.id;
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const debouncedSearch = useDebounce(searchValue, 400);

  const currentUserQuery = useQuery({
    queryKey: ["current-user", currentUserId],
    queryFn: () => getUser(currentUserId),
    enabled: Boolean(currentUserId),
  });

  const isAdmin = Boolean(currentUserQuery.data?.isAdmin);

  const queryString = buildQuery({
    search: debouncedSearch,
    page,
    limit,
  });

  const usersQuery = useQuery({
    queryKey: ["users-roles-table", debouncedSearch, page, limit],
    queryFn: () => getUsersTable(queryString),
    enabled: isAdmin,
    placeholderData: (prev) => prev,
  });

  const sodQuery = useQuery({
    queryKey: ["rbac-sod"],
    queryFn: getSodMatrix,
    enabled: isAdmin,
    staleTime: 5 * 60 * 1000,
  });

  const sodPairs = sodQuery.data?.pairs ?? [];

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<User> }) =>
      updateUser(patch, id),
    onSuccess: () => {
      toast.success(t("toast.success.rolesUpdated"));
      queryClient.invalidateQueries({ queryKey: ["users-roles-table"] });
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
    },
    onError: (err: any) => {
      const data = err?.response?.data;
      if (data?.conflicts && Array.isArray(data.conflicts)) {
        const lines = data.conflicts
          .map(
            (c: any) =>
              `${roleLabel(c.a)} ↔ ${roleLabel(c.b)}: ${c.reason}`,
          )
          .join("\n");
        toast.error(t("settings.admin.roles.sodViolation", { lines }));
      } else {
        toast.error(data?.message ?? t("settings.admin.roles.updateFailed"));
      }
    },
  });

  if (!isAdmin) return null;

  const userColumn = {
    id: "user",
    name: t("settings.admin.roles.user"),
    cell: (row: any) => (
      <div className="py-1">
        <div className="font-bold text-[#3C3C3C]">
          {row.name} {row.surname}
        </div>
        <div className="text-[12px] text-[#9a9a9a]">{row.email ?? row.username}</div>
      </div>
    ),
    grow: 2,
  };

  const roleColumns = ROLE_DEFS.map((r) => ({
    id: r.key,
    name: t(r.labelKey),
    center: true,
    width: "110px",
    cell: (row: any) => {
      const sod = computeRowSoD(row, sodPairs, t)[r.key];
      const disabled = updateMutation.isPending || sod.disabled;
      return (
        <div title={sod.reason ?? undefined}>
          <Checkbox
            id={`role-${r.key}-${row.id}`}
            checked={Boolean(row[r.key])}
            disabled={disabled}
            color={r.color}
            onClick={(e) => e.stopPropagation()}
            handleChange={(checked: boolean) =>
              updateMutation.mutate({
                id: row.id,
                patch: { [r.key]: checked } as Partial<User>,
              })
            }
          />
        </div>
      );
    },
  }));

  return (
    <div className="bg-white shadow-xl rounded-[10px] p-4">
      <CardHeader text={t("settings.admin.roles.title")} icon={faUserShield} />
      <p className="text-[14px] text-[#7a7a7a] mt-2">
        {t("settings.admin.roles.help")}
      </p>

      {sodPairs.length > 0 && (
        <div className="mt-3 rounded-[8px] border border-[#E0E0E0] bg-[#FAFAFA] p-3">
          <div className="text-[13px] font-bold text-[#3C3C3C] mb-1">
            {t("settings.admin.roles.sod")}
          </div>
          <div className="flex flex-wrap gap-2">
            {sodPairs.map((p, idx) => (
              <span
                key={idx}
                title={p.reason}
                className="inline-flex items-center gap-1 rounded-full bg-white border border-[#E0E0E0] px-2 py-0.5 text-[12px] text-[#535353]"
              >
                {roleLabel(p.a)} <span className="text-[#9a9a9a]">⊥</span> {roleLabel(p.b)}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4">
        <Search
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setSearchValue(e.target.value);
            setPage(1);
          }}
          className="w-full md:w-[400px]"
        />
      </div>

      <div className="mt-4">
        <MainTable
          columns={[userColumn, ...roleColumns]}
          data={usersQuery.data?.data ?? []}
          paginationServer
          paginationTotalRows={usersQuery.data?.total ?? 0}
          onChangePage={setPage}
          onChangeRowsPerPage={(newLimit: number) => {
            setLimit(newLimit);
            setPage(1);
          }}
          progressPending={usersQuery.isFetching}
        />
      </div>
    </div>
  );
};

/* ──────────────────────── Admin Page ────────────────────────── */

const Admin = () => {
  return (
    <div className="space-y-4 m-4">
      <LastLogonSection />
      <RolesSection />
      <AssignmentGroupsSection />
    </div>
  );
};

export default Admin;
