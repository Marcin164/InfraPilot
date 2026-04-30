import React from "react";
import CardHeader from "../../../../Components/Headers/CardHeader";
import { faCloud } from "@fortawesome/free-solid-svg-icons";

type Props = {
  servers: any;
};

const DNS = ({ servers }: Props) => {
  return (
    <div>
      <CardHeader text="DNS Servers" icon={faCloud} />
      <div>
        {servers.map((server: any) => (
          <div className="text-[#3C3C3C] font-semibold">{server}</div>
        ))}
      </div>
    </div>
  );
};

export default DNS;
