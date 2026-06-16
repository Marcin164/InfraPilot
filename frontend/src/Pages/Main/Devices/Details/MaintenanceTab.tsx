import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useOutletContext } from "react-router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faWrench, faPlus, faPen, faTrash, faCheck, faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import Input from "../../../../Components/Inputs/Input";
import SelectSecondary from "../../../../Components/Inputs/SelectSecondary";
import ConfirmationModal from "../../../../Components/Modals/ConfirmationModal";
import {
  getDeviceMaintenance,
  createMaintenance,
  updateMaintenance,
  deleteMaintenance,
  MaintenanceType,
  CreateMaintenanceDto,
} from "../../../../Services/maintenance";

const TYPE_COLORS: Record<MaintenanceType, string> = {
  scheduled: "#2B9AE9",
  repair: "#F3606E",
  inspection: "#8E44AD",
  upgrade: "#30A712",
  other: "#9a9a9a",
};

const TYPES: MaintenanceType[] = ["scheduled", "repair", "inspection", "upgrade", "other"];

const EMPTY: CreateMaintenanceDto = {
  deviceId: "",
  type: "other",
  description: "",
  performedBy: "",
  cost: "",
  currency: "USD",
  performedAt: "",
  nextDueAt: "",
  notes: "",
};

const formatDate = (s: string | null) => {
  if (!s) return "—";
  return s.slice(0, 10);
};

