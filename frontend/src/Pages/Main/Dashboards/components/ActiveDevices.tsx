import { faDesktop } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type Props = {};

const ActiveDevices = (props: Props) => {
  return (
    <div className="bg-[#FFFFFF] h-full p-2 rounded-[10px]">
      <div className="w-[110px] h-full bg-[#D7EEFF] rounded-[10px] flex justify-center items-center">
        <FontAwesomeIcon
          icon={faDesktop}
          className="text-[#2B9AE9] text-[40px]"
        />
      </div>
    </div>
  );
};

export default ActiveDevices;
