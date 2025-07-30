import {
  faCheckCircle,
  faEnvelope,
  faHome,
  faPhone,
  faPooStorm,
  faSignsPost,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type Props = {};

const UserInfo = (props: Props) => {
  return (
    <div className="w-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <div className="flex items-center">
        <img src="#" className="w-[85px] h-[85px]" />
        <div className="px-4">
          <div className="font-extrabold text-[#3C3C3C] text-[20px] pb-2">
            Marcin Nowakowski
          </div>
          <div className="text-[18px] text-[#30A712]">
            <FontAwesomeIcon icon={faCheckCircle} />
            <span className="px-2">Enabled</span>
          </div>
        </div>
      </div>
      <div className="py-4">
        <div className="bg-[#2B9AE9] rounded-[10px] w-fit px-4 py-2 font-bold text-[#FFFFFF]">
          Developers team
        </div>
      </div>
      <div>
        <div className="text-[#3C3C3C] text-[18px] font-bold pb-2">
          <FontAwesomeIcon icon={faEnvelope} />
          <span className="pl-3">nowakowskim@gmail.com</span>
        </div>
        <div className="text-[#3C3C3C] text-[18px] font-bold pb-2">
          <FontAwesomeIcon icon={faPhone} />
          <span className="pl-3">+48 776 730 238</span>
        </div>
        <div className="text-[#3C3C3C] text-[18px] font-bold pb-2">
          <FontAwesomeIcon icon={faHome} />
          <span className="pl-3">Ulicowa 64/20, Wroclaw</span>
        </div>
      </div>
    </div>
  );
};

export default UserInfo;
