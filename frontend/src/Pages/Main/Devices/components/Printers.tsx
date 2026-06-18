import {
  faPrint,
  faShare,
  faXmarkCircle,
} from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import StatusPill from "../../../../Components/Badges/StatusPill";
import Parameter from "../../../../Components/Lists/Parameter";
import CardHeader from "../../../../Components/Headers/CardHeader";

type Props = { printers: any };

const Printers = ({ printers }: Props) => {
  const { t } = useTranslation();
  return (
    <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <CardHeader text={t("device.section.printers")} icon={faPrint} />
      {(printers ?? []).map((printer: any, index: number) => (
        <div
          key={index}
          className="mt-2 pt-2 first:mt-0 first:pt-0 border-t border-[#F0F0F0] first:border-t-0"
        >
          <div className="text-[16px] font-semibold text-[#2B9AE9]">
            {printer.name}
          </div>
          <div className="text-[13px] font-light text-[#9a9a9a] mb-1 overflow-hidden text-ellipsis">
            {printer.port}
          </div>
          <div className="divide-y divide-[#F0F0F0] mb-2">
            <Parameter name="Device ID" value={printer.pnp_device_id} />
            <Parameter name="Driver" value={printer.driver} />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {!printer.default && (
              <StatusPill tone="blue" text={t("device.section.printers.default")} />
            )}
            <StatusPill
              icon={printer.shared ? faShare : faXmarkCircle}
              tone={printer.shared ? "green" : "gray"}
              text={printer.shared ? "Shared" : "Not shared"}
            />
            <StatusPill tone={printer.work_offline ? "amber" : "green"} text={printer.work_offline ? "Offline" : "Online"} />
            {printer.status && <StatusPill tone="blue" text={printer.status} />}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Printers;
