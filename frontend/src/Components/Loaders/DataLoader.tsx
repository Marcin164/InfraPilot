import React from "react";
import { RingLoader } from "react-spinners";

type Props = {};

const DataLoader = (props: Props) => {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center">
      <RingLoader color="#2B9AE9" size={160} />
      <div className="text-[#3C3C3C] font-bold pt-4 text-[30px]">
        Fetching data...
      </div>
    </div>
  );
};

export default DataLoader;
