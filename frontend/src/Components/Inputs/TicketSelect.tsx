import { useRef } from "react";
import AsyncCreatableSelect from "react-select/async-creatable";
import { searchTickets } from "../../Services/tickets";
import type { Ticket } from "../../Types/ticket";

type Props = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onTicketLoaded?: (ticket: Ticket | null) => void;
  errors?: string;
  className?: string;
};

type TicketOption = {
  label: string;
  value: string;
};

const styles: any = {
  control: (base: any) => ({
    ...base,
    width: "100%",
    height: "42px",
    fontSize: "16px",
    fontWeight: "700",
    borderColor: "#3C3C3C",
    borderRadius: "10px",
    paddingLeft: "6px",
    outline: "none",
    marginTop: "6px",
  }),
  option: (base: any, state: any) => ({
    ...base,
    width: "100%",
    fontSize: "14px",
    color: state.isFocused || state.isSelected ? "#FFFFFF" : "#3C3C3C",
    fontWeight: "400",
    backgroundColor:
      state.isFocused || state.isSelected ? "#2B9AE9AA" : "transparent",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
  }),
  menu: (base: any) => ({ ...base, width: "100%" }),
  input: (base: any) => ({ ...base, width: "100%", outline: "none" }),
  placeholder: (base: any) => ({ ...base }),
  singleValue: (base: any) => ({ ...base, width: "100%" }),
};

const TicketSelect = ({
  label = "Ticket",
  value,
  onChange,
  onTicketLoaded,
  errors,
  className = "",
}: Props) => {
  const selectedOption = value ? { label: value, value } : null;
  const ticketsByNumber = useRef<Map<string, Ticket>>(new Map());

  const loadOptions = async (inputValue: string): Promise<TicketOption[]> => {
    if (inputValue.length < 3) return [];

    const tickets = await searchTickets(inputValue);
    tickets.forEach((t) => ticketsByNumber.current.set(String(t.number), t));
    return tickets.map((t) => ({
      label: `${t.type} ${t.number} — ${t.description?.slice(0, 50) || ""}`,
      value: String(t.number),
    }));
  };

  return (
    <div className={`pt-2 ${className}`}>
      <label className="font-bold text-[#3C3C3C] mb-1">{label}</label>
      <AsyncCreatableSelect
        defaultOptions={false}
        loadOptions={loadOptions}
        value={selectedOption}
        onChange={(opt) => {
          onChange(opt?.value ?? "");
          onTicketLoaded?.(opt?.value ? (ticketsByNumber.current.get(opt.value) ?? null) : null);
        }}
        onCreateOption={(inputValue) => {
          onChange(inputValue);
          onTicketLoaded?.(null);
        }}
        styles={styles}
        isClearable
        filterOption={null}
        placeholder="Type at least 3 characters..."
        formatCreateLabel={(inputValue) => `Add "${inputValue}"`}
        noOptionsMessage={({ inputValue }) =>
          inputValue.length < 3
            ? "Type at least 3 characters to search"
            : "No tickets found"
        }
      />
      {errors && (
        <em role="alert" className="text-[14px] text-[#BC0E0E] font-bold">
          {errors}
        </em>
      )}
    </div>
  );
};

export default TicketSelect;
