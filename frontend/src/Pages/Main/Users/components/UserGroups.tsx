import React from "react";

type Props = { memberOf: any };

const UserGroups = ({ memberOf }: Props) => {
  return (
    <div>
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
    </div>
  );
};

export default UserGroups;
