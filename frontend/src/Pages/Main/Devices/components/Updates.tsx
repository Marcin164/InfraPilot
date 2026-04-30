import React from "react";
import UpdatesTable from "../../../../Components/Tables/UpdatesTable";
import CardHeader from "../../../../Components/Headers/CardHeader";
import { faCloudArrowUp } from "@fortawesome/free-solid-svg-icons";

type Props = { updates: any };

const Updates = ({ updates }: Props) => {
  return (
    <div className="w-full h-full max-h-[400px] bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <CardHeader text="Updates" icon={faCloudArrowUp} />
      <div className="overflow-hidden">
        <UpdatesTable data={updates} />
      </div>
    </div>
  );
};

export default Updates;
