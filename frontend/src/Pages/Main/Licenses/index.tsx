import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faKey,
  faPlus,
  faTrash,
  faXmark,
  faCheck,
  faListCheck,
} from "@fortawesome/free-solid-svg-icons";
import PageMotion from "../../../Components/PageMotion/PageMotion";
import ButtonPrimary from "../../../Components/Buttons/ButtonPrimary";
import Input from "../../../Components/Inputs/Input";
import SelectSecondary from "../../../Components/Inputs/SelectSecondary";
import Search from "../../../Components/Inputs/Search";
import MainTable from "../../../Components/Tables/MainTable";
import DataLoader from "../../../Components/Loaders/DataLoader";
import TableSettings from "../../../Components/TableSettings";
import { getUserSettings } from "../../../Services/settings";
import {
  getLicenses,
  createLicense,
  updateLicense,
  deleteLicense,
  getLicenseAssignments,
  createAssignment,
  deleteAssignment,
  type SoftwareLicense,
  type CreateLicensePayload,
  type SoftwareLicenseAssignment,
} from "../../../Services/licenses";
import { getUsers } from "../../../Services/users";
import { getDevicesOptions } from "../../../Services/devices";
import ConfirmationModal from "../../../Components/Modals/ConfirmationModal";

const LICENSE_TYPES = ["perpetual", "subscription", "volume", "concurrent"] as const;

const typeColor: Record<string, string> = {
  perpetual: "#2B9AE9",
  subscription: "#8E44AD",
  volume: "#30A712",
  concurrent: "#F1C40F",
};

