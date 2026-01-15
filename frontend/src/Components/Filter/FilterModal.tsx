import Checkbox from "../Inputs/Checkbox";

type Props = {
  filters: Record<string, string[] | undefined>;
  setFilters: React.Dispatch<
    React.SetStateAction<Record<string, string[] | undefined>>
  >;
  filterOptions: Record<string, string[]>;
};

const FilterModal = ({ filters, setFilters, filterOptions }: Props) => {
  const toggleValue = (key: string, value: string) => {
    setFilters((prev) => {
      const current = prev[key] ?? [];
      const exists = current.includes(value);

      return {
        ...prev,
        [key]: exists
          ? current.filter((v) => v !== value)
          : [...current, value],
      };
    });
  };

  return (
    <div
      className="w-[300px] h-[400px] absolute bg-white shadow-xl rounded-[10px]
      mt-2 px-2 pt-1 pb-2 z-[50] overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
    >
      {Object.entries(filterOptions).map(([key, options]) => (
        <div key={key}>
          <div className="text-[#3C3C3C] text-[16px] font-bold py-2 capitalize">
            {key}
          </div>

          {options.map((option, idx) => (
            <Checkbox
              key={idx}
              name={key}
              label={option}
              value={option}
              id={`${key}-${idx}`}
              checked={filters[key]?.includes(option) ?? false}
              onChange={() => toggleValue(key, option)}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default FilterModal;
