import { faFilter } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useRef, useState } from "react";
import FilterModal from "./FilterModal";

type Props = { filterData: any; setFilters: any; filterOptions: any };

const Filter = ({ filterData, setFilters, filterOptions }: Props) => {
  const [isOpenFilterModal, setIsOpenFilterModal] = useState<boolean>(false);
  const modalRef = useRef<HTMLDivElement | null>(null);

  const toggleFilterModal = () => {
    setIsOpenFilterModal((prev: boolean) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setIsOpenFilterModal(false);
      }
    };

    window.addEventListener("click", handleClickOutside);
    return () => {
      window.removeEventListener("click", handleClickOutside);
    };
  }, []);

  return (
    <div ref={modalRef} className="relative">
      <button
        className="w-[34px] h-[34px] bg-[#FFFFFF] outline-none shadow-xl rounded-[10px] text-[16px] text-[#3C3C3C] cursor-pointer hover:bg-[#D7EEFF]/50 hover:text-[#2B9AE9]"
        onClick={toggleFilterModal}
      >
        <FontAwesomeIcon icon={faFilter} />
      </button>
      {isOpenFilterModal && (
        <FilterModal
          data={filterData}
          setFilters={setFilters}
          filterOptions={filterOptions}
        />
      )}
    </div>
  );
};

export default Filter;
