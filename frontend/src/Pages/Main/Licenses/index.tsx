import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faKey,
  faPlus,
  faPen,
  faTrash,
  faXmark,
  faCheck,
  faChevronDown,
  faChevronUp,
  faListCheck,
} from "@fortawesome/free-solid-svg-icons";
import PageMotion from "../../../Components/PageMotion/PageMotion";
import ButtonPrimary from "../../../Components/Buttons/ButtonPrimary";
import DataLoader from "../../../Components/Loaders/DataLoader";
import {
  getLicenses,
  createLicense,
  updateLicense,
  deleteLicense,
  getLicenseAssignments,
  deleteAssignment,
  type SoftwareLicense,
  type CreateLicensePayload,
  type SoftwareLicenseAssignment,
} from "../../../Services/licenses";

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
  if (days < 0)
    return { label: `Expired ${-days}d ago`, color: "#F3606E" };
  if (days <= 30)
    return { label: `Expires in ${days}d`, color: "#F3606E" };
  if (days <= 90)
    return { label: `Expires in ${days}d`, color: "#F1C40F" };
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
  saving,
}: {
  mode: ModalMode;
  initial: CreateLicensePayload & { id?: string };
  onClose: () => void;
  onSave: (data: CreateLicensePayload & { id?: string }) => void;
  saving: boolean;
}) => {
  const { t } = useTranslation();
  const [form, setForm] = useState(initial);

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
        <div className="px-6 py-4 flex flex-col gap-3">
          <div>
            <label className="text-[11px] text-[#9a9a9a]">{t("licenses.fields.name")} *</label>
            <input
              className="w-full mt-1 rounded-[6px] border border-[#D0D0D0] px-3 py-2 text-[13px]"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-[#9a9a9a]">{t("licenses.fields.publisher")}</label>
              <input
                className="w-full mt-1 rounded-[6px] border border-[#D0D0D0] px-3 py-2 text-[13px]"
                value={form.publisher ?? ""}
                onChange={(e) => set("publisher", e.target.value)}
              />
            </div>
            <div>
              <label className="text-[11px] text-[#9a9a9a]">{t("licenses.fields.vendor")}</label>
              <input
                className="w-full mt-1 rounded-[6px] border border-[#D0D0D0] px-3 py-2 text-[13px]"
                value={form.vendor ?? ""}
                onChange={(e) => set("vendor", e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-[#9a9a9a]">{t("licenses.fields.type")}</label>
              <select
                className="w-full mt-1 rounded-[6px] border border-[#D0D0D0] px-3 py-2 text-[13px]"
                value={form.licenseType ?? "perpetual"}
                onChange={(e) => set("licenseType", e.target.value)}
              >
                {LICENSE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-[#9a9a9a]">{t("licenses.fields.seats")}</label>
              <input
                type="number"
                min={1}
                className="w-full mt-1 rounded-[6px] border border-[#D0D0D0] px-3 py-2 text-[13px]"
                value={form.totalSeats ?? ""}
                placeholder="Unlimited"
                onChange={(e) =>
                  set("totalSeats", e.target.value ? Number(e.target.value) : undefined)
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-[#9a9a9a]">{t("licenses.fields.purchaseDate")}</label>
              <input
                type="date"
                className="w-full mt-1 rounded-[6px] border border-[#D0D0D0] px-3 py-2 text-[13px]"
                value={form.purchaseDate ?? ""}
                onChange={(e) => set("purchaseDate", e.target.value)}
              />
            </div>
            <div>
              <label className="text-[11px] text-[#9a9a9a]">{t("licenses.fields.expiresAt")}</label>
              <input
                type="date"
                className="w-full mt-1 rounded-[6px] border border-[#D0D0D0] px-3 py-2 text-[13px]"
                value={form.expiresAt ?? ""}
                onChange={(e) => set("expiresAt", e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-[#9a9a9a]">{t("licenses.fields.cost")}</label>
              <input
                type="number"
                step="0.01"
                className="w-full mt-1 rounded-[6px] border border-[#D0D0D0] px-3 py-2 text-[13px]"
                value={form.cost ?? ""}
                onChange={(e) => set("cost", e.target.value)}
              />
            </div>
            <div>
              <label className="text-[11px] text-[#9a9a9a]">{t("licenses.fields.currency")}</label>
              <input
                className="w-full mt-1 rounded-[6px] border border-[#D0D0D0] px-3 py-2 text-[13px]"
                value={form.currency ?? ""}
                maxLength={8}
                onChange={(e) => set("currency", e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-[#9a9a9a]">{t("licenses.fields.licenseKey")}</label>
            <input
              className="w-full mt-1 rounded-[6px] border border-[#D0D0D0] px-3 py-2 text-[13px] font-mono"
              value={form.licenseKey ?? ""}
              onChange={(e) => set("licenseKey", e.target.value)}
            />
          </div>
          <div>
            <label className="text-[11px] text-[#9a9a9a]">{t("licenses.fields.notes")}</label>
            <textarea
              rows={2}
              className="w-full mt-1 rounded-[6px] border border-[#D0D0D0] px-3 py-2 text-[13px]"
              value={form.notes ?? ""}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-[#F0F0F0]">
          <ButtonPrimary icon={faXmark} text={t("common.cancel")} color="white" onClick={onClose} />
          <ButtonPrimary
            icon={faCheck}
            text={saving ? t("common.saving") : t("common.save")}
            onClick={() => onSave(form)}
            disabled={saving || !form.name.trim()}
          />
        </div>
      </div>
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

  const query = useQuery({
    queryKey: ["license-assignments", license.id],
    queryFn: () => getLicenseAssignments(license.id),
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

  const assignments: SoftwareLicenseAssignment[] = query.data ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-[12px] shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F0F0]">
          <div className="font-bold text-[15px]">
            <FontAwesomeIcon icon={faListCheck} className="text-[#2B9AE9] mr-2" />
            {t("licenses.assignments.title")} — {license.name}
          </div>
          <button onClick={onClose} className="text-[#9a9a9a] hover:text-[#3C3C3C]">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
        <div className="px-6 py-4">
          {query.isLoading ? (
            <DataLoader />
          ) : assignments.length === 0 ? (
            <div className="text-[13px] text-[#9a9a9a] text-center py-6">
              {t("licenses.assignments.empty")}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {assignments.map((a) => {
                const label = a.device
                  ? `${a.device.assetName ?? a.device.serialNumber ?? a.deviceId} (device)`
                  : a.user
                  ? `${[a.user.name, a.user.surname].filter(Boolean).join(" ") || a.user.email} (user)`
                  : a.deviceId ?? a.userId ?? a.id;
                return (
                  <div
                    key={a.id}
                    className="flex items-center justify-between border border-[#F0F0F0] rounded-[6px] px-3 py-2"
                  >
                    <div className="text-[13px] text-[#3C3C3C]">{label}</div>
                    <button
                      className="text-[#F3606E] text-[12px] hover:underline"
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

const LicenseRow = ({ license }: { license: SoftwareLicense }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [assignmentsOpen, setAssignmentsOpen] = useState(false);

  const expiry = expiryStatus(license.expiresAt);
  const seatsFull =
    license.totalSeats !== null && license.usedSeats >= license.totalSeats;

  const updateMutation = useMutation({
    mutationFn: (data: CreateLicensePayload) => updateLicense(license.id, data),
    onSuccess: () => {
      toast.success(t("licenses.updated"));
      queryClient.invalidateQueries({ queryKey: ["licenses"] });
      setEditOpen(false);
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("licenses.updateFailed")),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteLicense(license.id),
    onSuccess: () => {
      toast.success(t("licenses.deleted"));
      queryClient.invalidateQueries({ queryKey: ["licenses"] });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("licenses.deleteFailed")),
  });

  return (
    <>
      <div className="bg-white rounded-[10px] shadow-sm border border-[#F0F0F0] px-4 py-3 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span
              className="shrink-0 px-2 py-0.5 rounded-full text-white text-[11px] font-bold"
              style={{ backgroundColor: typeColor[license.licenseType] ?? "#8a8a8a" }}
            >
              {license.licenseType}
            </span>
            <div className="min-w-0">
              <div className="font-bold text-[14px] text-[#3C3C3C] truncate">{license.name}</div>
              {license.publisher && (
                <div className="text-[12px] text-[#9a9a9a]">{license.publisher}</div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              className="text-[#2B9AE9] px-2 py-1 rounded hover:bg-[#F0F0F0] text-[12px]"
              onClick={() => setAssignmentsOpen(true)}
            >
              <FontAwesomeIcon icon={faListCheck} />
            </button>
            <button
              className="text-[#2B9AE9] px-2 py-1 rounded hover:bg-[#F0F0F0] text-[12px]"
              onClick={() => setEditOpen(true)}
            >
              <FontAwesomeIcon icon={faPen} />
            </button>
            <button
              className="text-[#F3606E] px-2 py-1 rounded hover:bg-[#F0F0F0] text-[12px]"
              onClick={() => {
                if (confirm(t("licenses.confirmDelete"))) deleteMutation.mutate();
              }}
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[#666]">
          <span>
            <span className="text-[#9a9a9a]">{t("licenses.fields.seats")}: </span>
            <span className={seatsFull ? "text-[#F3606E] font-bold" : "font-medium"}>
              {license.usedSeats}/{license.totalSeats ?? "∞"}
            </span>
          </span>
          {license.cost && (
            <span>
              <span className="text-[#9a9a9a]">{t("licenses.fields.cost")}: </span>
              <span className="font-medium">
                {Number(license.cost).toLocaleString()} {license.currency ?? ""}
              </span>
            </span>
          )}
          {license.vendor && (
            <span>
              <span className="text-[#9a9a9a]">{t("licenses.fields.vendor")}: </span>
              <span>{license.vendor}</span>
            </span>
          )}
          {expiry && (
            <span className="font-bold" style={{ color: expiry.color }}>
              {expiry.label}
            </span>
          )}
          {!license.expiresAt && license.licenseType === "perpetual" && (
            <span className="text-[#9a9a9a]">{t("licenses.neverExpires")}</span>
          )}
        </div>
      </div>

      {editOpen && (
        <LicenseModal
          mode="edit"
          initial={{ ...license, cost: license.cost ?? "", publisher: license.publisher ?? "" }}
          onClose={() => setEditOpen(false)}
          onSave={(data) => updateMutation.mutate(data)}
          saving={updateMutation.isPending}
        />
      )}
      {assignmentsOpen && (
        <AssignmentsPanel license={license} onClose={() => setAssignmentsOpen(false)} />
      )}
    </>
  );
};

const Licenses = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");

  const query = useQuery({
    queryKey: ["licenses"],
    queryFn: getLicenses,
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

  const licenses: SoftwareLicense[] = (query.data ?? []).filter(
    (l) =>
      !search ||
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      (l.publisher ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (l.vendor ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const expiringSoon = licenses.filter((l) => {
    if (!l.expiresAt) return false;
    const days = Math.ceil(
      (new Date(l.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    return days <= 30;
  });

  return (
    <PageMotion>
      <div className="w-full p-4">
        {expiringSoon.length > 0 && (
          <div className="mb-4 bg-[#FFF3CD] border border-[#F1C40F] rounded-[8px] px-4 py-3 text-[13px] text-[#7D6608]">
            <FontAwesomeIcon icon={faKey} className="mr-2" />
            {t("licenses.alert.expiringSoon", { count: expiringSoon.length })}:{" "}
            {expiringSoon.map((l) => l.name).join(", ")}
          </div>
        )}

        <div className="flex items-center justify-between mb-4 gap-3">
          <input
            className="flex-1 max-w-xs rounded-[8px] border border-[#D0D0D0] px-3 py-1.5 text-[13px]"
            placeholder={t("search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <ButtonPrimary
            icon={faPlus}
            text={t("licenses.create")}
            onClick={() => setCreateOpen(true)}
          />
        </div>

        {query.isLoading ? (
          <DataLoader />
        ) : licenses.length === 0 ? (
          <div className="text-center text-[#9a9a9a] py-16 text-[14px]">
            {search ? t("licenses.noResults") : t("licenses.empty")}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {licenses.map((l) => (
              <LicenseRow key={l.id} license={l} />
            ))}
          </div>
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
      </div>
    </PageMotion>
  );
};

export default Licenses;
