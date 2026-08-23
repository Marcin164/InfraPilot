import SelectSecondary from "./SelectSecondary";

const CREATE_NEW_VALUE = "__create_new__";

type Props = {
  label?: string;
  options: Array<{ value: string; label: string }>;
  onSelect: (option: { value: string; label: string } | null) => void;
  value?: any;
  createLabel: string;
  onCreateNew: () => void;
  placeholder?: string;
  isClearable?: boolean;
  errors?: any;
};

// Wraps SelectSecondary with a trailing "+ Create new..." option that opens
// a creation modal instead of selecting a value -- lets pickers for related
// entities (calendar, SLA definition) skip the "go create it elsewhere first" step.
const SelectWithCreate = ({
  label,
  options,
  onSelect,
  value,
  createLabel,
  onCreateNew,
  placeholder,
  isClearable,
  errors,
}: Props) => {
  const optionsWithCreate = [...options, { value: CREATE_NEW_VALUE, label: createLabel }];

  const handleSelect = (option: { value: string; label: string } | null) => {
    if (option?.value === CREATE_NEW_VALUE) {
      onCreateNew();
      return;
    }
    onSelect(option);
  };

  return (
    <SelectSecondary
      label={label}
      options={optionsWithCreate}
      value={value}
      onSelect={handleSelect}
      placeholder={placeholder}
      isClearable={isClearable}
      errors={errors}
    />
  );
};

export default SelectWithCreate;
