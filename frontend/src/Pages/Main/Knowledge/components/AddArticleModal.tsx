import Modal from "../../../../Components/Modals/AnimatedModal";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import Input from "../../../../Components/Inputs/Input";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import { createArticle, getCategoriesBySpace } from "../../../../Services/knowledge";
import type { ArticleStatus } from "../../../../Types";
import CategorySelect from "./CategorySelect";

type Props = {
  spaceId: string;
  isModalOpen: boolean;
  onCloseModal: () => void;
};

const AddArticleModal = ({ spaceId, isModalOpen, onCloseModal }: Props) => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<ArticleStatus>("draft");

  const categoriesQuery = useQuery({
    queryKey: ["knowledge-categories", spaceId],
    queryFn: () => getCategoriesBySpace(spaceId),
    enabled: Boolean(spaceId),
  });

  const mutation = useMutation({
    mutationFn: () =>
      createArticle({
        title: title.trim(),
        content: "",
        spaceId,
        status,
        category: category.trim() || null,
        tags: null,
        ticketId: null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-articles", spaceId] });
      queryClient.invalidateQueries({ queryKey: ["knowledge-categories", spaceId] });
      toast.success("Article created");
      handleClose();
    },
    onError: () => {
      toast.error("Failed to create article");
    },
  });

  const handleClose = () => {
    setTitle("");
    setCategory("");
    setStatus("draft");
    onCloseModal();
  };

  return (
    <Modal
      classNames={{ modal: "w-[550px] rounded-[10px]" }}
      open={isModalOpen}
      onClose={handleClose}
      center
    >
      <div className="text-[#3C3C3C] font-bold text-2xl mb-4">New Article</div>

      <Input
        label="Title"
        value={title}
        onChange={(e: any) => setTitle(e.target.value)}
      />

      <div className="pt-2">
        <label className="font-bold text-[#3C3C3C]">Category</label>
        <div className="mt-[6px]">
          <CategorySelect
            value={category}
            onChange={setCategory}
            categories={categoriesQuery.data ?? []}
          />
        </div>
      </div>

      <div className="pt-2">
        <label className="font-bold text-[#3C3C3C]">Status</label>
        <div className="mt-[6px] flex gap-2">
          {(["draft", "published"] as ArticleStatus[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`cursor-pointer rounded-[10px] px-4 py-2 text-[14px] font-bold capitalize transition ${
                status === s
                  ? "bg-[#2B9AE9] text-white"
                  : "border border-[#535353] bg-white text-[#535353]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <ButtonPrimary
          text={mutation.isPending ? "Creating…" : "Create"}
          onClick={() => {
            if (!title.trim()) return;
            mutation.mutate();
          }}
          disabled={mutation.isPending || !title.trim()}
        />
      </div>
    </Modal>
  );
};

export default AddArticleModal;
