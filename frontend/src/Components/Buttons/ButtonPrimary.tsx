import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { twMerge } from "tailwind-merge";

type ButtonColor = "blue" | "green" | "red" | "yellow" | "white";

const colorStyles: Record<
  ButtonColor,
  { bg: string; hover: string; text: string; icon: string; disabled: string }
> = {
  blue: {
    bg: "bg-[#2B9AE9]",
    hover: "hover:bg-[#3CABFA]",
    text: "text-white",
    icon: "text-white",
    disabled: "disabled:bg-[#A7CDEE] disabled:text-white/70",
  },
  green: {
    bg: "bg-[#2ECC71]",
    hover: "hover:bg-[#3DDB80]",
    text: "text-white",
    icon: "text-white",
    disabled: "disabled:bg-[#A7DFBB] disabled:text-white/70",
  },
  red: {
    bg: "bg-[#E74C3C]",
    hover: "hover:bg-[#F25D4E]",
    text: "text-white",
    icon: "text-white",
    disabled: "disabled:bg-[#F1A9A2] disabled:text-white/70",
  },
  yellow: {
    bg: "bg-[#F1C40F]",
    hover: "hover:bg-[#F4D03F]",
    text: "text-[#3C3C3C]",
    icon: "text-[#3C3C3C]",
    disabled: "disabled:bg-[#F5DFA0] disabled:text-[#3C3C3C]/50",
  },
  white: {
    bg: "bg-white",
    hover: "hover:bg-[#F0F0F0]",
    text: "text-[#3C3C3C]",
    icon: "text-[#3C3C3C]",
    disabled: "disabled:bg-[#E0E0E0] disabled:text-[#3C3C3C]/50",
  },
};

type ButtonPrimaryProps = {
  icon?: IconProp;
  text?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: "button" | "submit";
  className?: string;
  disabled?: boolean;
  color?: ButtonColor;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const ButtonPrimary: React.FC<ButtonPrimaryProps> = ({
  icon,
  text,
  onClick,
  type = "button",
  className,
  disabled = false,
  color = "blue",
}) => {
  const style = colorStyles[color];

  return (
    <button
      data-cy="button-primary"
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-disabled={disabled}
      className={twMerge(
        `${style.bg} ${style.text} ${style.hover} inline-flex items-center gap-2 rounded-[10px] px-4 py-1 text-[16px] shadow-xl font-medium transition-colors cursor-pointer`,
        `${style.disabled} disabled:cursor-not-allowed`,
        className,
      )}
    >
      {icon && (
        <FontAwesomeIcon
          data-cy="button-primary-icon"
          icon={icon}
          className={twMerge(style.icon, text && "w-[16px] pr-2")}
        />
      )}
      {text && <span data-cy="button-primary-text">{text}</span>}
    </button>
  );
};

export default ButtonPrimary;
