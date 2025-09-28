import UsersTable from "../../../Components/Tables/UsersTable";
import Search from "../../../Components/Inputs/Search";
import Filter from "../../../Components/Filter";

const index = () => {
  return (
    <div className="w-full px-4">
      <div className="pt-4 pb-8 flex">
        <Filter />
        <Search />
      </div>
      <UsersTable />
    </div>
  );
};

export default index;
