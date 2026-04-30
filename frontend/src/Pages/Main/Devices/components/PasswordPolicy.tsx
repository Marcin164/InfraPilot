import React from "react";
import Parameter from "../../../../Components/Lists/Parameter";
import CardHeader from "../../../../Components/Headers/CardHeader";
import { faKey } from "@fortawesome/free-solid-svg-icons";

type Props = { passwordPolicy: any };

const PasswordPolicy = ({ passwordPolicy }: Props) => {
  return (
    <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <CardHeader text="Password policy" icon={faKey} />
      <div>
        {Object.entries(passwordPolicy).map(([key, value]: any) => (
          <Parameter name={key} value={value} />
        ))}
      </div>
    </div>
  );
};

export default PasswordPolicy;
