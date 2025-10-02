import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type Props = { onChange: any };

const Search = ({ onChange }: Props) => {
  return (
    <div className="w-[400px] bg-[#FFFFFF] shadow-xl rounded-[10px] flex mx-2">
      <input
        type="text"
        placeholder="Search..."
        className="h-[50px] pl-4 outline-none rounded-l-[10px] text-[20px] text-[#3C3C3C]"
        onChange={onChange}
      />
    </div>
  );
};

export default Search;