const expiryStatus = (
  expiresAt: string | null,
): { label: string; color: string } | null => {
  if (!expiresAt) return null;
  const days = Math.ceil(
    (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
  if (days < 0) return { label: `Expired ${-days}d ago`, color: "#F3606E" };
  if (days <= 30) return { label: `Expires in ${days}d`, color: "#F3606E" };
  if (days <= 90) return { label: `Expires in ${days}d`, color: "#F1C40F" };
  return { label: `Expires in ${days}d`, color: "#30A712" };
};

const EMPTY_FORM: CreateLicensePayload = {
  name: "",
  publisher: "",
  licenseType: "perpetual",
  totalSeats: undefined,
  licenseKey: "",
  purchaseDate: "",
  expiresAt: "",
  cost: "",
  currency: "USD",
  vendor: "",
  notes: "",
};

type ModalMode = "create" | "edit";

const LicenseModal = ({
  mode,
  initial,
  onClose,
  onSave,
  onDelete,
  saving,
  deleting,
}: {
  mode: ModalMode;
  initial: CreateLicensePayload & { id?: string };
  onClose: () => void;
  onSave: (data: CreateLicensePayload & { id?: string }) => void;
  onDelete?: () => void;
  saving: boolean;
  deleting?: boolean;
}) => {
  const { t } = useTranslation();
  const [form, setForm] = useState(initial);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const set = (key: keyof typeof form, value: any) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-[12px] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F0F0]">
          <div className="flex items-center gap-2 font-bold text-[16px]">
            <FontAwesomeIcon icon={faKey} className="text-[#2B9AE9]" />
            {mode === "create" ? t("licenses.create") : t("licenses.edit")}
          </div>
          <button onClick={onClose} className="text-[#9a9a9a] hover:text-[#3C3C3C]">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
        <div className="px-6 py-4 flex flex-col">
          <Input
            label={`${t("licenses.fields.name")} *`}
            value={form.name}
            onChange={(e: any) => set("name", e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t("licenses.fields.publisher")}
              value={form.publisher ?? ""}
              onChange={(e: any) => set("publisher", e.target.value)}
            />
            <Input
              label={t("licenses.fields.vendor")}
              value={form.vendor ?? ""}
              onChange={(e: any) => set("vendor", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <SelectSecondary
              label={t("licenses.fields.type")}
              options={LICENSE_TYPES.map((lt) => ({ value: lt, label: lt.charAt(0).toUpperCase() + lt.slice(1) }))}
              value={{ value: form.licenseType ?? "perpetual", label: ((form.licenseType ?? "perpetual") as string).charAt(0).toUpperCase() + ((form.licenseType ?? "perpetual") as string).slice(1) }}
              onSelect={(opt: any) => set("licenseType", opt.value)}
            />
            <Input
              label={t("licenses.fields.seats")}
              type="number"
              value={form.totalSeats ?? ""}
              placeholder="Unlimited"
              onChange={(e: any) =>
                set("totalSeats", e.target.value ? Number(e.target.value) : undefined)
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t("licenses.fields.purchaseDate")}
              type="date"
              value={form.purchaseDate ?? ""}
              onChange={(e: any) => set("purchaseDate", e.target.value)}
            />
            <Input
              label={t("licenses.fields.expiresAt")}
              type="date"
              value={form.expiresAt ?? ""}
              onChange={(e: any) => set("expiresAt", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t("licenses.fields.cost")}
              type="number"
              value={form.cost ?? ""}
              onChange={(e: any) => set("cost", e.target.value)}
            />
            <Input
              label={t("licenses.fields.currency")}
              value={form.currency ?? ""}
              onChange={(e: any) => set("currency", e.target.value)}
            />
          </div>
          <Input
            label={t("licenses.fields.licenseKey")}
            value={form.licenseKey ?? ""}
            inputClassName="font-mono"
            onChange={(e: any) => set("licenseKey", e.target.value)}
          />
          <div className="pt-2">
            <label className="font-bold text-[#3C3C3C]">{t("licenses.fields.notes")}</label>
            <textarea
              rows={2}
              className="w-full mt-[6px] border border-[#535353] bg-white text-[16px] font-bold block rounded-[10px] px-3 py-2 resize-none"
              value={form.notes ?? ""}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#F0F0F0]">
          <div>
            {mode === "edit" && onDelete && (
              <ButtonPrimary
                icon={faTrash}
                text={deleting ? t("common.delete") + "..." : t("common.delete")}
                className="bg-[#F3606E] hover:bg-[#e04e5c]"
                onClick={() => setConfirmOpen(true)}
                disabled={deleting || saving}
              />
            )}
          </div>
          <div className="flex gap-2">
            <ButtonPrimary icon={faXmark} text={t("common.cancel")} color="white" onClick={onClose} />
            <ButtonPrimary
              icon={faCheck}
              text={saving ? t("common.saving") : t("common.save")}
              onClick={() => onSave(form)}
              disabled={saving || deleting || !form.name.trim()}
            />
          </div>
        </div>
      </div>
      {confirmOpen && (
        <ConfirmationModal
          isModalOpen={confirmOpen}
          handleOnClose={() => setConfirmOpen(false)}
          onCancel={() => setConfirmOpen(false)}
          onDelete={() => { onDelete?.(); setConfirmOpen(false); }}
        />
      )}
    </div>
  );
};

const AssignmentsPanel = ({
  license,
  onClose,
}: {
  license: SoftwareLicense;
  onClose: () => void;
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [targetType, setTargetType] = useState<"device" | "user">("device");
  const [selected, setSelected] = useState<{ value: string; label: string } | null>(null);

  const assignmentsQuery = useQuery({
    queryKey: ["license-assignments", license.id],
    queryFn: () => getLicenseAssignments(license.id),
  });

  const devicesQuery = useQuery({
    queryKey: ["devices-options"],
    queryFn: getDevicesOptions,
  });

  const usersQuery = useQuery({
    queryKey: ["users-all"],
    queryFn: getUsers,
  });

  const assignMutation = useMutation({
    mutationFn: (payload: { licenseId: string; deviceId?: string; userId?: string }) =>
      createAssignment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["license-assignments", license.id] });
      queryClient.invalidateQueries({ queryKey: ["licenses"] });
      toast.success(t("licenses.assignments.added"));
      setSelected(null);
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("licenses.assignments.addFailed")),
  });

  const unassignMutation = useMutation({
    mutationFn: (assignmentId: string) => deleteAssignment(assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["license-assignments", license.id] });
      queryClient.invalidateQueries({ queryKey: ["licenses"] });
      toast.success(t("licenses.assignments.removed"));
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("licenses.assignments.removeFailed")),
  });

  const deviceOptions = (devicesQuery.data ?? []).map((d) => ({
    value: d.id,
    label: [d.manufacturer, d.model, d.serialnumber].filter(Boolean).join(" — "),
  }));

  const userOptions = (usersQuery.data ?? []).map((u: any) => ({
    value: u.id,
    label: [u.name, u.surname].filter(Boolean).join(" ") || u.username || u.email || u.id,
  }));

  const handleAssign = () => {
    if (!selected) return;
    assignMutation.mutate({
      licenseId: license.id,
      ...(targetType === "device" ? { deviceId: selected.value } : { userId: selected.value }),
    });
  };

  const assignments: SoftwareLicenseAssignment[] = assignmentsQuery.data ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-[12px] shadow-2xl w-full max-w-lg min-h-[70vh] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F0F0]">
          <div className="font-bold text-[15px]">
            <FontAwesomeIcon icon={faListCheck} className="text-[#2B9AE9] mr-2" />
            {t("licenses.assignments.title")} — {license.name}
          </div>
          <button onClick={onClose} className="text-[#9a9a9a] hover:text-[#3C3C3C]">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {/* Add assignment form */}
        <div className="px-6 pt-4 pb-3 border-b border-[#F0F0F0]">
          <div className="text-[13px] font-semibold text-[#3C3C3C] mb-2">
            {t("licenses.assignments.add")}
          </div>
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => { setTargetType("device"); setSelected(null); }}
              className={`px-3 py-1 rounded-full text-[12px] font-semibold border transition-colors ${
                targetType === "device"
                  ? "bg-[#2B9AE9] text-white border-[#2B9AE9]"
                  : "bg-white text-[#9a9a9a] border-[#E0E0E0] hover:border-[#2B9AE9]"
              }`}
            >
              {t("licenses.assignments.device")}
            </button>
            <button
              onClick={() => { setTargetType("user"); setSelected(null); }}
              className={`px-3 py-1 rounded-full text-[12px] font-semibold border transition-colors ${
                targetType === "user"
                  ? "bg-[#2B9AE9] text-white border-[#2B9AE9]"
                  : "bg-white text-[#9a9a9a] border-[#E0E0E0] hover:border-[#2B9AE9]"
              }`}
            >
              {t("licenses.assignments.user")}
            </button>
          </div>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <SelectSecondary
                options={targetType === "device" ? deviceOptions : userOptions}
                value={selected}
                onSelect={(opt: any) => setSelected(opt)}
                placeholder={targetType === "device"
                  ? t("licenses.assignments.selectDevice")
                  : t("licenses.assignments.selectUser")}
              />
            </div>
            <ButtonPrimary
              icon={faCheck}
              text={assignMutation.isPending ? t("common.saving") : t("common.add")}
              onClick={handleAssign}
              disabled={!selected || assignMutation.isPending}
              className="shrink-0"
            />
          </div>
        </div>

        {/* Existing assignments list */}
        <div className="px-6 py-4">
          {assignmentsQuery.isLoading ? (
            <DataLoader />
          ) : assignments.length === 0 ? (
            <div className="text-[13px] text-[#9a9a9a] text-center py-6">
              {t("licenses.assignments.empty")}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {assignments.map((a) => {
                const label = a.device
                  ? `${a.device.assetName ?? a.device.serialNumber ?? a.deviceId}`
                  : a.user
                  ? `${[a.user.name, a.user.surname].filter(Boolean).join(" ") || a.user.email}`
                  : a.deviceId ?? a.userId ?? a.id;
                const type = a.device ? t("licenses.assignments.device") : t("licenses.assignments.user");
                return (
                  <div
                    key={a.id}
                    className="flex items-center justify-between border border-[#F0F0F0] rounded-[6px] px-3 py-2"
                  >
                    <div>
                      <span className="text-[13px] text-[#3C3C3C] font-medium">{label}</span>
                      <span className="ml-2 text-[11px] text-[#9a9a9a]">{type}</span>
                    </div>
                    <button
                      className="text-[#F3606E] text-[12px] hover:underline ml-4 shrink-0"
                      onClick={() => unassignMutation.mutate(a.id)}
                    >
                      {t("common.delete")}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Licenses = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingLicense, setEditingLicense] = useState<SoftwareLicense | null>(null);
  const [assignmentsLicense, setAssignmentsLicense] = useState<SoftwareLicense | null>(null);
  const [search, setSearch] = useState("");

  const query = useQuery({
    queryKey: ["licenses"],
    queryFn: getLicenses,
  });

  const userSettings = useQuery({
    queryKey: ["userSettings"],
    queryFn: getUserSettings,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateLicensePayload) => createLicense(data),
    onSuccess: () => {
      toast.success(t("licenses.created"));
      queryClient.invalidateQueries({ queryKey: ["licenses"] });
      setCreateOpen(false);
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("licenses.createFailed")),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateLicensePayload }) =>
      updateLicense(id, data),
    onSuccess: () => {
      toast.success(t("licenses.updated"));
      queryClient.invalidateQueries({ queryKey: ["licenses"] });
      setEditingLicense(null);
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("licenses.updateFailed")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteLicense(id),
    onSuccess: () => {
      toast.success(t("licenses.deleted"));
      queryClient.invalidateQueries({ queryKey: ["licenses"] });
      setEditingLicense(null);
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("licenses.deleteFailed")),
  });

  const allLicenses: SoftwareLicense[] = query.data ?? [];

  const licenses = allLicenses.filter(
    (l) =>
      !search ||
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      (l.publisher ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (l.vendor ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const expiringSoon = allLicenses.filter((l) => {
    if (!l.expiresAt) return false;
    const days = Math.ceil(
      (new Date(l.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    return days <= 30;
  });

  const checkboxes = [
    { name: "name",   label: t("licenses.fields.name") },
    { name: "type",   label: t("licenses.fields.type") },
    { name: "seats",  label: t("licenses.fields.seats") },
    { name: "cost",   label: t("licenses.fields.cost") },
    { name: "expiry", label: t("licenses.fields.expiresAt") },
  ];

  const iconColumn = {
    id: "icon",
    cell: () => <FontAwesomeIcon icon={faKey} className="text-[#2B9AE9]" />,
    width: "52px",
  };

  const actionsColumn = {
    id: "actions",
    name: "",
    cell: (row: SoftwareLicense) => (
      <button
        className="p-1.5 rounded-[6px] text-[#9a9a9a] hover:text-[#2B9AE9] hover:bg-[#EBF5FB] transition-colors"
        title={t("licenses.assignments.title")}
        onClick={(e) => { e.stopPropagation(); setAssignmentsLicense(row); }}
      >
        <FontAwesomeIcon icon={faListCheck} className="text-[11px]" />
      </button>
    ),
    width: "52px",
    right: true,
  };

  const allColumns: Record<string, any> = {
    name: {
      id: "name",
      name: t("licenses.fields.name"),
      cell: (row: SoftwareLicense) => (
        <div className="min-w-0">
          <div className="font-semibold text-[14px] text-[#3C3C3C] truncate">{row.name}</div>
          {row.publisher && (
            <div className="text-[12px] text-[#9a9a9a]">{row.publisher}</div>
          )}
        </div>
      ),
      selector: (row: SoftwareLicense) => row.name,
      grow: 2,
    },
    type: {
      id: "type",
      name: t("licenses.fields.type"),
      cell: (row: SoftwareLicense) => (
        <span
          className="px-2 py-0.5 rounded-full text-white text-[11px] font-bold whitespace-nowrap"
          style={{ backgroundColor: typeColor[row.licenseType] ?? "#8a8a8a" }}
        >
          {row.licenseType}
        </span>
      ),
      selector: (row: SoftwareLicense) => row.licenseType,
      width: "130px",
    },
    seats: {
      id: "seats",
      name: t("licenses.fields.seats"),
      cell: (row: SoftwareLicense) => {
        const full = row.totalSeats !== null && row.usedSeats >= (row.totalSeats ?? Infinity);
        return (
          <span className={`font-medium text-[13px] ${full ? "text-[#F3606E] font-bold" : ""}`}>
            {row.usedSeats}/{row.totalSeats ?? "∞"}
          </span>
        );
      },
      selector: (row: SoftwareLicense) => row.usedSeats,
      width: "100px",
    },
    cost: {
      id: "cost",
      name: t("licenses.fields.cost"),
      cell: (row: SoftwareLicense) =>
        row.cost ? (
          <span className="text-[13px]">
            {Number(row.cost).toLocaleString()} {row.currency ?? ""}
          </span>
        ) : (
          <span className="text-[#9a9a9a] text-[13px]">—</span>
        ),
      selector: (row: SoftwareLicense) => Number(row.cost ?? 0),
      width: "120px",
    },
    expiry: {
      id: "expiry",
      name: t("licenses.fields.expiresAt"),
      cell: (row: SoftwareLicense) => {
        const exp = expiryStatus(row.expiresAt);
        if (exp) {
          return (
            <span
              className="text-[11px] font-bold px-2 py-0.5 rounded-full"
              style={{ color: exp.color, border: `1px solid ${exp.color}` }}
            >
              {exp.label}
            </span>
          );
        }
        if (row.licenseType === "perpetual") {
          return <span className="text-[#9a9a9a] text-[12px]">{t("licenses.neverExpires")}</span>;
        }
        return <span className="text-[#9a9a9a] text-[13px]">—</span>;
      },
      selector: (row: SoftwareLicense) => row.expiresAt ?? "",
      width: "160px",
    },
  };

  const filterColumns = () => {
    const order = userSettings.data?.licensesTableColumnOrder;
    if (!order || order.length === 0) return [iconColumn, ...Object.values(allColumns), actionsColumn];
    const filtered = order.map((id) => allColumns[id]).filter(Boolean);
    return [iconColumn, ...filtered, actionsColumn];
  };

  return (
    <PageMotion>
      <div className="h-[calc(100vh-58px)] w-full px-4">
        {expiringSoon.length > 0 && (
          <div className="mt-4 bg-[#FFF3CD] border border-[#F1C40F] rounded-[8px] px-4 py-3 text-[13px] text-[#7D6608]">
            <FontAwesomeIcon icon={faKey} className="mr-2" />
            {t("licenses.alert.expiringSoon", { count: expiringSoon.length })}:{" "}
            {expiringSoon.map((l) => l.name).join(", ")}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 py-4">
          <Search
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="w-auto flex-1 min-w-[180px] max-w-[400px]"
          />
          <div className="flex items-center gap-2 ml-auto">
            <TableSettings
              settings={userSettings.data}
              checkboxes={checkboxes}
              settingsKey="licensesTableColumnOrder"
            />
            <ButtonPrimary
              color="white"
              icon={faPlus}
              text={t("licenses.create")}
              onClick={() => setCreateOpen(true)}
              className="h-[34px]"
            />
          </div>
        </div>

        {query.isLoading ? (
          <DataLoader />
        ) : (
          <MainTable
            columns={filterColumns()}
            data={licenses}
            progressPending={query.isFetching}
            onRowClicked={(row: SoftwareLicense) => setEditingLicense(row)}
          />
        )}

        {createOpen && (
          <LicenseModal
            mode="create"
            initial={{ ...EMPTY_FORM }}
            onClose={() => setCreateOpen(false)}
            onSave={(data) => createMutation.mutate(data)}
            saving={createMutation.isPending}
          />
        )}
        {editingLicense && (
          <LicenseModal
            mode="edit"
            initial={{ ...editingLicense, cost: editingLicense.cost ?? "", publisher: editingLicense.publisher ?? "" }}
            onClose={() => setEditingLicense(null)}
            onSave={(data) => updateMutation.mutate({ id: editingLicense.id, data })}
            onDelete={() => deleteMutation.mutate(editingLicense.id)}
            saving={updateMutation.isPending}
            deleting={deleteMutation.isPending}
          />
        )}
        {assignmentsLicense && (
          <AssignmentsPanel
            license={assignmentsLicense}
            onClose={() => setAssignmentsLicense(null)}
          />
        )}
      </div>
    </PageMotion>
  );
};

export default Licenses;
