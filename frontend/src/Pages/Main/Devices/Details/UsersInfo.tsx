import React from "react";
import CardHeader from "../../../../Components/Headers/CardHeader";

type Props = {};

const UsersInfo = (props: Props) => {
  return (
    <>
      <div className="bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
        <CardHeader text="Currently logged users" />
      </div>
      <div className="bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
        <CardHeader text="Local Users" />
      </div>
      <div className="bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
        <CardHeader text="Users Profiles" />
      </div>
    </>
  );
};

export default UsersInfo;
