import { faMouse } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import Parameter from "../../../../Components/Lists/Parameter";
import CardHeader from "../../../../Components/Headers/CardHeader";

type Props = { mice: any };

const Mice = ({ mice }: Props) => {
  const { t } = useTranslation();
  const parsePointingType = [
    "Unknown", // 0
    "Other", // 1
    "Mouse", // 2
    "Track Ball", // 3
    "Track Point", // 4
    "Glide Point", // 5
    "Touch Pad", // 6
    "Touch Screen", // 7
    "Pen", // 8
    "Optical Mouse", // 9
    "Trackpad", // 10
    "Multi-touch Pad", // 11
    "Gesture Pad", // 12
    "Head Tracker", // 13
    "Eye Tracker", // 14
    "Voice Control", // 15
    "Neural Input", // 16
  ];

  return (
    <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <CardHeader text={t("device.section.mice")} icon={faMouse} />
      {(mice ?? []).map((mouse: any, index: number) => (
        <div
          key={index}
          className="mt-2 pt-2 first:mt-0 first:pt-0 border-t border-[#F0F0F0] first:border-t-0"
        >
          <div className="text-[16px] font-semibold text-[#2B9AE9]">
            {mouse.name}
          </div>
          <div className="text-[13px] font-light text-[#9a9a9a] mb-1">
            {mouse.manufacturer}
          </div>
          <div className="divide-y divide-[#F0F0F0]">
            <Parameter
              name="Pointing type"
              value={parsePointingType[mouse.pointing_type]}
            />
            <Parameter name="Device ID" value={mouse.pnp_device_id} />
            <Parameter name="Operational status" value={mouse.status} />
            {mouse.buttons !== 0 && (
              <Parameter name="Buttons" value={mouse.buttons} />
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Mice;
