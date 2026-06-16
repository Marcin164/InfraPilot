import { useState } from "react";
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
import {
  listDeviceTags,
  createDeviceTag,
  deleteDeviceTag,
} from "../../../../Services/deviceTags";

const Tags = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [key, setKey] = useState("");
  const [label, setLabel] = useState("");
  const [color, setColor] = useState("#2B9AE9");
  const [description, setDescription] = useState("");
  const [confirmState, setConfirmState] = useState<{ open: boolean; onConfirm: () => void; message?: string }>({ open: false, onConfirm: () => {} });
  const askConfirm = (onConfirm: () => void, message?: string) => setConfirmState({ open: true, onConfirm, message });

  const tagsQuery = useQuery({
    queryKey: ["device-tags"],
    queryFn: listDeviceTags,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["device-tags"] });

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
      setKey("");
      setLabel("");
      setColor("#2B9AE9");
      setDescription("");
      invalidate();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("settings.tags.createFailed")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDeviceTag(id),
    onSuccess: () => {
      toast.success(t("settings.tags.deleted"));
      invalidate();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("settings.tags.deleteFailed")),
  });

  return (
    <div className="space-y-4 m-4">
      <div className="bg-white shadow-xl rounded-[10px] p-4">
        <CardHeader text={t("settings.tags.create")} icon={faPlus} />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Input
            value={key}
            handleChange={setKey}
            placeholder={t("settings.tags.keyPlaceholder")}
            className="flex-1 min-w-[140px]"
          />
          <Input
            value={label}
            handleChange={setLabel}
            placeholder={t("settings.tags.labelPlaceholder")}
            className="flex-1 min-w-[140px]"
          />
          <ColorPicker value={color} onChange={setColor} size={36} />
          <Input
            value={description}
            handleChange={setDescription}
            placeholder={t("settings.tags.descriptionPlaceholder")}
            className="flex-1 min-w-[140px]"
          />
        </div>
        <div className="mt-3">
          <ButtonPrimary
            icon={faPlus}
            text={createMutation.isPending ? t("common.creating", "Creating…") : t("settings.tags.createBtn")}
            onClick={() => {
              if (!key.trim() || !label.trim()) {
                toast.error("Key and label are required");
                return;
              }
              createMutation.mutate();
            }}
            disabled={createMutation.isPending}
          />
        </div>
      </div>

      <div className="bg-white shadow-xl rounded-[10px] p-4">
        <CardHeader text={t("settings.tags.existing")} icon={faTag} />
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
                  onClick={() => askConfirm(() => deleteMutation.mutate(tag.id), `Delete tag "${tag.label}"?`)}
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
