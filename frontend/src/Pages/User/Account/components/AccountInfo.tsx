import {
  faCheckCircle,
  faUserDoctor,
  faXmarkCircle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { twMerge } from "tailwind-merge";
import Badge from "../../../../Components/Badges/Badge";
import Parameter from "../../../../Components/Lists/Parameter";

type Props = {
  data: any;
};

const AccountInfo = ({ data }: Props) => {
  return (
    <div className="w-full rounded-[10px] bg-white p-4 shadow-xl">
      <div className="flex items-center">
        <img src="#" className="h-[85px] w-[85px]" />
        <div className="px-4">
          <div className="text-[20px] font-extrabold text-[#3C3C3C]">
            {`${data.name ?? ""} ${data.surname ?? ""}`}
          </div>
          <div className="pb-2 text-[15px] font-light text-[#3C3C3C]">
            {data.title}
          </div>
          <div
            className={twMerge(
              "text-[18px]",
              data.enabled ? "text-[#30A712]" : "text-[#BC0E0E]",
            )}
          >
            <FontAwesomeIcon
              icon={data.enabled ? faCheckCircle : faXmarkCircle}
            />
            <span className="px-2">
              {data.enabled ? "Enabled" : "Disabled"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex py-3">
        {data.department && (
          <Badge
            className="bg-[#2B9AE9]"
            text={data.department}
            icon={faUserDoctor}
          />
        )}
      </div>

      <div>
        {data.manager && <Parameter name="manager" value={data.manager} />}
        {data.email && <Parameter name="email" value={data.email} />}
        {data.phone && <Parameter name="phone" value={data.phone} />}
        {data.streetAddress && data.postalCode && data.city && (
          <Parameter
            name="address"
            value={`${data.streetAddress}, ${data.postalCode} ${data.city}`}
          />
        )}
        {data.company && <Parameter name="company" value={data.company} />}
      </div>
    </div>
  );
};

export default AccountInfo;
