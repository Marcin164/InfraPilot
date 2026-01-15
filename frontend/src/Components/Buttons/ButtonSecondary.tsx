import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { twMerge } from "tailwind-merge";

type Props = {
  icon?: any;
  text?: string;
  onClick?: any;
  className?: string;
  disabled?: boolean;
  type?: any;
};

const ButtonSecondary = ({
  icon,
  text,
  onClick,
  className,
  type,
  disabled,
}: Props) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={twMerge(
        `px-3 bg-[#FFFFFF] outline-none shadow-xl rounded-[10px] text-[16px] text-[#3C3C3C] cursor-pointer hover:bg-[#D7EEFF]/50 hover:text-[#2B9AE9]`,
        className
      )}
    >
      {icon && <FontAwesomeIcon icon={icon} className={text && "pr-2"} />}
      {text && <span>{text}</span>}
    </button>
  );
};

export default ButtonSecondary;
