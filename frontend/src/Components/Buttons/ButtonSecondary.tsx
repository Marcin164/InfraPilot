import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { twMerge } from "tailwind-merge";

type Props = { icon?: any; text: string; onClick?: any; className?: string };

const ButtonSecondary = ({ icon, text, onClick, className }: Props) => {
  return (
    <button
      onClick={onClick}
      className={twMerge(
        `px-3 h-[34px] bg-[#FFFFFF] outline-none shadow-xl rounded-[10px] text-[16px] text-[#3C3C3C] cursor-pointer hover:bg-[#D7EEFF]/50 hover:text-[#2B9AE9]`,
        className
      )}
    >
      {icon && <FontAwesomeIcon icon={icon} className="pr-2 " />}
      <span>{text}</span>
    </button>
  );
};

export default ButtonSecondary;
