import React from "react";

type Props = {
  device_id: string;
  file_system: string;
  free_space: number;
  total_size: number;
  used_space: number;
  volume_name: string;
};

const Partitions = ({
  device_id,
  file_system,
  free_space,
  total_size,
  used_space,
  volume_name,
}: Props) => {
  const bytesToGigaBytes = (bytes: number) => {
    const denominator = 1024 ** 3;
    return bytes / denominator;
  };

  return (
    <div>
      <div className="text-[#3C3C3C] font-semibold">{`${device_id} ${volume_name} (${file_system})`}</div>
      <div>
        <div className="w-[300px] h-[20px] bg-[#D9D9D9] rounded-[5px] overflow-hidden">
          <div
            className="h-[20px] bg-[#2B9AE9]"
            style={{ width: (used_space / total_size) * 100 }}
          />
        </div>
        <div className="text-[#3C3C3C] font-semibold">
          {`used: ${Math.round(
            bytesToGigaBytes(used_space)
          )} GB, free: ${Math.round(bytesToGigaBytes(free_space))} GB`}
        </div>
      </div>
    </div>
  );
};

export default Partitions;
