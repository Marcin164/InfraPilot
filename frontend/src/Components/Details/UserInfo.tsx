import {
  faCheckCircle,
  faEnvelope,
  faFile,
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
  memberOf: any;
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
  memberOf = [],
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
      <div className="text-[30px] font-semibold text-[#3C3C3C] pt-2">
        Groups
      </div>
      <div className="flex flex-wrap">
        {memberOf ? (
          memberOf.map((group: any) => (
            <div className="bg-[#2B9AE9] rounded-[10px] w-fit px-2 py-1 text-[#FFFFFF] my-1 mr-2">
              {group}
            </div>
          ))
        ) : (
          <div>No groups</div>
        )}
      </div>
      <div className="text-[30px] font-semibold text-[#3C3C3C] pt-2">Forms</div>
      <div className="flex flex-wrap">
        <div className="w-[100px]">
          <div className="bg-[#2B9AE9] text-[#FFFFFF] w-[100px] h-[100px] rounded-full flex justify-center items-center text-[50px]">
            <FontAwesomeIcon icon={faFile} />
          </div>
          <div className="text-[14px] font-bold break-all py-4 text-center">
            Nowakowski_Marcin_ERF.docx
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserInfo;
