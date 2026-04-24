import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import moment from "moment";
import { faPlay, faRotate, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  listDeviceTasks,
  enqueueDeviceTask,
  cancelDeviceTask,
  AgentTask,
  AgentTaskType,
} from "../../../../Services/agentTasks";

const TASK_TYPES: { value: AgentTaskType; label: string }[] = [
  { value: "scan_now", label: "Scan now" },
  { value: "collect_event_log", label: "Collect event log" },
  { value: "inventory_refresh", label: "Inventory refresh" },
];

const STATE_COLOR: Record<string, string> = {
  queued: "#2B9AE9",
  leased: "#F1C40F",
  completed: "#30A712",
  failed: "#F3606E",
  cancelled: "#8A8A8A",
  expired: "#8E44AD",
};

type Props = { ticketId: string; deviceId: string | null | undefined };

const TicketDiagnostics = ({ ticketId, deviceId }: Props) => {
  const queryClient = useQueryClient();
  const [type, setType] = useState<AgentTaskType>("scan_now");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const tasksQuery = useQuery({
    queryKey: ["ticket-diagnostics", deviceId, ticketId],
    queryFn: () => listDeviceTasks(deviceId!),
    enabled: Boolean(deviceId),
    refetchInterval: 10000,
  });

  const enqueueMutation = useMutation({
    mutationFn: () =>
      enqueueDeviceTask(deviceId!, {
        type,
        payload: { ticketId },
      }),
    onSuccess: () => {
      toast.success("Diagnostic queued — waiting for agent");
      queryClient.invalidateQueries({
        queryKey: ["ticket-diagnostics", deviceId, ticketId],
      });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? "Enqueue failed"),
  });

  const cancelMutation = useMutation({
    mutationFn: (taskId: string) => cancelDeviceTask(taskId),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["ticket-diagnostics", deviceId, ticketId],
      }),
  });

  if (!deviceId) return null;

  const relevantTasks = (tasksQuery.data ?? []).filter(
    (t: AgentTask) => t.payload?.ticketId === ticketId,
  );

  return (
    <div className="mt-4 rounded-[8px] border border-[#E0E0E0] bg-[#FAFAFA] p-3">
      <div className="flex items-center gap-2">
        <FontAwesomeIcon icon={faPlay} className="text-[#2B9AE9]" />
        <span className="text-[13px] font-bold text-[#3C3C3C]">
          Diagnostics
        </span>
        <span className="text-[11px] text-[#7a7a7a]">
          Runs on the device via agent
        </span>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as AgentTaskType)}
          className="h-[30px] rounded-[6px] border border-[#D0D0D0] px-2 text-[12px]"
        >
          {TASK_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => enqueueMutation.mutate()}
          disabled={enqueueMutation.isPending}
          className="h-[30px] rounded-[6px] bg-[#2B9AE9] text-white px-3 text-[12px] font-bold cursor-pointer disabled:opacity-50"
        >
          {enqueueMutation.isPending ? "Queuing…" : "Run"}
        </button>
      </div>

      {relevantTasks.length > 0 && (
        <div className="mt-3 space-y-1">
          {relevantTasks.map((task: AgentTask) => (
            <div
              key={task.id}
              className="rounded-[6px] border border-[#E8E8E8] bg-white px-2 py-1 text-[12px]"
            >
              <div className="flex items-center gap-2">
                <span
                  className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                  style={{ backgroundColor: STATE_COLOR[task.state] }}
                >
                  {task.state}
                </span>
                <span className="font-bold text-[#3C3C3C]">{task.type}</span>
                <span className="text-[10px] text-[#9a9a9a] ml-auto">
                  {moment(task.createdAt).fromNow()}
                </span>
                {["queued", "leased"].includes(task.state) && (
                  <button
                    type="button"
                    onClick={() => cancelMutation.mutate(task.id)}
                    className="text-[#F3606E] hover:text-[#C0392B] cursor-pointer ml-1"
                    title="Cancel"
                  >
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                )}
                {task.state === "completed" && (
                  <button
                    type="button"
                    onClick={() =>
                      setExpanded((prev) => ({
                        ...prev,
                        [task.id]: !prev[task.id],
                      }))
                    }
                    className="text-[#2B9AE9] text-[11px] hover:underline cursor-pointer ml-1"
                  >
                    {expanded[task.id] ? "hide" : "show result"}
                  </button>
                )}
              </div>
              {task.lastError && (
                <div className="text-[11px] text-[#F3606E] mt-0.5">
                  {task.lastError}
                </div>
              )}
              {expanded[task.id] && task.result && (
                <pre className="mt-1 rounded bg-[#FAFAFA] p-2 text-[10px] overflow-x-auto max-h-[240px]">
                  {JSON.stringify(task.result, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}

      {relevantTasks.length === 0 && (
        <div className="mt-2 text-[11px] text-[#9a9a9a]">
          No diagnostics yet for this ticket.
        </div>
      )}

      <div className="mt-2 flex items-center gap-1 text-[10px] text-[#9a9a9a]">
        <FontAwesomeIcon icon={faRotate} />
        Auto-refreshes every 10s while open
      </div>
    </div>
  );
};

export default TicketDiagnostics;
