import { useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
      toast.success(t("device.massAction.tagsUpdated", { count: affected }));
      clear();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("device.massAction.tagsFailed")),
  });

  const lifecycleMutation = useMutation({
    mutationFn: () =>
      bulkLifecycleDevices({ deviceIds: selectedIds, lifecycle }),
    onSuccess: ({ affected }) => {
      toast.success(t("device.massAction.devicesUpdated", { count: affected }));
      clear();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("device.massAction.lifecycleFailed")),
  });

  const taskMutation = useMutation({
    mutationFn: () =>
      enqueueBulkTasks({ deviceIds: selectedIds, type: taskType }),
    onSuccess: ({ created }) => {
      toast.success(t("device.massAction.tagsUpdated", { count: created }));
      clear();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("device.massAction.queueFailed")),
  });

  if (selectedIds.length === 0) return null;

  return (
    <div className="sticky top-0 z-[60] bg-white text-[#3C3C3C] rounded-[10px] shadow-lg border border-[#E0E0E0] px-4 py-2 mb-3 flex flex-wrap items-center gap-3">
      <span className="text-[14px] font-bold">
        {t("device.massAction.selected", { count: selectedIds.length })}
      </span>
      <button
        type="button"
        onClick={clear}
        className="text-[12px] text-[#9a9a9a] hover:text-[#3C3C3C] cursor-pointer"
      >
        {t("device.massAction.clear")}
      </button>

      <div className="flex gap-2 ml-auto items-center">
        <ButtonPrimary
          icon={faTag}
          text={t("device.massAction.tags")}
          onClick={() => setMode(mode === "tag" ? null : "tag")}
        />
        <ButtonPrimary
          icon={faBoxArchive}
          text={t("device.massAction.lifecycle")}
          onClick={() =>
            setMode(mode === "lifecycle" ? null : "lifecycle")
          }
        />
        <ButtonPrimary
          icon={faPlay}
          text={t("device.massAction.runTask")}
          onClick={() => setMode(mode === "task" ? null : "task")}
        />
      </div>

      {mode === "tag" && (
        <div className="w-full mt-2 bg-white text-[#3C3C3C] rounded-[8px] p-3">
          <div className="text-[12px] mb-2">
            {t("device.massAction.pickTags")}
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
                {t("device.massAction.noTags")}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <ButtonPrimary
              text={tagMutation.isPending ? t("device.massAction.attaching") : t("device.massAction.attach")}
              onClick={() => tagMutation.mutate("attach")}
              disabled={
                tagMutation.isPending || selectedTagIds.length === 0
              }
            />
            <ButtonPrimary
              text={tagMutation.isPending ? t("device.massAction.detaching") : t("device.massAction.detach")}
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
          <span className="text-[13px] shrink-0">{t("device.massAction.setLifecycleTo")}</span>
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
            text={lifecycleMutation.isPending ? t("common.applying") : t("common.apply")}
            onClick={() => lifecycleMutation.mutate()}
            disabled={lifecycleMutation.isPending}
          />
        </div>
      )}

      {mode === "task" && (
        <div className="w-full mt-2 bg-white text-[#3C3C3C] rounded-[8px] p-3 flex items-center gap-2">
          <span className="text-[13px] shrink-0">{t("device.massAction.queueTask")}</span>
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
            text={taskMutation.isPending ? t("device.massAction.queuing") : t("device.massAction.queue")}
            onClick={() => taskMutation.mutate()}
            disabled={taskMutation.isPending}
          />
        </div>
      )}

      {mode === "task" && (
        <div className="w-full text-[11px] text-[#9a9a9a]">
          <FontAwesomeIcon icon={faPlay} /> {t("device.massAction.taskInfo")}
        </div>
      )}
    </div>
  );
};

export default MassActionBar;
