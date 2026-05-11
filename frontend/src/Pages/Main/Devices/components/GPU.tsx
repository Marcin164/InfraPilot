import { useTranslation } from "react-i18next";
import Parameter from "../../../../Components/Lists/Parameter";
import CardHeader from "../../../../Components/Headers/CardHeader";
import Badge from "../../../../Components/Badges/Badge";
import { faDisplay } from "@fortawesome/free-solid-svg-icons";

type Props = {
  gpus: any;
};

const GPU = ({ gpus }: Props) => {
  const { t } = useTranslation();
  return (
    <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4 overflow-hidden text-wrap wrap-break-word break-normal text-ellipsis">
      <CardHeader text={t("device.section.gpu")} icon={faDisplay} />
      {gpus.map((gpu: any) => (
        <div className="inline-block mr-4">
          <div className="text-[16px] font-semibold text-[#2B9AE9] pt-2">
            {gpu.name}
          </div>
          <div className="flex my-2">
            {gpu.adapter_ram > 0 && (
              <Badge text={gpu.adapter_ram} className="bg-[#2B9AE9]" />
            )}
            <Badge
              text={`${gpu.max_refresh_rate} MHz`}
              className="bg-[#2B9AE9]"
            />
            <Badge text={gpu.current_resolution} className="bg-[#2B9AE9]" />
          </div>
          <Parameter name="Procesor" value={gpu.video_processor} />
          <Parameter name="Drivers Version" value={gpu.driver_version} />
        </div>
      ))}
    </div>
  );
};

export default GPU;
