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

  const usedPct = total_size > 0 ? Math.round((used_space / total_size) * 100) : 0;
  const barColor = usedPct > 90 ? "#F3606E" : usedPct > 70 ? "#F1C40F" : "#30A712";

  return (
    <div className="py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-semibold text-[#3C3C3C] truncate">
          {`${device_id} ${volume_name}`.trim()}
          {file_system && <span className="text-[#9a9a9a] font-light"> ({file_system})</span>}
        </span>
        <span className="text-[12px] text-[#9a9a9a] shrink-0">{usedPct}%</span>
      </div>
      <div className="mt-1 h-[6px] rounded-full bg-[#F0F0F0] overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${usedPct}%`, backgroundColor: barColor }}
        />
      </div>
      <div className="text-[12px] text-[#9a9a9a] mt-1">
        {`${Math.round(bytesToGigaBytes(used_space))} GB użyte, ${Math.round(bytesToGigaBytes(free_space))} GB wolne (${Math.round(bytesToGigaBytes(total_size))} GB razem)`}
      </div>
    </div>
  );
};

export default Partitions;
