import { useEffect, useMemo, useState } from "react";
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
import { getUser, getUsers, updateUser } from "../../../../Services/users";
import CardHeader from "../../../../Components/Headers/CardHeader";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import Input from "../../../../Components/Inputs/Input";
import SelectSecondary from "../../../../Components/Inputs/SelectSecondary";
import type { LastLogonThreshold, User } from "../../../../Types";

const DEFAULT_THRESHOLDS: LastLogonThreshold[] = [
  { maxDays: 7, color: "#30A712", label: "Recent" },
  { maxDays: 30, color: "#F1C40F", label: "Warning" },
  { maxDays: 90, color: "#F3606E", label: "Inactive" },
];

/* ───────────────────── Last Logon Section ───────────────────── */

const LastLogonSection = () => {
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
      toast.success("Settings saved");
    },
    onError: () => toast.error("Failed to save settings"),
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
    return prev === 0 ? `0 – ${maxDays} days` : `${prev} – ${maxDays} days`;
  };

  return (
    <div className="bg-white shadow-xl rounded-[10px] p-6">
      <h2 className="text-[20px] font-bold text-[#3C3C3C] pb-1">Last Logon Colors</h2>
      <p className="text-[14px] text-[#535353] pb-4">
        Configure how the Last Logon column in the Users table is color-coded based on how many days
        ago a user last logged in. Thresholds are automatically sorted by number of days.
      </p>

      <div className="space-y-2">
        {thresholds.map((threshold, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 rounded-[10px] border border-[#E0E0E0] bg-[#FAFAFA] px-4 py-3"
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
              placeholder="Label"
            />

            <div className="flex items-center gap-2">
              <span className="text-[13px] text-[#535353]">Within</span>
              <input
                type="number"
                min={1}
                value={threshold.maxDays}
                onChange={(e) => updateThreshold(idx, "maxDays", parseInt(e.target.value) || 1)}
                onBlur={() => save(thresholds)}
                className="h-[36px] w-[70px] rounded-[8px] border border-[#535353] px-2 text-center text-[14px] font-bold text-[#3C3C3C] outline-none focus:border-[#2B9AE9]"
              />
              <span className="text-[13px] text-[#535353]">days</span>
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
        Add threshold
      </button>

      <div className="mt-6 flex items-center gap-3">
        <span className="text-[14px] font-bold text-[#3C3C3C]">
          Default color (older than all thresholds or never logged in):
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
          {`> ${thresholds.length ? thresholds[thresholds.length - 1].maxDays : 0} days / N/A`}
        </span>
      </div>

      <div className="mt-6">
        <h3 className="text-[16px] font-bold text-[#3C3C3C] pb-2">Preview</h3>
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
            Default ({`> ${thresholds.length ? thresholds[thresholds.length - 1].maxDays : 0} days`})
          </div>
        </div>
      </div>
    </div>
  );
};

/* ───────────────── Assignment Groups Section ────────────────── */

const AssignmentGroupsSection = () => {
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
      toast.success("Assignment group created");
      setNewName("");
      setNewDescription("");
      invalidateGroups();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? "Failed to create group"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name, description }: { id: string; name?: string; description?: string }) =>
      updateAssignmentGroup(id, { name, description }),
    onSuccess: () => {
      toast.success("Group updated");
      setEditingId(null);
      invalidateGroups();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? "Failed to update group"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAssignmentGroup(id),
    onSuccess: () => {
      toast.success("Group deleted");
      invalidateGroups();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? "Failed to delete group"),
  });

  const setMembersMutation = useMutation({
    mutationFn: ({ id, userIds }: { id: string; userIds: string[] }) =>
      setAssignmentGroupMembers(id, userIds),
    onSuccess: () => {
      toast.success("Members updated");
      invalidateGroups();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? "Failed to update members"),
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
      toast.error("Name is required");
      return;
    }
    createMutation.mutate();
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) {
      toast.error("Name is required");
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
      <div className="bg-white shadow-xl rounded-[10px] p-4">Loading...</div>
    );
  }

  return (
    <>
      {isAdmin && (
        <div className="bg-white shadow-xl rounded-[10px] p-4">
          <CardHeader text="Create Assignment Group" icon={faPlus} />
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Name" value={newName} onChange={(e: any) => setNewName(e.target.value)} />
            <Input
              label="Description"
              value={newDescription}
              onChange={(e: any) => setNewDescription(e.target.value)}
            />
          </div>
          <div className="mt-4">
            <ButtonPrimary icon={faPlus} text="Create" onClick={handleCreate} disabled={createMutation.isPending} />
          </div>
        </div>
      )}

      <div className="bg-white shadow-xl rounded-[10px] p-4">
        <CardHeader text="Assignment Groups" icon={faUsers} />

        {!isAdmin && (
          <p className="text-[14px] text-[#7a7a7a] mt-2">
            Read-only view. Only administrators can manage assignment groups.
          </p>
        )}

        <div className="mt-4 space-y-4">
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
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
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
                            text="Save"
                            onClick={() => handleSaveEdit(group.id)}
                            disabled={updateMutation.isPending}
                          />
                          <ButtonPrimary icon={faXmark} text="Cancel" onClick={cancelEdit} />
                        </>
                      ) : (
                        <>
                          <ButtonPrimary icon={faPen} text="Edit" onClick={() => startEdit(group)} />
                          <ButtonPrimary
                            icon={faTrash}
                            text="Delete"
                            onClick={() => {
                              if (window.confirm(`Delete assignment group "${group.name}"?`)) {
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

const ROLE_DEFS: { key: RoleKey; label: string; color: string }[] = [
  { key: "isAdmin", label: "Admin", color: "#F3606E" },
  { key: "isApprover", label: "Approver", color: "#2B9AE9" },
  { key: "isAuditor", label: "Auditor", color: "#8E44AD" },
  { key: "isCompliance", label: "Compliance", color: "#16A085" },
  { key: "isHelpdesk", label: "Helpdesk", color: "#F1C40F" },
  { key: "isDpo", label: "DPO", color: "#E67E22" },
];

const RolesSection = () => {
  const queryClient = useQueryClient();
  const authInfo: any = useAuthInfo();
  const currentUserId = authInfo?.user?.metadata?.id;
  const [filter, setFilter] = useState("");

  const currentUserQuery = useQuery({
    queryKey: ["current-user", currentUserId],
    queryFn: () => getUser(currentUserId),
    enabled: Boolean(currentUserId),
  });

  const usersQuery = useQuery({
    queryKey: ["users-all"],
    queryFn: getUsers,
  });

  const isAdmin = Boolean(currentUserQuery.data?.isAdmin);

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<User> }) =>
      updateUser(patch, id),
    onSuccess: () => {
      toast.success("Roles updated");
      queryClient.invalidateQueries({ queryKey: ["users-all"] });
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? "Failed to update roles"),
  });

  const filteredUsers = useMemo(() => {
    const term = filter.trim().toLowerCase();
    const list = usersQuery.data ?? [];
    if (!term) return list;
    return list.filter((u: User) =>
      [u.name, u.surname, u.email, u.username]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term)),
    );
  }, [usersQuery.data, filter]);

  if (!isAdmin) return null;

  return (
    <div className="bg-white shadow-xl rounded-[10px] p-4">
      <CardHeader text="Role assignment" icon={faUserShield} />
      <p className="text-[14px] text-[#7a7a7a] mt-2">
        Grant compliance roles per user. Admins always pass any role check.
      </p>

      <div className="mt-4">
        <Input
          label="Search"
          value={filter}
          onChange={(e: any) => setFilter(e.target.value)}
        />
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-[14px]">
          <thead>
            <tr className="text-left text-[#535353] border-b border-[#E6E6E6]">
              <th className="py-2 pr-4">User</th>
              {ROLE_DEFS.map((r) => (
                <th key={r.key} className="py-2 px-2 text-center">
                  {r.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredUsers.slice(0, 100).map((u: User) => (
              <tr key={u.id} className="border-b border-[#F0F0F0]">
                <td className="py-2 pr-4">
                  <div className="font-bold text-[#3C3C3C]">
                    {u.name} {u.surname}
                  </div>
                  <div className="text-[12px] text-[#9a9a9a]">{u.email}</div>
                </td>
                {ROLE_DEFS.map((r) => {
                  const checked = Boolean((u as any)[r.key]);
                  return (
                    <td key={r.key} className="py-2 px-2 text-center">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={updateMutation.isPending}
                        onChange={(e) =>
                          updateMutation.mutate({
                            id: u.id,
                            patch: { [r.key]: e.target.checked } as Partial<User>,
                          })
                        }
                        className="cursor-pointer h-4 w-4 accent-[#2B9AE9]"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length > 100 && (
          <div className="text-[12px] text-[#9a9a9a] mt-2">
            Showing first 100 of {filteredUsers.length} users — refine search.
          </div>
        )}
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
