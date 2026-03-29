import { faMouse } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Parameter from "../../../../Components/Lists/Parameter";

type Props = { mice: any };

const Mice = ({ mice }: Props) => {
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
      <div className="text-[20px] font-semibold text-[#3C3C3C]">
        <FontAwesomeIcon className="mr-2" icon={faMouse} />
        <span>Mice</span>
      </div>
      {mice.map((mouse: any) => (
        <div>
          <div className="text-[16px] font-semibold text-[#2B9AE9] pt-2">
            {mouse.name}
          </div>
          <div className="text-[14px] font-light text-[#3C3C3C] mb-2">
            {mouse.manufacturer}
          </div>
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
      ))}
    </div>
  );
};

export default Mice;
