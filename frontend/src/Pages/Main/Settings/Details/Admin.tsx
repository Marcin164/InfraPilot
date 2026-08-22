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
import { ROLE_DEFS } from "../../../../Constants/roles";
import CardHeader from "../../../../Components/Headers/CardHeader";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import Input from "../../../../Components/Inputs/Input";
import Checkbox from "../../../../Components/Inputs/Checkbox";
import Search from "../../../../Components/Inputs/Search";
import SelectSecondary from "../../../../Components/Inputs/SelectSecondary";
import MainTable from "../../../../Components/Tables/MainTable";
import ConfirmationModal from "../../../../Components/Modals/ConfirmationModal";
import ColorPicker from "../../../../Components/Inputs/ColorPicker";
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

  // Native <input type="color"> steals focus to the OS picker the moment it
  // opens (before the user has actually picked anything), so a blur-driven
  // autosave was saving the *old* color and never firing again once a new
  // one was chosen. Local-state-only edits + one explicit Save button avoids
  // depending on blur timing for any of these fields.
  const isDirty =
    JSON.stringify([...thresholds].sort((a, b) => a.maxDays - b.maxDays)) !==
      JSON.stringify(settingsQuery.data?.lastLogonThresholds ?? DEFAULT_THRESHOLDS) ||
    defaultColor !== (settingsQuery.data?.lastLogonDefaultColor ?? "#8A8A8A");

  const handleSave = () => {
    const sorted = [...thresholds].sort((a, b) => a.maxDays - b.maxDays);
    setThresholds(sorted);
    mutation.mutate({ lastLogonThresholds: sorted, lastLogonDefaultColor: defaultColor });
  };

  const updateThreshold = (idx: number, field: keyof LastLogonThreshold, value: string | number) => {
    setThresholds((prev) => prev.map((t, i) => (i === idx ? { ...t, [field]: value } : t)));
  };

  const removeThreshold = (idx: number) => setThresholds((prev) => prev.filter((_, i) => i !== idx));

  const addThreshold = () => {
    const maxExisting = thresholds.length ? Math.max(...thresholds.map((t) => t.maxDays)) : 0;
    setThresholds((prev) => [...prev, { maxDays: maxExisting + 30, color: "#535353", label: "New" }]);
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
            <ColorPicker
              value={threshold.color}
              onChange={(c) => updateThreshold(idx, "color", c)}
              size={36}
            />

            <input
              type="text"
              value={threshold.label}
              onChange={(e) => updateThreshold(idx, "label", e.target.value)}
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
        <ColorPicker
          value={defaultColor}
          onChange={setDefaultColor}
          size={36}
        />
        <span className="text-[13px] text-[#8A8A8A]">
          {t("settings.admin.colors.defaultRange", { days: thresholds.length ? thresholds[thresholds.length - 1].maxDays : 0 })}
        </span>
      </div>

      <div className="mt-6">
        <ButtonPrimary
          icon={faCheck}
          text={mutation.isPending ? t("common.saving") : t("common.save")}
          onClick={handleSave}
          disabled={mutation.isPending || !isDirty}
        />
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
  const [confirmState, setConfirmState] = useState<{ open: boolean; onConfirm: () => void; message?: string }>({ open: false, onConfirm: () => {} });
  const askConfirm = (onConfirm: () => void, message?: string) => setConfirmState({ open: true, onConfirm, message });

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
                            onClick={() => askConfirm(() => deleteMutation.mutate(group.id), t("settings.admin.groups.deleteConfirm", { name: group.name }))}
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
      <ConfirmationModal
        isModalOpen={confirmState.open}
        handleOnClose={() => setConfirmState((s) => ({ ...s, open: false }))}
        onCancel={() => setConfirmState((s) => ({ ...s, open: false }))}
        onDelete={() => { confirmState.onConfirm(); setConfirmState((s) => ({ ...s, open: false })); }}
        message={confirmState.message}
      />
    </>
  );
};

/* ─────────────────────── Roles Section ──────────────────────── */

const RolesSection = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const authInfo: any = useAuthInfo();
  const currentUserId = authInfo?.user?.metadata?.id;
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const debouncedSearch = useDebounce(searchValue, 400);
  const [confirmState, setConfirmState] = useState<{ open: boolean; onConfirm: () => void; message?: string }>({ open: false, onConfirm: () => {} });
  const askConfirm = (onConfirm: () => void, message?: string) => setConfirmState({ open: true, onConfirm, message });

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
      toast.error(data?.message ?? t("settings.admin.roles.updateFailed"));
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
    cell: (row: any) => (
      <Checkbox
        id={`role-${r.key}-${row.id}`}
        checked={Boolean(row[r.key])}
        disabled={updateMutation.isPending}
        color={r.color}
        onClick={(e) => e.stopPropagation()}
        handleChange={(checked: boolean) =>
          askConfirm(
            () =>
              updateMutation.mutate({
                id: row.id,
                patch: { [r.key]: checked } as Partial<User>,
              }),
            t(
              checked
                ? "settings.admin.roles.confirmGrant"
                : "settings.admin.roles.confirmRevoke",
              { role: t(r.labelKey), user: `${row.name} ${row.surname}` },
            ),
          )
        }
      />
    ),
  }));

  return (
    <div className="bg-white shadow-xl rounded-[10px] p-4">
      <CardHeader text={t("settings.admin.roles.title")} icon={faUserShield} />
      <p className="text-[14px] text-[#7a7a7a] mt-2">
        {t("settings.admin.roles.help")}
      </p>

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
      <ConfirmationModal
        isModalOpen={confirmState.open}
        handleOnClose={() => setConfirmState((s) => ({ ...s, open: false }))}
        onCancel={() => setConfirmState((s) => ({ ...s, open: false }))}
        onDelete={() => { confirmState.onConfirm(); setConfirmState((s) => ({ ...s, open: false })); }}
        message={confirmState.message}
        title={t("common.confirm")}
        confirmText={t("common.confirm")}
        confirmIcon={faCheck}
        confirmClassName="bg-[#2B9AE9]"
      />
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
