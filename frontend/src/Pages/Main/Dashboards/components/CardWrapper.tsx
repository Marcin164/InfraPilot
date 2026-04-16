import type { ReactNode } from "react";

type Props = {
  title?: string;
  subtitle?: string;
  accent?: string;
  children: ReactNode;
  className?: string;
};

const CardWrapper = ({
  title,
  subtitle,
  accent = "#2B9AE9",
  children,
  className = "",
}: Props) => (
  <div
    className={`flex h-full w-full flex-col overflow-hidden rounded-[10px] bg-white ${className}`}
  >
    {title && (
      <div className="flex items-center gap-3 px-5 pt-4 pb-1">
        <div
          className="h-[28px] w-[4px] rounded-full"
          style={{ backgroundColor: accent }}
        />
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-bold leading-tight text-[#3C3C3C]">
            {title}
          </h3>
          {subtitle && (
            <p className="truncate text-[12px] text-[#8A8A8A]">{subtitle}</p>
          )}
        </div>
      </div>
    )}
    <div className="flex flex-1 items-center justify-center overflow-hidden px-4 pb-4">
      {children}
    </div>
  </div>
);

export default CardWrapper;
