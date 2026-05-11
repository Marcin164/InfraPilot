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

type Props = {};

const index = (props: Props) => {
  const { t } = useTranslation();
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
    <div className="w-full h-[calc(100vh-58px)] px-4">
      <div className="flex gap-2 py-4">
        <Search onChange={handleSearchChange} />
        <ButtonPrimary
          color="white"
          icon={faPlus}
          text={t("btn.add.space")}
          onClick={() => setIsAddSpaceModalOpen(true)}
          className="h-[34px] ml-2"
        />
      </div>
      <SpacesTable data={filteredSpaces} isLoading={isLoading} />

      <AddSpaceModal
        isModalOpen={isAddSpaceModalOpen}
        onCloseModal={() => setIsAddSpaceModalOpen(false)}
      />
    </div>
    </PageMotion>
  );
};

export default index;
