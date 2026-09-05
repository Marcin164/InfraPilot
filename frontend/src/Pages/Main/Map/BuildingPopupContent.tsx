import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronRight, faGear } from "@fortawesome/free-solid-svg-icons";
import { getLocationSummary, type LocationSummaryEntry, type LocationTree } from "../../../Services/locations";

// The Leaflet popup chrome is always a plain white box regardless of the
// app's dark mode, but Tailwind's `text-[#hex]` classes get remapped to
// lighter shades by the global `html.dark` overrides (index.css) meant for
// the app's own dark surfaces. Inline styles sidestep that so this content
// always renders with the intended contrast against the white popup.
const COLORS = {
  dark: "#3C3C3C",
  muted: "#7a7a7a",
  faint: "#9a9a9a",
  link: "#2B9AE9",
};

type ExpandableListProps = {
  label: string;
  count: number;
  items: LocationSummaryEntry[];
  onItemClick: (id: string) => void;
};

const ExpandableList = ({ label, count, items, onItemClick }: ExpandableListProps) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        disabled={count === 0}
        className="flex items-center gap-1.5 text-[13px] font-bold disabled:cursor-default"
        style={{ color: COLORS.dark }}
      >
        {count > 0 && (
          <FontAwesomeIcon
            icon={expanded ? faChevronDown : faChevronRight}
            className="text-[9px]"
            style={{ color: COLORS.faint }}
          />
        )}
        {label}
      </button>
      {expanded && count > 0 && (
        <div className="mt-1 ml-4 max-h-[140px] overflow-y-auto space-y-0.5">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onItemClick(item.id)}
              className="block text-[12px] hover:underline text-left"
              style={{ color: COLORS.link }}
            >
              {item.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const LocationTreeList = ({ nodes, depth }: { nodes: LocationTree[]; depth: number }) => (
  <>
    {nodes.map((node) => (
      <div key={node.id}>
        <div className="text-[12px]" style={{ marginLeft: depth * 12, color: COLORS.dark }}>
          {node.name} <span className="text-[10px]" style={{ color: COLORS.muted }}>{node.type}</span>
        </div>
        {node.children.length > 0 && <LocationTreeList nodes={node.children} depth={depth + 1} />}
      </div>
    ))}
  </>
);

type Props = { locationId: string };

const BuildingPopupContent = ({ locationId }: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const query = useQuery({
    queryKey: ["location-summary", locationId],
    queryFn: () => getLocationSummary(locationId),
  });

  if (query.isLoading) {
    return (
      <div className="text-[12px] py-1" style={{ color: COLORS.faint }}>
        {t("common.loading")}
      </div>
    );
  }
  if (!query.data) return null;

  const { children, deviceCount, devices, userCount, users } = query.data;

  return (
    <div className="min-w-[220px]">
      <ExpandableList
        label={t("map.popup.users", { count: userCount })}
        count={userCount}
        items={users}
        onItemClick={(id) => navigate(`/admin/users/${id}`)}
      />
      <ExpandableList
        label={t("map.popup.devices", { count: deviceCount })}
        count={deviceCount}
        items={devices}
        onItemClick={(id) => navigate(`/admin/devices/${id}`)}
      />
      {children.length > 0 && (
        <div className="mt-2">
          <div className="text-[13px] font-bold" style={{ color: COLORS.dark }}>
            {t("map.popup.hierarchy")}
          </div>
          <div className="mt-1">
            <LocationTreeList nodes={children} depth={0} />
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => navigate("/admin/settings/locations")}
        className="mt-3 flex items-center gap-1.5 text-[12px] hover:underline"
        style={{ color: COLORS.link }}
      >
        <FontAwesomeIcon icon={faGear} className="text-[10px]" />
        {t("map.popup.manageLocations")}
      </button>
    </div>
  );
};

export default BuildingPopupContent;
