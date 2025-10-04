import { twMerge } from "tailwind-merge";

type Props = { onChange: any; className?: string };

const Search = ({ onChange, className = "" }: Props) => {
  return (
    <input
      type="text"
      placeholder="Search..."
      className={twMerge(
        "w-[400px] h-[34px] pl-4 outline-none bg-[#FFFFFF] shadow-xl rounded-[10px] text-[16px] text-[#3C3C3C] mx-2",
        className
      )}
      onChange={onChange}
    />
  );
};

export default Search;
