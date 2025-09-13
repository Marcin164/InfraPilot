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
      <div>{`${volume_name} ${device_id} (${file_system})`}</div>
      <div>
        <div className="w-[300px] h-[14px] bg-[#D9D9D9]">
          <div
            style={{ width: (used_space / total_size) * 100 }}
            className="h-[14px] bg-[#BC0E0E]"
          />
        </div>
        <div>
          {`used: ${Math.round(
            bytesToGigaBytes(used_space)
          )} GB, free: ${Math.round(bytesToGigaBytes(free_space))} GB`}
        </div>
      </div>
    </div>
  );
};

export default Partitions;
