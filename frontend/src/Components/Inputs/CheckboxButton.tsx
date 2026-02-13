import React, { useState } from "react";

type Props = {
  label: string;
  name?: string;
  checked?: boolean;
  onChange: any;
};

const CheckboxButton: React.FC<Props> = ({
  label,
  name,
  checked = false,
  onChange,
}) => {
  const [_checked, setChecked] = useState(checked);

  const handleOnChange = (e: any) => {
    setChecked((prev) => !prev);
    onChange(e);
  };

  return (
    <label className="inline-flex cursor-pointer mr-2 mb-2">
      <input
        type="checkbox"
        className="hidden"
        name={name}
        checked={_checked}
        onChange={handleOnChange}
      />
      <span
        className={`
          px-4 py-1 rounded-md font-medium transition-colors
          ${_checked ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"}
        `}
      >
        {label}
      </span>
    </label>
  );
};

export default CheckboxButton;
