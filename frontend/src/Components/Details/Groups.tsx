import React from "react";

type Props = {
  groups: string;
};

const Groups = ({ groups }: Props) => {
  if (!groups) return null;

  return (
    <div className="bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <div className="text-[30px] font-semibold text-[#3C3C3C]">Groups</div>
      <div className="flex flex-wrap">
        {JSON.parse(groups).map((group: any) => (
          <div className="bg-[#2B9AE9] rounded-[10px] w-fit px-2 py-1 text-[#FFFFFF] my-1 mr-2">
            {group}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Groups;
