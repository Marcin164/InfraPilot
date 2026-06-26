import MainTable from "./MainTable";
import { Link, useNavigate } from "react-router";
import moment from "moment";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faComputer,
  faNetworkWired,
  faServer,
  faWifi,
  faShieldHalved,
  faPhone,
} from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { getUserSettings } from "../../Services/settings";
import { listDeviceTags, DeviceTag } from "../../Services/deviceTags";

type Props = {
  data: any[];
  total: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (limit: number) => void;
  isLoading?: boolean;
  selectable?: boolean;
  onSelectedRowsChange?: (rows: any[]) => void;
  clearSelection?: boolean;
};

const LIFECYCLE_COLOR: Record<string, string> = {
  procurement: "#8A8A8A",
  active: "#30A712",
  in_repair: "#F1C40F",
  in_storage: "#2B9AE9",
  retired: "#8E44AD",
  disposed: "#7F8C8D",
  lost: "#F3606E",
};

const DevicesTable = ({
  data,
  total,
  onPageChange,
  onRowsPerPageChange,
  isLoading,
  selectable = false,
  onSelectedRowsChange,
  clearSelection,
}: Props) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const userSettings = useQuery({
    queryKey: ["userSettings"],
    queryFn: () => getUserSettings(),
  });

  const tagsQuery = useQuery({
    queryKey: ["device-tags"],
    queryFn: listDeviceTags,
  });

  if (!userSettings.data || userSettings.isLoading) {
    return <div>Loading...</div>;
  }

  const tags = Array.isArray(tagsQuery?.data) ? tagsQuery.data : [];

  const tagById = new Map<string, DeviceTag>(
    (tags ?? []).map((t) => [t?.id, t]),
  );

  const NETWORK_SUBGROUP_ICON: Record<string, any> = {
    Switch: faNetworkWired,
    Router: faServer,
    AP: faWifi,
    Firewall: faShieldHalved,
    Deskphone: faPhone,
  };

  const iconColumn = {
    id: "icon",
    cell: (row: any) => (
      <div>
        <FontAwesomeIcon
          icon={
            row.group === "Network"
              ? NETWORK_SUBGROUP_ICON[row.subgroup] ?? faNetworkWired
              : faComputer
          }
        />
      </div>
    ),
    width: "60px",
  };

  const columns = [
    iconColumn,
    {
      id: "device",
      name: t("device.device"),
      cell: (row: any) => (
        <span className="font-bold">{`${row.manufacturer ?? ""} ${row.model ?? ""}`}</span>
      ),
      width: "200px",
    },
    {
      id: "user",
      name: t("device.assignee"),
      selector: (row: any) =>
        row?.user ? (
          <Link
            to={`/admin/users/${row.user.id}`}
            className="text-[#2B9AE9] underline"
            onClick={(e) => e.stopPropagation()}
          >
            {row?.user?.distinguishedName}
          </Link>
        ) : (
          "N/A"
        ),
      width: "160px",
    },
    {
      id: "state",
      name: t("device.state"),
      cell: (row: any) => (
        <div className="w-[100px] py-2 rounded-[10px] text-center bg-[#30A712] text-[#FFFFFF]">
          {row.state ? "Online" : "Offline"}
        </div>
      ),
      width: "120px",
    },
    {
      id: "assetname",
      name: t("device.assetname"),
      selector: (row: any) => row.assetName || "N/A",
      width: "140px",
    },
    {
      id: "serialnumber",
      name: t("device.serial.number"),
      selector: (row: any) => row.serialNumber,
      width: "210px",
    },
    {
      id: "warranty",
      name: t("device.varranty"),
      cell: (row: any) => (
        <div
          style={{
            color: row.varranty < new Date().getTime() ? "#F3606E" : "#3C3C3C",
          }}
        >
          {row.varranty ? moment(row.varranty).format("DD.MM.YYYY") : "N/A"}
        </div>
      ),
    },
    {
      id: "lifecycle",
      name: "Lifecycle",
      cell: (row: any) => {
        const lc = row.lifecycle ?? "active";
        return (
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-bold text-white"
            style={{ backgroundColor: LIFECYCLE_COLOR[lc] ?? "#8A8A8A" }}
          >
            {lc.replace("_", " ")}
          </span>
        );
      },
      width: "120px",
    },
    {
      id: "tags",
      name: "Tags",
      cell: (row: any) => {
        const ids: string[] = row.tagIds ?? [];
        if (ids.length === 0) return <span className="text-[#9a9a9a]">—</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {ids.map((id) => {
              const tag = tagById.get(id);
              if (!tag) return null;
              return (
                <span
                  key={id}
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.label}
                </span>
              );
            })}
          </div>
        );
      },
      width: "180px",
    },
  ];

  const filterColumns = () => {
    const order = userSettings.data?.devicesTableColumnOrder;
    if (!order || order.length === 0) {
      return columns;
    }
    const filtered = order
      .map((columnId: string) =>
        columns.find((column) => column.id === columnId.toLowerCase()),
      )
      .filter(Boolean);
    return [iconColumn, ...filtered];
  };

  return (
    <MainTable
      columns={filterColumns()}
      data={data}
      onRowClicked={(row: any) =>
        navigate(`/admin/devices/${row.id}/${row.group === "Computers" ? "system" : "overview"}`)
      }
      paginationServer
      paginationTotalRows={total}
      onChangePage={onPageChange}
      onChangeRowsPerPage={onRowsPerPageChange}
      progressPending={isLoading}
      selectableRows={selectable}
      onSelectedRowsChange={
        onSelectedRowsChange
          ? ({ selectedRows }: any) => onSelectedRowsChange(selectedRows)
          : undefined
      }
      clearSelectedRows={clearSelection}
    />
  );
};

export default DevicesTable;
