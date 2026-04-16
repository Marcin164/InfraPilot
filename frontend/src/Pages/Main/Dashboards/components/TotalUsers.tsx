import { useQuery } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsers } from "@fortawesome/free-solid-svg-icons";
import { getReports } from "../../../../Services/reports";
import { formatNumber } from "../helpers";

const TotalUsers = () => {
  const { data } = useQuery({
    queryKey: ["report", "users-by-department"],
    queryFn: () => getReports("users-by-department"),
  });

  const total = (data ?? []).reduce((s, d) => s + d.value, 0);

  return (
    <div className="flex h-full w-full items-center gap-4 px-5">
      <div className="flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-[14px] bg-[#D7EEFF]">
        <FontAwesomeIcon icon={faUsers} className="text-[24px] text-[#2B9AE9]" />
      </div>
      <div className="min-w-0">
        <div className="text-[36px] font-extrabold leading-none text-[#3C3C3C]">
          {formatNumber(total)}
        </div>
        <div className="text-[13px] font-semibold text-[#8A8A8A]">Total Users</div>
      </div>
    </div>
  );
};

export default TotalUsers;
