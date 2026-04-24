import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { faPlus, faTag, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import CardHeader from "../../../../Components/Headers/CardHeader";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import {
  listDeviceTags,
  createDeviceTag,
  deleteDeviceTag,
} from "../../../../Services/deviceTags";

const Tags = () => {
  const queryClient = useQueryClient();
  const [key, setKey] = useState("");
  const [label, setLabel] = useState("");
  const [color, setColor] = useState("#2B9AE9");
  const [description, setDescription] = useState("");

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
      toast.success("Tag created");
      setKey("");
      setLabel("");
      setColor("#2B9AE9");
      setDescription("");
      invalidate();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? "Create failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDeviceTag(id),
    onSuccess: () => {
      toast.success("Tag deleted");
      invalidate();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? "Delete failed"),
  });

  return (
    <div className="space-y-4 m-4">
      <div className="bg-white shadow-xl rounded-[10px] p-4">
        <CardHeader text="Create device tag" icon={faPlus} />
        <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-2">
          <input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Key (e.g. executive-laptop)"
            className="h-[36px] rounded-[6px] border border-[#D0D0D0] px-3 text-[13px]"
          />
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label (shown in chips)"
            className="h-[36px] rounded-[6px] border border-[#D0D0D0] px-3 text-[13px]"
          />
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-[36px] w-full rounded-[6px] border border-[#D0D0D0] cursor-pointer"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className="h-[36px] rounded-[6px] border border-[#D0D0D0] px-3 text-[13px]"
          />
        </div>
        <div className="mt-3">
          <ButtonPrimary
            icon={faPlus}
            text={createMutation.isPending ? "Creating…" : "Create tag"}
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
        <CardHeader text="Existing tags" icon={faTag} />
        {tagsQuery.isLoading ? (
          <div className="mt-3 text-[13px] text-[#7a7a7a]">Loading…</div>
        ) : (tagsQuery.data ?? []).length === 0 ? (
          <div className="mt-3 text-[13px] text-[#7a7a7a]">
            No tags yet. Tags appear as chips in the devices list and unlock
            mass actions.
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
                  onClick={() => {
                    if (window.confirm(`Delete tag "${tag.label}"?`))
                      deleteMutation.mutate(tag.id);
                  }}
                  className="text-[#F3606E] hover:text-[#C0392B] cursor-pointer"
                  title="Delete"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Tags;
