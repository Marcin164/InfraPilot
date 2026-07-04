import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faServer } from "@fortawesome/free-solid-svg-icons";
import { useDashboardData } from "../DashboardDataContext";

const NetworkBackupStatus = () => {
  const data = useDashboardData("network-backup-status");

  const ok = data.find((d) => d.label === "ok")?.value ?? 0;
  const failed = data.find((d) => d.label === "failed")?.value ?? 0;
  const total = ok + failed;

  return (
    <div className="flex h-full w-full items-center gap-4 px-5">
      <div className="flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-[14px] bg-[#E1E4F7]">
        <FontAwesomeIcon icon={faServer} className="text-[24px] text-[#5C6BC0]" />
      </div>
      <div className="min-w-0">
        <div className="text-[36px] font-extrabold leading-none text-[#3C3C3C]">
          {ok}/{total}
        </div>
        <div className="text-[13px] font-semibold text-[#8A8A8A]">Config Backups</div>
        <div className={`text-[11px] ${failed > 0 ? "font-bold text-[#E8734A]" : "text-[#B0B0B0]"}`}>
          {failed > 0 ? `${failed} failed` : "all up to date"}
        </div>
      </div>
    </div>
  );
};

export default NetworkBackupStatus;
