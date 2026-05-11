import CreatableSelect from "react-select/creatable";
import { useTranslation } from "react-i18next";

type Props = {
  value: string;
  onChange: (value: string) => void;
  categories: Array<{ category: string; count: number }>;
};

const selectStyles: any = {
  control: (styles: any) => ({
    ...styles,
    minHeight: "42px",
    borderColor: "#535353",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: 700,
    paddingLeft: "4px",
  }),
  menu: (styles: any) => ({ ...styles, zIndex: 20 }),
};

const CategorySelect = ({ value, onChange, categories }: Props) => {
  const { t } = useTranslation();
  const options = categories.map((c) => ({
    value: c.category,
    label: `${c.category} (${c.count})`,
  }));

  const selected = value
    ? { value, label: value }
    : null;

  return (
    <CreatableSelect
      isClearable
      options={options}
      value={selected}
      onChange={(opt: any) => onChange(opt?.value ?? "")}
      onCreateOption={(input: string) => onChange(input)}
      placeholder={t("knowledge.selectCategory")}
      formatCreateLabel={(input: string) => `Create "${input}"`}
      styles={selectStyles}
    />
  );
};

export default CategorySelect;
