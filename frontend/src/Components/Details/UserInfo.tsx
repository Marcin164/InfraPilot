import {
  faCheckCircle,
  faEnvelope,
  faHome,
  faPhone,
  faXmarkCircle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { twMerge } from "tailwind-merge";

type Props = {
  displayName: string;
  enabled: boolean;
  department: string;
  email: string;
  phone: string;
  streetAddress: string;
  postalCode: string;
  city: string;
  username: string;
  distinguishedName: string;
};

const UserInfo = ({
  displayName,
  enabled,
  department,
  email,
  phone,
  streetAddress,
  postalCode,
  city,
  username,
  distinguishedName,
}: Props) => {
  return (
    <div className="w-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <div className="flex items-center">
        <img src="#" className="w-[85px] h-[85px]" />
        <div className="px-4">
          <div className="font-extrabold text-[#3C3C3C] text-[20px]">
            {displayName}
          </div>
          <div className="text-[#B3B3B3] text-[14px] pb-2">{username}</div>
          <div
            className={twMerge(
              "text-[18px]",
              enabled ? "text-[#30A712]" : "text-[#BC0E0E]"
            )}
          >
            <FontAwesomeIcon icon={enabled ? faCheckCircle : faXmarkCircle} />
            <span className="px-2">{enabled ? "Enabled" : "Disabled"}</span>
          </div>
        </div>
      </div>
      <div className="py-4">
        <div className="bg-[#2B9AE9] rounded-[10px] w-fit px-4 py-2 font-bold text-[#FFFFFF]">
          {department}
        </div>
      </div>
      <div>
        <div className="text-[#3C3C3C] text-[18px] font-bold pb-2">
          <FontAwesomeIcon icon={faEnvelope} />
          <span className="pl-3">{email}</span>
        </div>
        <div className="text-[#3C3C3C] text-[18px] font-bold pb-2">
          <FontAwesomeIcon icon={faPhone} />
          <span className="pl-3">{phone}</span>
        </div>
        <div className="text-[#3C3C3C] text-[18px] font-bold pb-2">
          <FontAwesomeIcon icon={faHome} />
          <span className="pl-3">{`${streetAddress}, ${postalCode} ${city}`}</span>
        </div>
        <div className="text-[#3C3C3C] text-[14px] pb-2 ">
          <span className="">
            {distinguishedName && distinguishedName.replace(/,/g, ", ")}
          </span>
        </div>
      </div>
    </div>
  );
};

export default UserInfo;
