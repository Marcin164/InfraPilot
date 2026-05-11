import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOutletContext } from "react-router";
import { toast } from "react-toastify";
import moment from "moment";
import { faPlay, faRotate, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import CardHeader from "../../../../Components/Headers/CardHeader";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import Input from "../../../../Components/Inputs/Input";
import SelectSecondary from "../../../../Components/Inputs/SelectSecondary";
import {
  AgentTask,
  AgentTaskType,
  listDeviceTasks,
  enqueueDeviceTask,
  cancelDeviceTask,
} from "../../../../Services/agentTasks";

const TASK_TYPES: { value: AgentTaskType; label: string }[] = [
  { value: "scan_now", label: "Scan now" },
  { value: "collect_event_log", label: "Collect event log" },
  { value: "inventory_refresh", label: "Inventory refresh" },
  { value: "custom", label: "Custom" },
];

const STATE_COLOR: Record<string, string> = {
  queued: "#2B9AE9",
  leased: "#F1C40F",
  completed: "#30A712",
  failed: "#F3606E",
  cancelled: "#8A8A8A",
  expired: "#8E44AD",
};

const Tasks = () => {
  const { t: tr } = useTranslation();
  const device: any = useOutletContext();
  const deviceId = device?.data?.id;
  const queryClient = useQueryClient();

  const [type, setType] = useState<AgentTaskType>("scan_now");
  const [payload, setPayload] = useState("");

  const tasksQuery = useQuery({
    queryKey: ["device-tasks", deviceId],
    queryFn: () => listDeviceTasks(deviceId),
    enabled: Boolean(deviceId),
    refetchInterval: 15000,
  });

  const enqueueMutation = useMutation({
    mutationFn: () => {
      let parsedPayload: Record<string, any> | undefined;
      if (payload.trim()) {
        try {
          parsedPayload = JSON.parse(payload);
        } catch {
          throw new Error("Payload must be valid JSON");
        }
      }
      return enqueueDeviceTask(deviceId, {
        type,
        payload: parsedPayload,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["device-tasks", deviceId] });
      setPayload("");
      toast.success(tr("toast.success.taskQueued"));
    },
    onError: (err: any) =>
      toast.error(err?.message ?? err?.response?.data?.message ?? "Enqueue failed"),
  });

  const cancelMutation = useMutation({
    mutationFn: (taskId: string) => cancelDeviceTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["device-tasks", deviceId] });
      toast.success(tr("toast.success.taskCancelled"));
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? "Cancel failed"),
  });

  const tasks = tasksQuery.data ?? [];
  const active = tasks.filter((t: AgentTask) =>
    ["queued", "leased"].includes(t.state),
  );
  const finished = tasks.filter(
    (t: AgentTask) => !["queued", "leased"].includes(t.state),
  );

  return (
    <div className="space-y-4">
      <div className="bg-white shadow-xl rounded-[10px] p-4">
        <CardHeader text={tr("device.section.tasksEnqueue")} icon={faPlay} />
        <p className="text-[12px] text-[#7a7a7a] mt-2">
          Queued tasks are picked up by the agent on its next HMAC-authenticated
          poll. Lease window is 15 minutes; expired leases auto-requeue up to 3
          times.
        </p>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
          <SelectSecondary
            label="Task type"
            options={TASK_TYPES}
            value={TASK_TYPES.find((t) => t.value === type)}
            onSelect={(opt: any) =>
              opt?.value && setType(opt.value as AgentTaskType)
            }
          />
          <Input
            className="md:col-span-2"
            label="Payload"
            value={payload}
            handleChange={setPayload}
            placeholder='Optional JSON, e.g. {"source":"manual"}'
          />
        </div>
        <div className="mt-3">
          <ButtonPrimary
            icon={faPlay}
            text={enqueueMutation.isPending ? "Queuing…" : "Queue task"}
            onClick={() => enqueueMutation.mutate()}
            disabled={enqueueMutation.isPending || !deviceId}
          />
        </div>
      </div>

      <div className="bg-white shadow-xl rounded-[10px] p-4">
        <div className="flex items-center justify-between">
          <CardHeader text={tr("device.section.tasksActive")} icon={faRotate} />
          <span className="text-[12px] text-[#7a7a7a]">
            auto-refresh 15s
          </span>
        </div>
        {active.length === 0 ? (
          <div className="mt-3 text-[13px] text-[#7a7a7a]">
            No active tasks.
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {active.map((t) => (
              <TaskRow
                key={t.id}
                task={t}
                onCancel={() => cancelMutation.mutate(t.id)}
              />
            ))}
          </div>
        )}
      </div>

      {finished.length > 0 && (
        <div className="bg-white shadow-xl rounded-[10px] p-4">
          <CardHeader text={tr("device.section.tasksHistory")} icon={faRotate} />
          <div className="mt-3 space-y-2">
            {finished.slice(0, 50).map((t) => (
              <TaskRow key={t.id} task={t} onCancel={null} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const TaskRow = ({
  task,
  onCancel,
}: {
  task: AgentTask;
  onCancel: (() => void) | null;
}) => (
  <div className="flex items-start gap-3 rounded-[8px] border border-[#E0E0E0] px-3 py-2">
    <span
      className="inline-block w-[70px] text-center rounded-full px-2 py-0.5 text-[11px] font-bold text-white mt-0.5"
      style={{ backgroundColor: STATE_COLOR[task.state] }}
    >
      {task.state}
    </span>
    <div className="flex-1 min-w-0">
      <div className="font-bold text-[13px] text-[#3C3C3C]">{task.type}</div>
      <div className="text-[11px] text-[#9a9a9a]">
        queued {moment(task.createdAt).format("DD.MM.YYYY HH:mm:ss")}
        {task.completedAt && (
          <>
            {" · "}finished {moment(task.completedAt).format("DD.MM.YYYY HH:mm:ss")}
          </>
        )}
        {task.attempts > 0 && <> · attempts: {task.attempts}</>}
      </div>
      {task.lastError && (
        <div className="text-[11px] text-[#F3606E] mt-1">
          Last error: {task.lastError}
        </div>
      )}
      {task.payload && Object.keys(task.payload).length > 0 && (
        <pre className="mt-1 text-[11px] text-[#7a7a7a] bg-[#FAFAFA] rounded p-1 overflow-x-auto">
          {JSON.stringify(task.payload, null, 2)}
        </pre>
      )}
    </div>
    {onCancel && ["queued", "leased"].includes(task.state) && (
      <button
        type="button"
        onClick={onCancel}
        className="text-[12px] text-[#F3606E] hover:underline flex items-center gap-1 cursor-pointer"
      >
        <FontAwesomeIcon icon={faXmark} />
        Cancel
      </button>
    )}
  </div>
);

export default Tasks;
