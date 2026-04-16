import { useQuery } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserCheck } from "@fortawesome/free-solid-svg-icons";
import { getReports } from "../../../../Services/reports";
import { formatNumber } from "../helpers";

const ActiveUsers = () => {
  const { data } = useQuery({
    queryKey: ["report", "users-inactive"],
    queryFn: () => getReports("users-inactive"),
  });

  const items = data ?? [];
  const total = items.reduce((s, d) => s + d.value, 0);
  const inactive = items
    .filter((d) => {
      const l = d.label.toLowerCase();
      return l.includes("90") || l.includes("180") || l.includes("365") || l.includes("year");
    })
    .reduce((s, d) => s + d.value, 0);
  const active = total - inactive;

  return (
    <div className="flex h-full w-full items-center gap-4 px-5">
      <div className="flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-[14px] bg-[#D2F8E5]">
        <FontAwesomeIcon icon={faUserCheck} className="text-[24px] text-[#2ECC71]" />
      </div>
      <div className="min-w-0">
        <div className="text-[36px] font-extrabold leading-none text-[#3C3C3C]">
          {formatNumber(active)}
        </div>
        <div className="text-[13px] font-semibold text-[#8A8A8A]">Active Users</div>
        <div className="text-[11px] text-[#B0B0B0]">{inactive} inactive</div>
      </div>
    </div>
  );
};

export default ActiveUsers;