const MaintenanceTab = () => {
  const { t } = useTranslation();
  const deviceQuery: any = useOutletContext();
  const deviceId = deviceQuery?.data?.id ?? "";
  const queryClient = useQueryClient();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<CreateMaintenanceDto>({ ...EMPTY, deviceId });
  const [confirmState, setConfirmState] = useState<{ open: boolean; onConfirm: () => void; message?: string }>({ open: false, onConfirm: () => {} });
  const askConfirm = (onConfirm: () => void, message?: string) => setConfirmState({ open: true, onConfirm, message });

  const query = useQuery({
    queryKey: ["maintenance", deviceId],
    queryFn: () => getDeviceMaintenance(deviceId),
    enabled: !!deviceId,
  });

  const createMut = useMutation({
    mutationFn: createMaintenance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance", deviceId] });
      toast.success(t("maintenance.created"));
      setIsFormOpen(false);
      setDraft({ ...EMPTY, deviceId });
    },
    onError: () => toast.error(t("maintenance.error")),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<CreateMaintenanceDto> }) =>
      updateMaintenance(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance", deviceId] });
      toast.success(t("maintenance.updated"));
      setEditing(null);
    },
    onError: () => toast.error(t("maintenance.error")),
  });

  const deleteMut = useMutation({
    mutationFn: deleteMaintenance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance", deviceId] });
      toast.success(t("maintenance.deleted"));
    },
    onError: () => toast.error(t("maintenance.error")),
  });

  const handleSave = () => {
    if (editing) {
      updateMut.mutate({ id: editing, dto: draft });
    } else {
      createMut.mutate({ ...draft, deviceId });
    }
  };

  const startEdit = (r: any) => {
    setEditing(r.id);
    setDraft({
      deviceId,
      type: r.type,
      description: r.description ?? "",
      performedBy: r.performedBy ?? "",
      cost: r.cost ?? "",
      currency: r.currency ?? "USD",
      performedAt: r.performedAt ? r.performedAt.slice(0, 10) : "",
      nextDueAt: r.nextDueAt ? r.nextDueAt.slice(0, 10) : "",
      notes: r.notes ?? "",
    });
    setIsFormOpen(true);
  };

  const cancelForm = () => {
    setIsFormOpen(false);
    setEditing(null);
    setDraft({ ...EMPTY, deviceId });
  };

  const records = query.data ?? [];

  const FormPanel = () => (
    <div className="bg-[#F8FBFF] border border-[#D0E8FA] rounded-[8px] p-4 mb-4">
      <div className="font-semibold text-[14px] text-[#3C3C3C] mb-3">
        {editing ? t("maintenance.edit") : t("maintenance.add")}
      </div>
      <div className="grid grid-cols-2 gap-x-4 mb-3">
        <SelectSecondary
          label={t("maintenance.type")}
          options={TYPES.map((tp) => ({ value: tp, label: tp.charAt(0).toUpperCase() + tp.slice(1) }))}
          value={{ value: draft.type, label: draft.type ? draft.type.charAt(0).toUpperCase() + draft.type.slice(1) : "" }}
          onSelect={(opt: any) => setDraft((d) => ({ ...d, type: opt.value as MaintenanceType }))}
        />
        <Input
          label={t("maintenance.performedBy")}
          value={draft.performedBy}
          handleChange={(v: string) => setDraft((d) => ({ ...d, performedBy: v }))}
        />
        <Input
          label={t("maintenance.performedAt")}
          type="date"
          value={draft.performedAt}
          handleChange={(v: string) => setDraft((d) => ({ ...d, performedAt: v }))}
        />
        <Input
          label={t("maintenance.nextDueAt")}
          type="date"
          value={draft.nextDueAt}
          handleChange={(v: string) => setDraft((d) => ({ ...d, nextDueAt: v }))}
        />
        <Input
          label={t("maintenance.cost")}
          type="number"
          value={draft.cost}
          handleChange={(v: string) => setDraft((d) => ({ ...d, cost: v }))}
        />
        <Input
          label={t("maintenance.currency")}
          value={draft.currency}
          handleChange={(v: string) => setDraft((d) => ({ ...d, currency: v }))}
        />
        <Input
          label={t("maintenance.description")}
          value={draft.description}
          handleChange={(v: string) => setDraft((d) => ({ ...d, description: v }))}
          className="col-span-2"
        />
        <div className="col-span-2 pt-2">
          <label className="font-bold text-[#3C3C3C]">{t("maintenance.notes")}</label>
          <textarea
            rows={2}
            className="w-full mt-[6px] rounded-[10px] border border-[#535353] bg-white font-bold px-3 py-2 text-[16px] block resize-none"
            value={draft.notes}
            onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <ButtonPrimary icon={faCheck} text={t("btn.save")} onClick={handleSave}
          disabled={createMut.isPending || updateMut.isPending} />
        <ButtonPrimary icon={faXmark} text={t("btn.cancel")} color="white" onClick={cancelForm} />
      </div>
    </div>
  );

  return (
    <div className="bg-white shadow-xl rounded-[10px] p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2 font-semibold text-[20px] text-[#3C3C3C]">
          <FontAwesomeIcon icon={faWrench} className="text-[#2B9AE9]" />
          {t("maintenance.title")}
        </div>
        {!isFormOpen && (
          <ButtonPrimary
            icon={faPlus}
            text={t("maintenance.add")}
            onClick={() => { setIsFormOpen(true); setEditing(null); setDraft({ ...EMPTY, deviceId }); }}
          />
        )}
      </div>

      {isFormOpen && <FormPanel />}

      {query.isLoading ? (
        <div className="text-[13px] text-[#9a9a9a] py-4 text-center">{t("loading")}</div>
      ) : records.length === 0 ? (
        <div className="text-[13px] text-[#9a9a9a] py-4 text-center">{t("maintenance.empty")}</div>
      ) : (
        <div className="space-y-2">
          {records.map((r) => (
            <div key={r.id} className="border border-[#F0F0F0] rounded-[8px] p-3 flex items-start gap-3">
              <div
                className="mt-0.5 w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: TYPE_COLORS[r.type] ?? "#9a9a9a", marginTop: 6 }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: TYPE_COLORS[r.type] ?? "#9a9a9a" }}
                  >
                    {r.type}
                  </span>
                  {r.performedBy && (
                    <span className="text-[12px] text-[#3C3C3C]">{r.performedBy}</span>
                  )}
                  {r.cost && (
                    <span className="text-[12px] text-[#3C3C3C]">
                      {Number(r.cost).toLocaleString()} {r.currency ?? ""}
                    </span>
                  )}
                  <span className="text-[11px] text-[#9a9a9a] ml-auto">{formatDate(r.performedAt)}</span>
                </div>
                {r.description && (
                  <div className="text-[12px] text-[#555] mt-1">{r.description}</div>
                )}
                {r.nextDueAt && (
                  <div className="text-[11px] text-[#F1A20F] mt-0.5">
                    {t("maintenance.nextDue")}: {formatDate(r.nextDueAt)}
                  </div>
                )}
                {r.notes && (
                  <div className="text-[11px] text-[#9a9a9a] mt-0.5">{r.notes}</div>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => startEdit(r)}
                  className="p-1.5 rounded-[6px] text-[#9a9a9a] hover:text-[#2B9AE9] hover:bg-[#EBF5FB] transition-colors"
                >
                  <FontAwesomeIcon icon={faPen} className="text-[11px]" />
                </button>
                <button
                  onClick={() => askConfirm(() => deleteMut.mutate(r.id), t("maintenance.confirmDelete"))}
                  className="p-1.5 rounded-[6px] text-[#9a9a9a] hover:text-[#F3606E] hover:bg-[#FEF0F0] transition-colors"
                >
                  <FontAwesomeIcon icon={faTrash} className="text-[11px]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <ConfirmationModal
        isModalOpen={confirmState.open}
        handleOnClose={() => setConfirmState((s) => ({ ...s, open: false }))}
        onCancel={() => setConfirmState((s) => ({ ...s, open: false }))}
        onDelete={() => { confirmState.onConfirm(); setConfirmState((s) => ({ ...s, open: false })); }}
        message={confirmState.message}
      />
    </div>
  );
};

export default MaintenanceTab;
