import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import SpacesTable from "../../../Components/Tables/SpacesTable";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import ButtonPrimary from "../../../Components/Buttons/ButtonPrimary";
import Search from "../../../Components/Inputs/Search";
import { useDebounce } from "../../../Hooks/useDebounce";
import AddSpaceModal from "../../../Components/Modals/AddSpaceModal";
import { getSpaces } from "../../../Services/knowledge";
import PageMotion from "../../../Components/PageMotion/PageMotion";
import { useViewportFillHeight } from "../../../Hooks/useViewportFillHeight";

type Props = {};

const index = (props: Props) => {
  const { t } = useTranslation();
  const fillHeight = useViewportFillHeight();
  const [searchValue, setSearchValue] = useState("");
  const [isAddSpaceModalOpen, setIsAddSpaceModalOpen] = useState(false);
  const debouncedSearch = useDebounce(searchValue, 500);

  const { data: spaces = [], isLoading } = useQuery({
    queryKey: ["knowledge-spaces"],
    queryFn: getSpaces,
  });

  const filteredSpaces = useMemo(() => {
    if (!debouncedSearch.trim()) return spaces;
    const q = debouncedSearch.toLowerCase();
    return spaces.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.description || "").toLowerCase().includes(q),
    );
  }, [spaces, debouncedSearch]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };

  return (
    <PageMotion>
    <div
      className="flex w-full flex-col overflow-hidden px-4"
      style={{ height: fillHeight }}
    >
      <div className="flex flex-wrap items-center gap-2 py-4">
        <Search
          onChange={handleSearchChange}
          className="w-auto flex-1 min-w-[180px] max-w-[400px]"
        />
        <ButtonPrimary
          color="white"
          icon={faPlus}
          text={t("btn.add.space")}
          onClick={() => setIsAddSpaceModalOpen(true)}
          className="ml-auto"
        />
      </div>
      <div className="min-h-0 flex-1">
        <SpacesTable data={filteredSpaces} isLoading={isLoading} fillHeight />
      </div>

      <AddSpaceModal
        isModalOpen={isAddSpaceModalOpen}
        onCloseModal={() => setIsAddSpaceModalOpen(false)}
      />
    </div>
    </PageMotion>
  );
};

export default index;
