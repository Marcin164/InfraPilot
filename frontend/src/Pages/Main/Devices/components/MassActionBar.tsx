import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { faPlay, faTag, faBoxArchive } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import SelectSecondary from "../../../../Components/Inputs/SelectSecondary";
import {
  listDeviceTags,
  bulkTagDevices,
  bulkLifecycleDevices,
  DeviceTag,
} from "../../../../Services/deviceTags";
import { enqueueBulkTasks, AgentTaskType } from "../../../../Services/agentTasks";

const LIFECYCLES = [
  "active",
  "in_repair",
  "in_storage",
  "retired",
  "disposed",
  "lost",
];

const TASK_TYPES: { value: AgentTaskType; label: string }[] = [
  { value: "scan_now", label: "Scan now" },
  { value: "collect_event_log", label: "Collect event log" },
  { value: "inventory_refresh", label: "Inventory refresh" },
];

type Props = {
  selectedIds: string[];
  onCleared: () => void;
};

const MassActionBar = ({ selectedIds, onCleared }: Props) => {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<null | "tag" | "lifecycle" | "task">(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [lifecycle, setLifecycle] = useState("active");
  const [taskType, setTaskType] = useState<AgentTaskType>("scan_now");

  const tagsQuery = useQuery({
    queryKey: ["device-tags"],
    queryFn: listDeviceTags,
  });

  const clear = () => {
    setMode(null);
    setSelectedTagIds([]);
    onCleared();
    queryClient.invalidateQueries({ queryKey: ["devices"] });
  };

  const tagMutation = useMutation({
    mutationFn: (action: "attach" | "detach") =>
      bulkTagDevices({
        deviceIds: selectedIds,
        tagIds: selectedTagIds,
        action,
      }),
    onSuccess: ({ affected }) => {
      toast.success(`${affected} tag assignment(s) updated`);
      clear();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? "Bulk tag failed"),
  });

  const lifecycleMutation = useMutation({
    mutationFn: () =>
      bulkLifecycleDevices({ deviceIds: selectedIds, lifecycle }),
    onSuccess: ({ affected }) => {
      toast.success(`${affected} device(s) updated`);
      clear();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? "Bulk lifecycle failed"),
  });

  const taskMutation = useMutation({
    mutationFn: () =>
      enqueueBulkTasks({ deviceIds: selectedIds, type: taskType }),
    onSuccess: ({ created }) => {
      toast.success(`${created} task(s) queued`);
      clear();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? "Bulk enqueue failed"),
  });

  if (selectedIds.length === 0) return null;

  return (
    <div className="sticky top-0 z-[60] bg-[#3C3C3C] text-white rounded-[10px] shadow-lg px-4 py-2 mb-3 flex flex-wrap items-center gap-3">
      <span className="text-[14px] font-bold">
        {selectedIds.length} selected
      </span>
      <button
        type="button"
        onClick={clear}
        className="text-[12px] text-[#B0B0B0] hover:text-white cursor-pointer"
      >
        clear
      </button>

      <div className="flex gap-2 ml-auto items-center">
        <ButtonPrimary
          icon={faTag}
          text="Tags"
          onClick={() => setMode(mode === "tag" ? null : "tag")}
        />
        <ButtonPrimary
          icon={faBoxArchive}
          text="Lifecycle"
          onClick={() =>
            setMode(mode === "lifecycle" ? null : "lifecycle")
          }
        />
        <ButtonPrimary
          icon={faPlay}
          text="Run task"
          onClick={() => setMode(mode === "task" ? null : "task")}
        />
      </div>

      {mode === "tag" && (
        <div className="w-full mt-2 bg-white text-[#3C3C3C] rounded-[8px] p-3">
          <div className="text-[12px] mb-2">
            Pick tags, then choose attach or detach:
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {(tagsQuery.data ?? []).map((tag: DeviceTag) => {
              const on = selectedTagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() =>
                    setSelectedTagIds((prev) =>
                      on
                        ? prev.filter((id) => id !== tag.id)
                        : [...prev, tag.id],
                    )
                  }
                  className={`rounded-full px-3 py-1 text-[12px] font-bold cursor-pointer ${
                    on ? "text-white" : "text-[#3C3C3C] border border-[#D0D0D0]"
                  }`}
                  style={on ? { backgroundColor: tag.color } : undefined}
                >
                  {tag.label}
                </button>
              );
            })}
            {tagsQuery.data?.length === 0 && (
              <span className="text-[12px] text-[#7a7a7a]">
                No tags defined yet — create one in Settings → Tags.
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <ButtonPrimary
              text={tagMutation.isPending ? "Attaching…" : "Attach"}
              onClick={() => tagMutation.mutate("attach")}
              disabled={
                tagMutation.isPending || selectedTagIds.length === 0
              }
            />
            <ButtonPrimary
              text={tagMutation.isPending ? "Detaching…" : "Detach"}
              onClick={() => tagMutation.mutate("detach")}
              disabled={
                tagMutation.isPending || selectedTagIds.length === 0
              }
            />
          </div>
        </div>
      )}

      {mode === "lifecycle" && (
        <div className="w-full mt-2 bg-white text-[#3C3C3C] rounded-[8px] p-3 flex items-center gap-2">
          <span className="text-[13px] shrink-0">Set lifecycle to</span>
          <div className="min-w-[200px]">
            <SelectSecondary
              options={LIFECYCLES.map((l) => ({
                value: l,
                label: l.replace("_", " "),
              }))}
              value={{ value: lifecycle, label: lifecycle.replace("_", " ") }}
              onSelect={(opt: any) => opt?.value && setLifecycle(opt.value)}
            />
          </div>
          <ButtonPrimary
            text={lifecycleMutation.isPending ? "Applying…" : "Apply"}
            onClick={() => lifecycleMutation.mutate()}
            disabled={lifecycleMutation.isPending}
          />
        </div>
      )}

      {mode === "task" && (
        <div className="w-full mt-2 bg-white text-[#3C3C3C] rounded-[8px] p-3 flex items-center gap-2">
          <span className="text-[13px] shrink-0">Queue task</span>
          <div className="min-w-[200px]">
            <SelectSecondary
              options={TASK_TYPES}
              value={TASK_TYPES.find((t) => t.value === taskType)}
              onSelect={(opt: any) =>
                opt?.value && setTaskType(opt.value as AgentTaskType)
              }
            />
          </div>
          <ButtonPrimary
            icon={faPlay}
            text={taskMutation.isPending ? "Queuing…" : "Queue"}
            onClick={() => taskMutation.mutate()}
            disabled={taskMutation.isPending}
          />
        </div>
      )}

      {mode === "task" && (
        <div className="w-full text-[11px] text-[#B0B0B0]">
          <FontAwesomeIcon icon={faPlay} /> Tasks are picked up by the agent on
          next poll. Inspect the device detail for status.
        </div>
      )}
    </div>
  );
};

export default MassActionBar;
