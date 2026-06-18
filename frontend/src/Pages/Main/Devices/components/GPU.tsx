import { useTranslation } from "react-i18next";
import Parameter from "../../../../Components/Lists/Parameter";
import CardHeader from "../../../../Components/Headers/CardHeader";
import StatusPill from "../../../../Components/Badges/StatusPill";
import { faDisplay } from "@fortawesome/free-solid-svg-icons";

type Props = {
  gpus: any;
};

const GPU = ({ gpus }: Props) => {
  const { t } = useTranslation();
  return (
    <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4 overflow-hidden text-wrap wrap-break-word break-normal text-ellipsis">
      <CardHeader text={t("device.section.gpu")} icon={faDisplay} />
      {(gpus ?? []).map((gpu: any, index: number) => (
        <div
          key={index}
          className="mt-2 pt-2 first:mt-0 first:pt-0 border-t border-[#F0F0F0] first:border-t-0"
        >
          <div className="text-[16px] font-semibold text-[#2B9AE9]">
            {gpu.name}
          </div>
          <div className="flex flex-wrap gap-1.5 my-2">
            {gpu.adapter_ram > 0 && <StatusPill tone="blue" text={gpu.adapter_ram} />}
            <StatusPill tone="blue" text={`${gpu.max_refresh_rate} MHz`} />
            <StatusPill tone="blue" text={gpu.current_resolution} />
          </div>
          <div className="divide-y divide-[#F0F0F0]">
            <Parameter name="Procesor" value={gpu.video_processor} />
            <Parameter name="Drivers Version" value={gpu.driver_version} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default GPU;
