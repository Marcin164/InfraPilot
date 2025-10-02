import React from "react";

type Props = {
  label: string;
  checked?: boolean;
  onChange: (checked: boolean) => void;
};

const CheckboxButton: React.FC<Props> = ({ label, checked, onChange }) => {
  return (
    <label className="inline-flex cursor-pointer mr-2 mb-2">
      <input
        type="checkbox"
        className="hidden"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        className={`
          px-4 py-1 rounded-md font-medium transition-colors
          ${checked ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"}
        `}
      >
        {label}
      </span>
    </label>
  );
};

export default CheckboxButton;
