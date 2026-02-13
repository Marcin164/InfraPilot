import { faFilter } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRef } from "react";
import FilterModal from "./FilterModal";

type Props = {
  filters: Record<string, string[] | undefined>;
  setFilters: any;
  filterOptions: Record<string, string[]>;
  isOpen: any;
  setIsOpen: any;
};

const Filter = ({
  filters,
  setFilters,
  filterOptions,
  isOpen,
  setIsOpen,
}: Props) => {
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen((v: any) => !v)}
        className="w-[34px] h-[34px] bg-white shadow-xl rounded-[10px]"
      >
        <FontAwesomeIcon icon={faFilter} />
      </button>

      {isOpen && (
        <>
          {/* BACKDROP */}
          <div
            className="fixed inset-0 z-[40]"
            onClick={() => setIsOpen(false)}
          />

          {/* MODAL */}
          <div className="absolute z-[50]">
            <FilterModal
              filters={filters}
              setFilters={setFilters}
              filterOptions={filterOptions}
            />
          </div>
        </>
      )}
    </>
  );
};

export default Filter;
