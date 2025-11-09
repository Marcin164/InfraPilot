import { useEffect, useState } from "react";
import ReactSelect from "react-select";

type Props = { label: string; options: Array<any>; onSelect: any; value?: any };

const SelectSecondary = ({ label, options, onSelect, value }: Props) => {
  const [selectedOption, setSelectedOption] = useState(value);
  const [reload, setReload] = useState(false);

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
      fontSize: "16px",
      fontWeight: "700",
      borderColor: "#3C3C3C",
      borderRadius: "10px",
      paddingLeft: "6px",
      outline: "none",
    }),
    option: (styles: any, state: any) => ({
      ...styles,
      width: "100%",
      fontSize: "14px",
      color: state.isFocused || state.isSelected ? "#FFFFFF" : "#3C3C3C",
      fontWeight: "400",
      backgroundColor:
        state.isFocused || state.isSelected ? "#2B9AE9AA" : "transparent",
      cursor: "pointer",
      transition: "background-color 0.2s ease",
    }),
    menu: (styles: any) => ({ ...styles, width: "100%" }),
    input: (styles: any) => ({ ...styles, width: "100%", outline: "none" }),
    placeholder: (styles: any) => ({ ...styles }),
    singleValue: (styles: any) => ({ ...styles, width: "100%" }),
  };

  return (
    <div className="pt-2">
      <label className="font-bold text-[#3C3C3C] mb-1">{label}</label>
      <ReactSelect
        value={selectedOption}
        onChange={handleChange}
        options={options}
        styles={styles}
      />
    </div>
  );
};

export default SelectSecondary;
