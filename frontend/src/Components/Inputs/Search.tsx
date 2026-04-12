import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";

type Props = { onChange: any; className?: string };

const Search = ({ onChange, className = "" }: Props) => {
  const { t } = useTranslation();
  return (
    <input
      type="text"
      placeholder={t("search")}
      className={twMerge(
        "w-[400px] h-[34px] pl-4 outline-none bg-[#FFFFFF] shadow-xl rounded-[10px] text-[16px] text-[#3C3C3C]",
        className,
      )}
      onChange={onChange}
    />
  );
};

export default Search;
