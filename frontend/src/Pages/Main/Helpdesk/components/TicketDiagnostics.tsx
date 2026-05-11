import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import moment from "moment";
import { faPlay, faRotate, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import SelectSecondary from "../../../../Components/Inputs/SelectSecondary";
import {
  listDeviceTasks,
  enqueueDeviceTask,
  cancelDeviceTask,
  AgentTask,
  AgentTaskType,
} from "../../../../Services/agentTasks";

const TASK_TYPE_VALUES: AgentTaskType[] = [
  "scan_now",
  "collect_event_log",
  "inventory_refresh",
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
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [type, setType] = useState<AgentTaskType>("scan_now");

  const TASK_TYPES = TASK_TYPE_VALUES.map((v) => ({
    value: v,
    label: t(`helpdesk.diag.task.${v}`),
  }));
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
      toast.success(t("toast.success.diagnosticQueued"));
      queryClient.invalidateQueries({
        queryKey: ["ticket-diagnostics", deviceId, ticketId],
      });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("helpdesk.diag.enqueueFailed")),
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
          {t("helpdesk.diag.title")}
        </span>
        <span className="text-[11px] text-[#7a7a7a]">
          {t("helpdesk.diag.subtitle")}
        </span>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <div className="flex-1 min-w-[160px]">
          <SelectSecondary
            options={TASK_TYPES}
            value={TASK_TYPES.find((t) => t.value === type)}
            onSelect={(opt: any) =>
              opt?.value && setType(opt.value as AgentTaskType)
            }
          />
        </div>
        <ButtonPrimary
          icon={faPlay}
          text={enqueueMutation.isPending ? t("helpdesk.diag.queuing") : t("helpdesk.diag.run")}
          onClick={() => enqueueMutation.mutate()}
          disabled={enqueueMutation.isPending}
        />
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
                  {t(`helpdesk.diag.state.${task.state}` as any, { defaultValue: task.state })}
                </span>
                <span className="font-bold text-[#3C3C3C]">
                  {t(`helpdesk.diag.task.${task.type}` as any, { defaultValue: task.type })}
                </span>
                <span className="text-[10px] text-[#9a9a9a] ml-auto">
                  {moment(task.createdAt).fromNow()}
                </span>
                {["queued", "leased"].includes(task.state) && (
                  <button
                    type="button"
                    onClick={() => cancelMutation.mutate(task.id)}
                    className="text-[#F3606E] hover:text-[#C0392B] cursor-pointer ml-1"
                    title={t("helpdesk.diag.cancel")}
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
                    {expanded[task.id] ? t("helpdesk.diag.hide") : t("helpdesk.diag.show")}
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
          {t("helpdesk.diag.none")}
        </div>
      )}

      <div className="mt-2 flex items-center gap-1 text-[10px] text-[#9a9a9a]">
        <FontAwesomeIcon icon={faRotate} />
        {t("helpdesk.diag.autorefresh")}
      </div>
    </div>
  );
};

export default TicketDiagnostics;
