import React from "react";
import HeadlessTable from "./HeadlessTable";

type Props = {};

const LastScanTable = (props: Props) => {
  const data = [
    {
      id: 1,
      hostname: "COMPUTER1",
      serialTag: "F56YU8P3",
      username: "nowakowskim",
      lastScan: "",
    },
    {
      id: 1,
      hostname: "COMPUTER2",
      serialTag: "F55TT6P3",
      username: "nowakowskim",
      lastScan: "",
    },
    {
      id: 1,
      hostname: "COMPUTER1",
      serialTag: "F56YU8P3",
      username: "nowakowskim",
      lastScan: "",
    },
    {
      id: 1,
      hostname: "COMPUTER2",
      serialTag: "F55TT6P3",
      username: "nowakowskim",
      lastScan: "",
    },
    {
      id: 1,
      hostname: "COMPUTER1",
      serialTag: "F56YU8P3",
      username: "nowakowskim",
      lastScan: "",
    },
    {
      id: 1,
      hostname: "COMPUTER2",
      serialTag: "F55TT6P3",
      username: "nowakowskim",
      lastScan: "",
    },
    {
      id: 1,
      hostname: "COMPUTER1",
      serialTag: "F56YU8P3",
      username: "nowakowskim",
      lastScan: "",
    },
    {
      id: 1,
      hostname: "COMPUTER2",
      serialTag: "F55TT6P3",
      username: "nowakowskim",
      lastScan: "",
    },
  ];

  const columns = [
    {
      selector: (row: any) => row.hostname,
    },
    {
      selector: (row: any) => row.serialTag,
    },
    {
      selector: (row: any) => row.username,
    },
    {
      selector: (row: any) => row.lastScan,
    },
  ];
  return <HeadlessTable columns={columns} data={data} />;
};

export default LastScanTable;
