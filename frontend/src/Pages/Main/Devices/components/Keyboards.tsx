import { useTranslation } from "react-i18next";
import Parameter from "../../../../Components/Lists/Parameter";
import { faKeyboard } from "@fortawesome/free-solid-svg-icons";
import CardHeader from "../../../../Components/Headers/CardHeader";

type Props = { keyboards: any };

const Keyboards = ({ keyboards }: Props) => {
  const { t } = useTranslation();
  return (
    <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <CardHeader text={t("device.section.keyboards")} icon={faKeyboard} />
      {(keyboards ?? []).map((keyboard: any, index: number) => (
        <div
          key={index}
          className="mt-2 pt-2 first:mt-0 first:pt-0 border-t border-[#F0F0F0] first:border-t-0"
        >
          <div className="text-[16px] font-semibold text-[#2B9AE9]">
            {keyboard.name}
          </div>
          <div className="text-[13px] font-light text-[#9a9a9a] mb-1">
            {keyboard.manufacturer || "Manufacturer not available"}
          </div>
          <div className="divide-y divide-[#F0F0F0]">
            <Parameter name="Function keys" value={keyboard.function_keys} />
            <Parameter name="Device ID" value={keyboard.pnp_device_id} />
            <Parameter name="Operational status" value={keyboard.status} />
            <Parameter name="Layout" value={keyboard.layout} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default Keyboards;
