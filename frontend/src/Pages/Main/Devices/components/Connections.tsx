import React from "react";
import ConnectionsTable from "../../../../Components/Tables/ConnectionsTable";

type Props = { connections: any };

const Connections = ({ connections }: Props) => {
  return <ConnectionsTable data={connections} />;
};

export default Connections;
