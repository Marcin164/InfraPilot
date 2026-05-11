import Modal from "./AnimatedModal";
import Input from "../Inputs/Input";
import ButtonPrimary from "../Buttons/ButtonPrimary";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { createSpace } from "../../Services/knowledge";
import { useState } from "react";

type AddSpaceModalProps = {
  isModalOpen: boolean;
  onCloseModal: () => void;
};

const EMOJI_OPTIONS = ["📚", "📖", "💡", "🧠", "🛠️", "⚙️", "🔧", "📝", "🗂️", "🎯"];

const AddSpaceModal: React.FC<AddSpaceModalProps> = ({
  isModalOpen,
  onCloseModal,
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState<string>("📚");

  const mutation = useMutation({
    mutationFn: () =>
      createSpace({
        name: name.trim(),
        description: description.trim() || null,
        icon,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-spaces"] });
      handleOnClose();
    },
  });

  const handleOnClose = () => {
    setName("");
    setDescription("");
    setIcon("📚");
    onCloseModal();
  };

  const handleCreate = () => {
    if (!name.trim()) return;
    mutation.mutate();
  };

  return (
    <Modal
      classNames={{ modal: "w-[550px] rounded-[10px]" }}
      open={isModalOpen}
      onClose={handleOnClose}
      center
    >
      <div className="text-gray-800 font-bold text-2xl mb-4">{t("modal.addSpace")}</div>

      <Input
        label={t("form.name")}
        value={name}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setName(e.target.value)
        }
      />

      <div className="pt-2">
        <label className="font-bold text-[#3C3C3C]">{t("common.description")}</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full border border-[#535353] bg-[#FFFFFF] text-[16px] font-bold block rounded-[10px] px-3 py-2 mt-[6px] resize-none"
        />
      </div>

      <div className="pt-2">
        <label className="font-bold text-[#3C3C3C]">{t("modal.icon")}</label>
        <div className="flex flex-wrap gap-2 mt-[6px]">
          {EMOJI_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setIcon(emoji)}
              className={`w-10 h-10 rounded-[10px] border text-xl flex items-center justify-center transition ${
                icon === emoji
                  ? "border-[#2B9AE9] bg-[#E6F4FF]"
                  : "border-[#535353] bg-white"
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <ButtonPrimary
          text={mutation.isPending ? t("common.creating") : t("common.create")}
          onClick={handleCreate}
        />
      </div>
    </Modal>
  );
};

export default AddSpaceModal;
