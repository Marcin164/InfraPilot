import { useEffect, useState } from "react";
import ReactSelect from "react-select";
import { useTheme } from "../../Context/ThemeContext";
import { getReactSelectTheme, selectBorderColor, selectOptionBg, selectTextColor } from "./reactSelectTheme";

type Props = {
  label?: string;
  options: Array<any>;
  onSelect: any;
  value?: any;
  defaultValue?: any;
  className?: string;
  isMulti?: boolean;
  isClearable?: boolean;
  isDisabled?: boolean;
  placeholder?: string;
  errors?: any;
};

const SelectSecondary = ({
  label,
  options,
  onSelect,
  value,
  defaultValue,
  className = "",
  isMulti = false,
  isClearable,
  isDisabled,
  placeholder,
  errors,
}: Props) => {
  const [selectedOption, setSelectedOption] = useState(value);
  const [reload, setReload] = useState(false);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    setSelectedOption(value);
  }, [value]);

  const handleChange = (e: any) => {
    onSelect(e);
    setSelectedOption(e);
    setReload(!reload);
  };

  const styles: any = {
    control: (styles: any) => ({
      ...styles,
      width: "100%",
      minHeight: "42px",
      fontSize: "16px",
      fontWeight: "700",
      borderColor: selectBorderColor(isDark),
      borderRadius: "10px",
      paddingLeft: "6px",
      outline: "none",
      marginTop: label ? "6px" : "0",
    }),
    option: (styles: any, state: any) => ({
      ...styles,
      width: "100%",
      fontSize: "14px",
      color: selectTextColor(isDark, state.isFocused || state.isSelected),
      fontWeight: "400",
      backgroundColor: selectOptionBg(state.isFocused || state.isSelected),
      cursor: "pointer",
      transition: "background-color 0.2s ease",
    }),
    menu: (styles: any) => ({ ...styles, width: "100%" }),
    menuPortal: (styles: any) => ({ ...styles, zIndex: 9999 }),
    input: (styles: any) => ({ ...styles, width: "100%", outline: "none" }),
    placeholder: (styles: any) => ({ ...styles }),
    singleValue: (styles: any) => ({ ...styles, width: "100%" }),
  };

  return (
    <div className={`${label ? "pt-2" : ""} ${className}`}>
      {label && (
        <label className="font-bold text-[#3C3C3C] mb-1">{label}</label>
      )}
      <ReactSelect
        value={selectedOption}
        defaultValue={defaultValue}
        onChange={handleChange}
        options={options}
        styles={styles}
        theme={getReactSelectTheme(isDark)}
        isMulti={isMulti}
        isClearable={isClearable}
        isDisabled={isDisabled}
        placeholder={placeholder}
        menuPortalTarget={typeof document !== "undefined" ? document.body : null}
        menuPosition="fixed"
      />
      {errors && (
        <em role="alert" className="text-[14px] text-[#BC0E0E] font-bold">
          {errors}
        </em>
      )}
    </div>
  );
};

export default SelectSecondary;
