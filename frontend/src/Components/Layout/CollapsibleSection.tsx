import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { twMerge } from "tailwind-merge";

type Props = {
  title: string;
  icon?: any;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
};

const CollapsibleSection = ({
  title,
  icon,
  defaultOpen = false,
  children,
  className = "",
}: Props) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={twMerge("mt-3 pt-3 border-t border-[#F0F0F0]", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between cursor-pointer"
      >
        <span className="flex items-center gap-2 text-[14px] font-bold text-[#3C3C3C]">
          {icon && <FontAwesomeIcon icon={icon} className="text-[#9a9a9a]" />}
          {title}
        </span>
        <FontAwesomeIcon
          icon={faChevronDown}
          className={twMerge(
            "text-[#9a9a9a] transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  );
};

export default CollapsibleSection;
