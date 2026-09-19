import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { faPlus, faTag, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import CardHeader from "../../../../Components/Headers/CardHeader";
import ColorPicker from "../../../../Components/Inputs/ColorPicker";
import Input from "../../../../Components/Inputs/Input";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import ConfirmationModal from "../../../../Components/Modals/ConfirmationModal";
import Modal from "../../../../Components/Modals/AnimatedModal";
import {
  listDeviceTags,
  createDeviceTag,
  deleteDeviceTag,
} from "../../../../Services/deviceTags";
import { usePermissions } from "../../../../Hooks/usePermissions";
import { hasPermission } from "../../../../Constants/navigation";

const CreateDeviceTagModal = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [key, setKey] = useState("");
  const [label, setLabel] = useState("");
  const [color, setColor] = useState("#2B9AE9");
  const [description, setDescription] = useState("");

  // Clear the draft every time the modal opens, so a previous create doesn't
  // linger in the fields the next time it's opened.
  useEffect(() => {
    if (open) {
      setKey("");
      setLabel("");
      setColor("#2B9AE9");
      setDescription("");
    }
  }, [open]);

  const createMutation = useMutation({
    mutationFn: () =>
      createDeviceTag({
        key: key.trim(),
        label: label.trim(),
        color,
        description: description.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success(t("settings.tags.created"));
      queryClient.invalidateQueries({ queryKey: ["device-tags"] });
      onClose();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("settings.tags.createFailed")),
  });

  const handleCreate = () => {
    if (!key.trim() || !label.trim()) {
      toast.error(t("settings.tags.keyLabelRequired"));
      return;
    }
    createMutation.mutate();
  };

  return (
    <Modal
      classNames={{ modal: "w-[520px] max-w-full rounded-[10px]" }}
      open={open}
      onClose={onClose}
      center
    >
      <CardHeader text={t("settings.tags.create")} icon={faPlus} />

      <div className="mt-4 flex flex-col gap-1">
        <Input
          label={t("settings.tags.key")}
          value={key}
          handleChange={setKey}
          placeholder={t("settings.tags.keyPlaceholder")}
        />
        <Input
          label={t("settings.tags.label")}
          value={label}
          handleChange={setLabel}
          placeholder={t("settings.tags.labelPlaceholder")}
        />
        <div className="pt-2 flex items-center gap-3">
          <span className="font-bold text-[#3C3C3C]">{t("settings.tags.color")}</span>
          <ColorPicker value={color} onChange={setColor} size={36} />
        </div>
        <Input
          label={t("settings.tags.description")}
          value={description}
          handleChange={setDescription}
          placeholder={t("settings.tags.descriptionPlaceholder")}
        />
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <ButtonPrimary text={t("common.cancel")} onClick={onClose} color="white" />
        <ButtonPrimary
          icon={faPlus}
          text={createMutation.isPending ? t("common.creating") : t("settings.tags.createBtn")}
          onClick={handleCreate}
          disabled={createMutation.isPending}
        />
      </div>
    </Modal>
  );
};

const Tags = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<{ open: boolean; onConfirm: () => void; message?: string }>({ open: false, onConfirm: () => {} });
  const askConfirm = (onConfirm: () => void, message?: string) => setConfirmState({ open: true, onConfirm, message });

  const tagsQuery = useQuery({
    queryKey: ["device-tags"],
    queryFn: listDeviceTags,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDeviceTag(id),
    onSuccess: () => {
      toast.success(t("settings.tags.deleted"));
      queryClient.invalidateQueries({ queryKey: ["device-tags"] });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("settings.tags.deleteFailed")),
  });

  const permissionsQuery = usePermissions();
  const canManageTags = hasPermission("devices.tags.manage", permissionsQuery.data);
  if (!canManageTags) return null;

  return (
    <div className="space-y-4 m-4">
      <div className="bg-white shadow-xl rounded-[10px] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardHeader text={t("settings.tags.existing")} icon={faTag} />
          <ButtonPrimary
            icon={faPlus}
            text={t("settings.tags.createBtn")}
            onClick={() => setCreateOpen(true)}
          />
        </div>

        {tagsQuery.isLoading ? (
          <div className="mt-3 text-[13px] text-[#7a7a7a]">{t("settings.tags.loading")}</div>
        ) : (tagsQuery.data ?? []).length === 0 ? (
          <div className="mt-3 text-[13px] text-[#7a7a7a]">
            {t("settings.tags.empty")}
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {(tagsQuery.data ?? []).map((tag) => (
              <div
                key={tag.id}
                className="flex items-center gap-3 rounded-[8px] border border-[#E0E0E0] px-3 py-2"
              >
                <span
                  className="rounded-full px-3 py-1 text-[12px] font-bold text-white"
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.label}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] text-[#9a9a9a]">
                    key: <code>{tag.key}</code>
                  </div>
                  {tag.description && (
                    <div className="text-[12px] text-[#535353]">
                      {tag.description}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => askConfirm(() => deleteMutation.mutate(tag.id), t("settings.tags.deleteConfirm", { name: tag.label }))}
                  className="text-[#F3606E] hover:text-[#C0392B] cursor-pointer"
                  title={t("settings.tags.delete")}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateDeviceTagModal open={createOpen} onClose={() => setCreateOpen(false)} />

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

export default Tags;
