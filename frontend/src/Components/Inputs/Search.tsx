import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type Props = { onChange: any };

const Search = ({ onChange }: Props) => {
  return (
    <input
      type="text"
      placeholder="Search..."
      className="w-[400px] h-[34px] pl-4 outline-none bg-[#FFFFFF] shadow-xl rounded-[10px] text-[16px] text-[#3C3C3C] mx-2"
      onChange={onChange}
    />
  );
};

export default Search;
