import { faDesktop } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Parameter from "../../../../Components/Lists/Parameter";
import CardHeader from "../../../../Components/Headers/CardHeader";

type Props = { screens: any };

const Monitors = ({ screens }: Props) => {
  return (
    <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <CardHeader text="Screens" icon={faDesktop} />
      {screens.map((screen: any) => (
        <div>
          <div className="text-[16px] font-semibold text-[#2B9AE9] pt-2">
            {screen.name}
          </div>
          <div className="text-[14px] font-light text-[#3C3C3C] mb-2">
            {screen.manufacturer || "Manufacturer not available"}
          </div>
          <Parameter
            name="Dimensions"
            value={`${screen.screen_width} x ${screen.screen_height}`}
          />
          <Parameter name="Device ID" value={screen.pnp_device_id} />
          <Parameter name="Operational status" value={screen.status} />
        </div>
      ))}
    </div>
  );
};

export default Monitors;
