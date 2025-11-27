import {
  faCheckCircle,
  faCity,
  faCrown,
  faEnvelope,
  faFile,
  faHome,
  faPhone,
  faTowerBroadcast,
  faTowerCell,
  faUserDoctor,
  faXmarkCircle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { twMerge } from "tailwind-merge";
import Badge from "../Badges/Badge";
import Parameter from "../Lists/Parameter";

type Props = {
  name: string;
  surname: string;
  title: string;
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
  company: string;
  manager: string;
};

const UserInfo = ({
  name,
  surname,
  title,
  enabled,
  department,
  email,
  phone,
  streetAddress,
  postalCode,
  city,
  username,
  distinguishedName,
  company,
  manager,
  memberOf = [],
}: Props) => {
  return (
    <div className="w-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <div className="flex items-center">
        <img src="#" className="w-[85px] h-[85px]" />
        <div className="px-4">
          <div className="font-extrabold text-[#3C3C3C] text-[20px]">
            {`${name} ${surname}`}
          </div>
          <div className="text-[#3C3C3C] font-light text-[15px] pb-2">
            {title}
          </div>
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
      <div className="flex py-3">
        {department && (
          <Badge
            className="bg-[#2B9AE9]"
            text={department}
            icon={faUserDoctor}
          />
        )}
      </div>
      <div>
        {manager && (
          <Parameter name="manager" value={manager?.match(/^CN=([^,]+)/)[1]} />
        )}
        {email && <Parameter name="email" value={email} />}
        {phone && <Parameter name="phone" value={phone} />}
        {streetAddress && postalCode && city && (
          <Parameter
            name="address"
            value={`${streetAddress}, ${postalCode} ${city}`}
          />
        )}
        {company && <Parameter name="company" value={company} />}
      </div>
      <div className="text-[30px] font-semibold text-[#3C3C3C] pt-2">
        Groups
      </div>
      <div className="flex flex-wrap">
        {memberOf && typeof memberOf !== "string" ? (
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
