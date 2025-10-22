import React from "react";

type Props = {
  servers: any;
};

const DNS = ({ servers }: Props) => {
  return (
    <div>
      <div className="text-[16px] font-semibold text-[#2B9AE9] pt-2">
        DNS Servers
      </div>
      <div>
        {servers.map((server: any) => (
          <div className="text-[#3C3C3C] font-semibold">{server}</div>
        ))}
      </div>
    </div>
  );
};

export default DNS;
