import Checkbox from "../Inputs/Checkbox";

type Props = { data: any; setFilters: any; filterOptions: any };

const FilterModal = ({ data, setFilters, filterOptions }: Props) => {
  const getActiveFilters = (key: any, value: any) => {
    if (filterOptions[key].find((option: any) => option === value)) return true;
    return false;
  };

  return (
    <div className="w-[300px] h-[400px] absolute bg-[#FFFFFF] shadow-xl rounded-[10px] mt-2 px-2 pt-1 pb-2 z-[50] overflow-x-hidden">
      {Object.entries(data).map(([key, options]: any, indexX: number) => (
        <>
          <div className="text-[#3C3C3C] text-[16px] font-bold py-2 capitalize">
            {key}
          </div>
          <div>
            {options.map((option: any, indexY: number) => {
              return (
                <Checkbox
                  name={key}
                  label={option}
                  id={`${indexX}${indexY}`}
                  onChange={setFilters}
                  checked={getActiveFilters(key, option)}
                />
              );
            })}
          </div>
        </>
      ))}
    </div>
  );
};

export default FilterModal;
