import { faDesktop } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import Parameter from "../../../../Components/Lists/Parameter";
import CardHeader from "../../../../Components/Headers/CardHeader";

type Props = { screens: any };

const Monitors = ({ screens }: Props) => {
  const { t } = useTranslation();
  return (
    <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <CardHeader text={t("device.section.monitors")} icon={faDesktop} />
      {(screens ?? []).map((screen: any, index: number) => (
        <div
          key={index}
          className="mt-2 pt-2 first:mt-0 first:pt-0 border-t border-[#F0F0F0] first:border-t-0"
        >
          <div className="text-[16px] font-semibold text-[#2B9AE9]">
            {screen.name}
          </div>
          <div className="text-[13px] font-light text-[#9a9a9a] mb-1">
            {screen.manufacturer || "Manufacturer not available"}
          </div>
          <div className="divide-y divide-[#F0F0F0]">
            <Parameter
              name="Dimensions"
              value={`${screen.screen_width} x ${screen.screen_height}`}
            />
            <Parameter name="Device ID" value={screen.pnp_device_id} />
            <Parameter name="Operational status" value={screen.status} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default Monitors;
