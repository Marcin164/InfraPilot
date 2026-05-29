import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBuilding,
  faChevronRight,
  faPlus,
  faTrash,
  faPen,
  faCheck,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import CardHeader from "../../../../Components/Headers/CardHeader";
import Input from "../../../../Components/Inputs/Input";
import SelectSecondary from "../../../../Components/Inputs/SelectSecondary";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import {
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  type Location,
  type LocationType,
} from "../../../../Services/locations";

const LOCATION_TYPES: LocationType[] = ["building", "floor", "room", "rack", "other"];

const typeIcon: Record<LocationType, string> = {
  building: "🏢",
  floor: "🏬",
  room: "🚪",
  rack: "🗄️",
  other: "📍",
};

const buildTree = (
  locations: Location[],
  parentId: string | null = null,
  depth = 0,
): Array<Location & { depth: number }> => {
  const children = locations.filter((l) => l.parentId === parentId);
  return children.flatMap((c) => [
    { ...c, depth },
    ...buildTree(locations, c.id, depth + 1),
  ]);
};

const LocationRow = ({
  loc,
  depth,
  allLocations,
  onRefresh,
}: {
  loc: Location;
  depth: number;
  allLocations: Location[];
  onRefresh: () => void;
}) => {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(loc.name);
  const [type, setType] = useState<LocationType>(loc.type);
  const [parentId, setParentId] = useState<string>(loc.parentId ?? "");
  const [description, setDescription] = useState(loc.description ?? "");

  const updateMutation = useMutation({
    mutationFn: () =>
      updateLocation(loc.id, {
        name: name.trim(),
        type,
        parentId: parentId || null,
        description: description.trim() || null,
      }),
    onSuccess: () => {
      toast.success(t("settings.locations.updated"));
      setEditing(false);
      onRefresh();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("settings.locations.updateFailed")),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteLocation(loc.id),
    onSuccess: () => {
      toast.success(t("settings.locations.deleted"));
      onRefresh();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("settings.locations.deleteFailed")),
  });

  const possibleParents = allLocations.filter((l) => l.id !== loc.id);

  return (
    <div
      className="flex items-center gap-2 rounded-[8px] border border-[#E0E0E0] px-3 py-2"
      style={{ marginLeft: depth * 20 }}
    >
      {depth > 0 && (
        <FontAwesomeIcon icon={faChevronRight} className="text-[#D0D0D0] text-[10px]" />
      )}
      <span className="text-[14px]">{typeIcon[loc.type]}</span>

      {editing ? (
        <div className="flex flex-1 flex-wrap gap-2 items-center">
          <input
            className="h-[30px] rounded-[6px] border border-[#D0D0D0] px-2 text-[12px] flex-1 min-w-[120px]"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <select
            className="h-[30px] rounded-[6px] border border-[#D0D0D0] px-2 text-[12px]"
            value={type}
            onChange={(e) => setType(e.target.value as LocationType)}
          >
            {LOCATION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            className="h-[30px] rounded-[6px] border border-[#D0D0D0] px-2 text-[12px]"
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
          >
            <option value="">{t("settings.locations.noParent")}</option>
            {possibleParents.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <input
            className="h-[30px] rounded-[6px] border border-[#D0D0D0] px-2 text-[12px] flex-1 min-w-[100px]"
            value={description}
            placeholder={t("common.description")}
            onChange={(e) => setDescription(e.target.value)}
          />
          <button
            onClick={() => updateMutation.mutate()}
            className="text-[#30A712] hover:text-[#27892C]"
          >
            <FontAwesomeIcon icon={faCheck} />
          </button>
          <button
            onClick={() => setEditing(false)}
            className="text-[#9a9a9a] hover:text-[#3C3C3C]"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
      ) : (
        <>
          <div className="flex-1 min-w-0">
            <span className="font-medium text-[13px] text-[#3C3C3C]">{loc.name}</span>
            <span className="ml-2 text-[11px] text-[#9a9a9a]">{loc.type}</span>
            {loc.description && (
              <span className="ml-2 text-[11px] text-[#7a7a7a]">— {loc.description}</span>
            )}
          </div>
          <button
            onClick={() => setEditing(true)}
            className="text-[#2B9AE9] hover:text-[#1a7ac5] ml-2"
          >
            <FontAwesomeIcon icon={faPen} className="text-[12px]" />
          </button>
          <button
            onClick={() => {
              if (window.confirm(`${t("settings.locations.confirmDelete")} "${loc.name}"?`))
                deleteMutation.mutate();
            }}
            className="text-[#F3606E] hover:text-[#C0392B]"
          >
            <FontAwesomeIcon icon={faTrash} className="text-[12px]" />
          </button>
        </>
      )}
    </div>
  );
};

const Locations = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [type, setType] = useState<LocationType>("other");
  const [parentId, setParentId] = useState("");
  const [description, setDescription] = useState("");

  const query = useQuery({
    queryKey: ["locations"],
    queryFn: getLocations,
  });

  const locations: Location[] = query.data ?? [];
  const flat = buildTree(locations);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["locations"] });

  const createMutation = useMutation({
    mutationFn: () =>
      createLocation({
        name: name.trim(),
        type,
        parentId: parentId || null,
        description: description.trim() || null,
      }),
    onSuccess: () => {
      toast.success(t("settings.locations.created"));
      setName("");
      setType("other");
      setParentId("");
      setDescription("");
      invalidate();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("settings.locations.createFailed")),
  });

  return (
    <div className="space-y-4 m-4">
      <div className="bg-white shadow-xl rounded-[10px] p-4">
        <CardHeader text={t("settings.locations.create")} icon={faPlus} />
        <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
          <Input
            label={t("settings.locations.namePlaceholder")}
            value={name}
            handleChange={setName}
            className="pt-0"
          />
          <SelectSecondary
            label={t("common.type")}
            options={LOCATION_TYPES.map((lt) => ({ value: lt, label: `${typeIcon[lt]} ${lt}` }))}
            value={{ value: type, label: `${typeIcon[type]} ${type}` }}
            onSelect={(opt: any) => setType(opt.value as LocationType)}
          />
          <SelectSecondary
            label={t("settings.locations.parent")}
            options={[
              { value: "", label: t("settings.locations.noParent") },
              ...locations.map((l) => ({ value: l.id, label: `${l.name} (${l.type})` })),
            ]}
            value={
              parentId
                ? { value: parentId, label: locations.find((l) => l.id === parentId)?.name ?? parentId }
                : { value: "", label: t("settings.locations.noParent") }
            }
            onSelect={(opt: any) => setParentId(opt.value)}
          />
          <Input
            label={t("common.description")}
            value={description}
            handleChange={setDescription}
            className="pt-0"
          />
        </div>
        <div className="mt-3">
          <ButtonPrimary
            icon={faPlus}
            text={
              createMutation.isPending
                ? t("common.creating")
                : t("settings.locations.createBtn")
            }
            onClick={() => {
              if (!name.trim()) return toast.error(t("settings.locations.nameRequired"));
              createMutation.mutate();
            }}
            disabled={createMutation.isPending}
          />
        </div>
      </div>

      <div className="bg-white shadow-xl rounded-[10px] p-4">
        <CardHeader text={t("settings.locations.existing")} icon={faBuilding} />
        {query.isLoading ? (
          <div className="mt-3 text-[13px] text-[#7a7a7a]">{t("common.loading")}</div>
        ) : flat.length === 0 ? (
          <div className="mt-3 text-[13px] text-[#7a7a7a]">
            {t("settings.locations.empty")}
          </div>
        ) : (
          <div className="mt-3 space-y-1">
            {flat.map(({ depth, ...loc }) => (
              <LocationRow
                key={loc.id}
                loc={loc}
                depth={depth}
                allLocations={locations}
                onRefresh={invalidate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Locations;
