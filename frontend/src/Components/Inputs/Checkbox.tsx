import React from "react";

type Props = {
  label?: any;
  id?: any;
  onChange?: any;
  handleChange?: any;
  onClick?: (e: React.MouseEvent) => void;
  name?: any;
  value?: any;
  checked?: any;
  disabled?: boolean;
  color?: string;
  className?: string;
};

const Checkbox = ({
  label,
  id = "customCheckbox",
  onChange,
  handleChange,
  onClick,
  name,
  value = null,
  checked = null,
  disabled = false,
  color,
  className = "",
}: Props) => {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className={`inline-flex items-center gap-3 select-none ${
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
        }`}
      >
        <input
          type="checkbox"
          id={id}
          className="sr-only peer"
          onChange={
            handleChange ? (e) => handleChange(e.target.checked) : onChange
          }
          onClick={onClick}
          name={name}
          value={value}
          checked={checked ?? null}
          disabled={disabled}
        />

        <span
          className="w-[20px] h-[20px] flex items-center justify-center
                   bg-gray-200 rounded-[5px] transition-colors
                   peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300
                   peer-checked:bg-blue-600"
          style={color && checked ? { backgroundColor: color } : undefined}
          aria-hidden="true"
        >
          <svg
            className="w-4 h-4 transform transition-all duration-200 ease-in-out
                     opacity-0 scale-75 peer-checked:opacity-100 peer-checked:scale-100"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M5 12.5L9.5 17L19 7"
              stroke="white"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>

        {label && <span className="font-bold text-[#3C3C3C]">{label}</span>}
      </label>
    </div>
  );
};

export default Checkbox;
