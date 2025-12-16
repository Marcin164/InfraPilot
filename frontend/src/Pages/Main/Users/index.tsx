import UsersTable from "../../../Components/Tables/UsersTable";
import Search from "../../../Components/Inputs/Search";
import Filter from "../../../Components/Filter";
import TableSettings from "../../../Components/TableSettings";
import { useQuery } from "@tanstack/react-query";
import { getFilter, getUsersTable } from "../../../Services/users";
import { useState } from "react";
import { useAuthInfo } from "@propelauth/react";
import AddUserModal from "../../../Components/Modals/AddUserModal";
import ButtonSecondary from "../../../Components/Buttons/ButtonSecondary";
import { faPlus } from "@fortawesome/free-solid-svg-icons";

const index = () => {
  const [filterOptions, setFilterOptions] = useState({
    department: [],
    company: [],
    office: [],
    city: [],
    country: [],
    title: [],
    streetAddress: [],
    postalCode: [],
    manager: [],
  });
  const [searchValue, setSearchValue] = useState("");
  const [addUserModal, setAddUserModal] = useState(false);

  const authInfo = useAuthInfo();

  const userQuery = useQuery({
    queryKey: ["users"],
    queryFn: () => getUsersTable(authInfo.accessToken),
  });
  const filterQuery = useQuery({
    queryKey: ["filter"],
    queryFn: () => getFilter(authInfo.accessToken),
  });

  if (!userQuery?.data && userQuery?.data?.length <= 0) return null;

  const getSearchValue = (e: any) => {
    const value = e.target.value;
    setSearchValue(value);
  };

  const toggleFilterOptions = (e: any) => {
    const targetValue: any = e.target.value;
    const targetName: any = e.target.name;

    const _filterOptions: any = { ...filterOptions };

    Object.entries(_filterOptions).map(([key, array]: any) => {
      const filterOption = array.find(
        (option: any) => option === e.target.value
      );

      if (key === targetName) {
        if (filterOption) {
          const index = array.indexOf(targetValue);

          if (index !== -1) {
            array.splice(index, 1);
          }
        } else {
          array.push(targetValue);
        }
      }
    });

    setFilterOptions(_filterOptions);
  };

  const toggleModal = () => {
    setAddUserModal((prev: any) => !prev);
  };

  return (
    <div className="w-full h-[calc(100vh-58px)] px-4">
      <div className="pt-4 pb-4 flex">
        <Filter
          filterData={filterQuery?.data}
          setFilters={toggleFilterOptions}
          filterOptions={filterOptions}
        />
        <Search onChange={getSearchValue} />
        <TableSettings />
        <ButtonSecondary
          icon={faPlus}
          text="Add user"
          onClick={toggleModal}
          className="ml-2"
        />
        <AddUserModal isModalOpen={addUserModal} onCloseModal={toggleModal} />
      </div>
      <UsersTable
        data={userQuery?.data}
        filterOptions={filterOptions}
        searchValue={searchValue}
      />
    </div>
  );
};

export default index;
