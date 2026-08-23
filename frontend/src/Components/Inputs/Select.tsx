import { useEffect, useState } from "react";
import ReactSelect from "react-select";
import { useTheme } from "../../Context/ThemeContext";
import { getReactSelectTheme, selectOptionBg, selectTextColor } from "./reactSelectTheme";

type Props = { options: Array<any>; onSelect: any; value?: any };

const Select = ({ options, onSelect, value }: Props) => {
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
      width: "250px",
      fontSize: "16px",
      paddingLeft: "6px",
      outline: "none",
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
    menu: (styles: any) => ({ ...styles, width: "250px" }),
    input: (styles: any) => ({ ...styles, width: "250px", outline: "none" }),
    placeholder: (styles: any) => ({ ...styles }),
    singleValue: (styles: any) => ({ ...styles, width: "250px" }),
  };

  return (
    <div>
      <ReactSelect
        value={selectedOption}
        onChange={handleChange}
        options={options}
        styles={styles}
        theme={getReactSelectTheme(isDark)}
      />
    </div>
  );
};

export default Select;
