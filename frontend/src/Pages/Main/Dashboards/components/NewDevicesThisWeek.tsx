import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { fleetOverview } from "../../../../Services/fleet";

const NewDevicesThisWeek = () => {
  const { t } = useTranslation();
  const { data } = useQuery({
    queryKey: ["fleet-overview"],
    queryFn: fleetOverview,
    refetchInterval: 60000,
  });

  return (
    <div className="flex h-full w-full items-center gap-4 px-5">
      <div className="flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-[14px] bg-[#D5F5E3]">
        <FontAwesomeIcon icon={faPlus} className="text-[24px] text-[#2ECC71]" />
      </div>
      <div className="min-w-0">
        <div className="text-[36px] font-extrabold leading-none text-[#3C3C3C]">
          {data?.newInLastWeek ?? 0}
        </div>
        <div className="text-[13px] font-semibold text-[#8A8A8A]">
          {t("dashboard.widget.newDevices")}
        </div>
        <div className="text-[11px] text-[#B0B0B0]">
          {t("dashboard.widget.newDevices.subtitle")}
        </div>
      </div>
    </div>
  );
};

export default NewDevicesThisWeek;
