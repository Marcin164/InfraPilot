import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import moment from "moment";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { listRecentAgentTasks, RecentAgentTask, AgentTaskState } from "../../Services/agentTasks";
import { usePermissions } from "../../Hooks/usePermissions";
import { hasPermission } from "../../Constants/navigation";

const TERMINAL_STATES: AgentTaskState[] = ["completed", "failed", "cancelled", "expired"];

const STATE_COLOR: Record<AgentTaskState, string> = {
  queued: "#2B9AE9",
  leased: "#F1C40F",
  completed: "#30A712",
  failed: "#F3606E",
  cancelled: "#8A8A8A",
  expired: "#8E44AD",
};

/**
 * Lives in the Topbar (mounted once, stays mounted across all /admin/*
 * navigation) so network_scan progress keeps polling and toasts on
 * completion even when the user isn't on the IPAM page -- Ipam.tsx's own
 * inline per-subnet progress badge only exists while that page is
 * mounted, which is exactly the gap this fills.
 */
const ScanActivityIndicator = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const toastedTaskIds = useRef<Set<string>>(new Set());

  const permissionsQuery = usePermissions();
  const canView = hasPermission(
    ["devices.taskSchedule.manage", "devices.view"],
    permissionsQuery.data,
  );

  const tasksQuery = useQuery({
    queryKey: ["network-scan-tasks"],
    queryFn: () => listRecentAgentTasks("network_scan", 20),
    enabled: canView,
    refetchInterval: (query) => {
      const tasks = query.state.data as RecentAgentTask[] | undefined;
      const active = tasks?.some((t) => !TERMINAL_STATES.includes(t.state));
      return active ? 8000 : 30000;
    },
  });

  const tasks = tasksQuery.data ?? [];
  const activeCount = tasks.filter((t) => !TERMINAL_STATES.includes(t.state)).length;

  useEffect(() => {
    for (const task of tasks) {
      if (!TERMINAL_STATES.includes(task.state)) continue;
      if (toastedTaskIds.current.has(task.id)) continue;
      toastedTaskIds.current.add(task.id);

      if (task.state === "completed") {
        const hostCount = task.result?.hosts?.length ?? 0;
        toast.success(t("topbar.scanActivity.completedToast", { device: task.deviceName, count: hostCount }));
      } else if (task.state === "failed") {
        toast.error(t("topbar.scanActivity.failedToast", { device: task.deviceName, error: task.lastError }));
      }
    }
  }, [tasks, t]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!canView) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative h-[36px] w-[36px] rounded-full hover:bg-[#F0F0F0] flex items-center justify-center cursor-pointer"
        title={t("topbar.scanActivity.title")}
      >
        <FontAwesomeIcon icon={faMagnifyingGlass} className="text-[#535353]" />
        {activeCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#2B9AE9] text-white text-[10px] font-bold flex items-center justify-center">
            {activeCount > 99 ? "99+" : activeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[42px] z-50 w-[380px] max-h-[500px] overflow-auto rounded-[10px] bg-white shadow-xl border border-[#EFEFEF]">
          <div className="px-4 py-2 border-b border-[#F0F0F0]">
            <span className="font-bold text-[14px]">{t("topbar.scanActivity.title")}</span>
          </div>
          {tasks.length === 0 ? (
            <div className="px-4 py-6 text-[13px] text-[#7a7a7a] text-center">
              {t("topbar.scanActivity.none")}
            </div>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className="px-4 py-2 border-b border-[#F5F5F5]">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block w-[60px] shrink-0 text-center rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                    style={{ backgroundColor: STATE_COLOR[task.state] }}
                  >
                    {task.state}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-bold text-[#3C3C3C] truncate">
                      {task.deviceName}
                      {task.payload?.cidr ? ` · ${task.payload.cidr}` : ""}
                    </div>
                    <div className="text-[11px] text-[#9a9a9a]">
                      {moment(task.createdAt).fromNow()}
                      {task.state === "completed" &&
                        ` · ${t("topbar.scanActivity.hostsFound", { count: task.result?.hosts?.length ?? 0 })}`}
                    </div>
                    {task.state === "failed" && task.lastError && (
                      <div className="text-[11px] text-[#F3606E] truncate" title={task.lastError}>
                        {task.lastError}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ScanActivityIndicator;
