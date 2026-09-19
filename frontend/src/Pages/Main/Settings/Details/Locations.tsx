import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBuilding,
  faChevronRight,
  faImage,
  faMap,
  faPlus,
  faTrash,
  faPen,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import CardHeader from "../../../../Components/Headers/CardHeader";
import Input from "../../../../Components/Inputs/Input";
import SelectSecondary from "../../../../Components/Inputs/SelectSecondary";
import CoordinatesPicker, { type Coordinates } from "../../../../Components/Inputs/CoordinatesPicker";
import AddressMapPicker from "../../../../Components/Inputs/AddressMapPicker";
import PlanPinPicker from "../../../../Components/Inputs/PlanPinPicker";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import ConfirmationModal from "../../../../Components/Modals/ConfirmationModal";
import Modal from "../../../../Components/Modals/AnimatedModal";
import {
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  uploadLocationPlan,
  findAncestorFloor,
  type Location,
  type LocationType,
} from "../../../../Services/locations";
import { usePermissions } from "../../../../Hooks/usePermissions";
import { hasPermission } from "../../../../Constants/navigation";
import { requiredValidator, imageFileValidator } from "../../../../Helpers/validators";

const LOCATION_TYPES: LocationType[] = ["building", "floor", "room", "rack", "other"];

type PlanPosition = { x: number; y: number } | null;

const isPinnable = (type: LocationType) => type === "room" || type === "rack";

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

type LocationModalTarget = "create" | Location | null;

const LocationModal = ({
  target,
  allLocations,
  onClose,
}: {
  target: LocationModalTarget;
  allLocations: Location[];
  onClose: () => void;
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const editingLocation = target === "create" || target === null ? null : target;
  const [confirmDelete, setConfirmDelete] = useState(false);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["locations"] });

  const createMutation = useMutation({
    mutationFn: async (values: {
      name: string;
      type: LocationType;
      parentId: string;
      description: string;
      plan: File | null;
      coordinates: Coordinates | null;
      planPosition: PlanPosition;
    }) => {
      const created = await createLocation({
        name: values.name.trim(),
        type: values.type,
        parentId: values.parentId || null,
        description: values.description.trim() || null,
        latitude: values.type === "building" ? (values.coordinates?.lat ?? null) : null,
        longitude: values.type === "building" ? (values.coordinates?.lng ?? null) : null,
        planX: isPinnable(values.type) ? (values.planPosition?.x ?? null) : null,
        planY: isPinnable(values.type) ? (values.planPosition?.y ?? null) : null,
      });
      return values.type === "floor" && values.plan
        ? uploadLocationPlan(created.id, values.plan)
        : created;
    },
    onSuccess: () => {
      toast.success(t("settings.locations.created"));
      invalidate();
      onClose();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("settings.locations.createFailed")),
  });

  const updateMutation = useMutation({
    mutationFn: async (values: {
      name: string;
      type: LocationType;
      parentId: string;
      description: string;
      plan: File | null;
      coordinates: Coordinates | null;
      planPosition: PlanPosition;
    }) => {
      const updated = await updateLocation(editingLocation!.id, {
        name: values.name.trim(),
        type: values.type,
        parentId: values.parentId || null,
        description: values.description.trim() || null,
        latitude: values.type === "building" ? (values.coordinates?.lat ?? null) : null,
        longitude: values.type === "building" ? (values.coordinates?.lng ?? null) : null,
        planX: isPinnable(values.type) ? (values.planPosition?.x ?? null) : null,
        planY: isPinnable(values.type) ? (values.planPosition?.y ?? null) : null,
      });
      return values.type === "floor" && values.plan
        ? uploadLocationPlan(editingLocation!.id, values.plan)
        : updated;
    },
    onSuccess: () => {
      toast.success(t("settings.locations.updated"));
      invalidate();
      onClose();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("settings.locations.updateFailed")),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteLocation(editingLocation!.id),
    onSuccess: () => {
      toast.success(t("settings.locations.deleted"));
      invalidate();
      onClose();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("settings.locations.deleteFailed")),
  });

  const form = useForm({
    defaultValues: {
      name: editingLocation?.name ?? "",
      type: editingLocation?.type ?? ("other" as LocationType),
      parentId: editingLocation?.parentId ?? "",
      description: editingLocation?.description ?? "",
      plan: null as File | null,
      coordinates:
        editingLocation?.latitude != null && editingLocation?.longitude != null
          ? { lat: editingLocation.latitude, lng: editingLocation.longitude }
          : (null as Coordinates | null),
      planPosition:
        editingLocation?.planX != null && editingLocation?.planY != null
          ? { x: editingLocation.planX, y: editingLocation.planY }
          : (null as PlanPosition),
    },
    onSubmit: ({ value }) => {
      if (!value.name.trim()) return toast.error(t("settings.locations.nameRequired"));
      if (editingLocation) updateMutation.mutate(value);
      else createMutation.mutate(value);
    },
  });

  const possibleParents = editingLocation
    ? allLocations.filter((l) => l.id !== editingLocation.id)
    : allLocations;

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <Modal
        classNames={{ modal: "w-[620px] max-w-full max-h-[85vh] overflow-y-auto rounded-[10px]" }}
        open={target !== null}
        onClose={onClose}
        center
      >
        <CardHeader
          text={
            editingLocation
              ? t("settings.locations.editTitle", { name: editingLocation.name })
              : t("settings.locations.create")
          }
          icon={faBuilding}
        />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 items-end">
            <form.Field
              name="name"
              validators={{ onChange: ({ value }) => requiredValidator(value) }}
              children={(field) => (
                <Input
                  label={t("settings.locations.namePlaceholder")}
                  value={field.state.value}
                  handleChange={field.handleChange}
                  errors={field.state.meta.errors?.join(", ")}
                  className="pt-0"
                />
              )}
            />
            <form.Field
              name="type"
              children={(field) => (
                <SelectSecondary
                  label={t("common.type")}
                  options={LOCATION_TYPES.map((lt) => ({ value: lt, label: lt }))}
                  value={{ value: field.state.value, label: field.state.value }}
                  onSelect={(opt: any) => field.handleChange(opt.value as LocationType)}
                />
              )}
            />
            <form.Field
              name="parentId"
              children={(field) => (
                <SelectSecondary
                  label={t("settings.locations.parent")}
                  options={[
                    { value: "", label: t("settings.locations.noParent") },
                    ...possibleParents.map((l) => ({ value: l.id, label: `${l.name} (${l.type})` })),
                  ]}
                  value={
                    field.state.value
                      ? {
                          value: field.state.value,
                          label: possibleParents.find((l) => l.id === field.state.value)?.name ?? field.state.value,
                        }
                      : { value: "", label: t("settings.locations.noParent") }
                  }
                  onSelect={(opt: any) => field.handleChange(opt.value)}
                />
              )}
            />
            <form.Field
              name="description"
              children={(field) => (
                <Input
                  label={t("common.description")}
                  value={field.state.value}
                  handleChange={field.handleChange}
                  className="pt-0"
                />
              )}
            />
            <form.Subscribe selector={(state) => [state.values.type, state.values.parentId] as const}>
              {([type, parentId]) => (
                <>
                  {type === "building" && (
                    <form.Field
                      name="coordinates"
                      children={(field) => (
                        <CoordinatesPicker
                          label={t("settings.locations.coordinates")}
                          value={field.state.value}
                          onChange={field.handleChange}
                        />
                      )}
                    />
                  )}
                  {type === "floor" && (
                    <form.Field
                      name="plan"
                      validators={{ onChange: ({ value }) => imageFileValidator(value) }}
                      children={(field) => (
                        <div>
                          {!field.state.value && editingLocation?.planPath && (
                            <div className="text-[11px] text-[#9a9a9a] mb-1 truncate">
                              {t("settings.locations.currentPlan", {
                                name: editingLocation.planOriginalName ?? t("common.plan"),
                              })}
                            </div>
                          )}
                          <Input
                            type="file"
                            accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml"
                            label={t("common.plan")}
                            handleChange={field.handleChange}
                            errors={field.state.meta.errors?.join(", ")}
                            className="pt-0"
                          />
                        </div>
                      )}
                    />
                  )}
                  {isPinnable(type) && (
                    <form.Field
                      name="planPosition"
                      children={(field) => (
                        <div className="col-span-full">
                          <div className="text-[11px] text-[#9a9a9a] mb-1">
                            {t("settings.locations.pickOnFloorPlan")}
                          </div>
                          <PlanPinPicker
                            planLocation={findAncestorFloor(allLocations, parentId)}
                            x={field.state.value?.x}
                            y={field.state.value?.y}
                            onChange={(x, y) =>
                              field.handleChange(x != null && y != null ? { x, y } : null)
                            }
                            editable
                            noLocationHint={t("settings.locations.noAncestorFloor")}
                            noPlanHint={t("settings.locations.noAncestorFloorPlan")}
                          />
                        </div>
                      )}
                    />
                  )}
                </>
              )}
            </form.Subscribe>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <div>
              {editingLocation && (
                <ButtonPrimary
                  icon={faTrash}
                  text={t("common.delete")}
                  onClick={() => setConfirmDelete(true)}
                  disabled={deleteMutation.isPending}
                  color="red"
                />
              )}
            </div>
            <div className="flex gap-2">
              <ButtonPrimary text={t("common.cancel")} onClick={onClose} color="white" />
              <ButtonPrimary
                type="submit"
                icon={faCheck}
                text={isSaving ? t("common.creating") : t("common.save")}
                disabled={!form.state.canSubmit || isSaving}
              />
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        isModalOpen={confirmDelete}
        handleOnClose={() => setConfirmDelete(false)}
        onCancel={() => setConfirmDelete(false)}
        onDelete={() => {
          setConfirmDelete(false);
          deleteMutation.mutate();
        }}
        message={
          editingLocation
            ? `${t("settings.locations.confirmDelete")} "${editingLocation.name}"?`
            : undefined
        }
      />
    </>
  );
};

const LocationRow = ({
  loc,
  depth,
  onEdit,
  hasChildren,
  collapsed,
  onToggleCollapse,
}: {
  loc: Location;
  depth: number;
  onEdit: () => void;
  hasChildren: boolean;
  collapsed: boolean;
  onToggleCollapse: () => void;
}) => {
  const { t } = useTranslation();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewCoords, setPreviewCoords] = useState<Coordinates | null>(
    loc.latitude != null && loc.longitude != null
      ? { lat: loc.latitude, lng: loc.longitude }
      : null,
  );

  const coordsMutation = useMutation({
    mutationFn: (coords: Coordinates | null) =>
      updateLocation(loc.id, {
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
      }),
    onSuccess: () => {
      toast.success(t("settings.locations.updated"));
      setPreviewOpen(false);
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("settings.locations.updateFailed")),
  });

  return (
    <div
      className="flex items-center gap-2 rounded-[8px] border border-[#E0E0E0] px-3 py-2"
      style={{ marginLeft: depth * 20 }}
    >
      <div className="w-[14px] shrink-0 flex justify-center">
        {hasChildren && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="text-[#9a9a9a] hover:text-[#3C3C3C]"
            title={collapsed ? t("settings.locations.expand") : t("settings.locations.collapse")}
          >
            <FontAwesomeIcon
              icon={faChevronRight}
              className={`text-[10px] transition-transform ${collapsed ? "" : "rotate-90"}`}
            />
          </button>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <span className="font-medium text-[13px] text-[#3C3C3C]">{loc.name}</span>
        <span className="ml-2 text-[11px] text-[#9a9a9a]">{loc.type}</span>
        {loc.description && (
          <span className="ml-2 text-[11px] text-[#7a7a7a]">— {loc.description}</span>
        )}
      </div>
      {loc.type === "floor" && (
        <button
          onClick={() => setPreviewOpen(true)}
          className="text-[#2B9AE9] hover:text-[#1a7ac5]"
          title={t("settings.locations.previewPlan")}
        >
          <FontAwesomeIcon icon={faImage} className="text-[12px]" />
        </button>
      )}
      {loc.type === "building" && (
        <button
          onClick={() => {
            setPreviewCoords(
              loc.latitude != null && loc.longitude != null
                ? { lat: loc.latitude, lng: loc.longitude }
                : null,
            );
            setPreviewOpen(true);
          }}
          className="text-[#2B9AE9] hover:text-[#1a7ac5]"
          title={t("settings.locations.previewMap")}
        >
          <FontAwesomeIcon icon={faMap} className="text-[12px]" />
        </button>
      )}
      <button
        onClick={onEdit}
        className="text-[#2B9AE9] hover:text-[#1a7ac5] ml-2"
        title={t("common.edit")}
      >
        <FontAwesomeIcon icon={faPen} className="text-[12px]" />
      </button>
      {loc.type === "floor" && (
        <Modal
          classNames={{ modal: "w-[700px] max-w-full h-fit rounded-[10px]" }}
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          center
        >
          <div className="font-bold text-[18px] mb-3">{loc.name}</div>
          <PlanPinPicker
            planLocation={loc}
            x={null}
            y={null}
            onChange={() => {}}
            editable={false}
            noLocationHint={t("settings.locations.planNotUploaded")}
            noPlanHint={t("settings.locations.planNotUploaded")}
          />
        </Modal>
      )}
      {loc.type === "building" && (
        <Modal
          classNames={{ modal: "w-[600px] max-w-full h-fit rounded-[10px]" }}
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          center
        >
          <div className="font-bold text-[18px] mb-3">{loc.name}</div>
          {previewOpen && <AddressMapPicker value={previewCoords} onChange={setPreviewCoords} />}
          <div className="flex justify-between items-center mt-3">
            <button
              type="button"
              onClick={() => setPreviewCoords(null)}
              className="text-[#9a9a9a] text-[13px] underline"
            >
              {t("common.clear")}
            </button>
            <div className="flex gap-2">
              <ButtonPrimary
                color="white"
                text={t("common.cancel")}
                onClick={() => setPreviewOpen(false)}
              />
              <ButtonPrimary
                text={coordsMutation.isPending ? t("common.saving") : t("common.save")}
                onClick={() => coordsMutation.mutate(previewCoords)}
                disabled={coordsMutation.isPending}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

const Locations = () => {
  const { t } = useTranslation();

  const query = useQuery({
    queryKey: ["locations"],
    queryFn: getLocations,
  });

  const locations: Location[] = query.data ?? [];
  const flat = buildTree(locations);

  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const toggleCollapse = (id: string) =>
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const isHiddenByCollapse = (loc: Location): boolean => {
    let current = locations.find((l) => l.id === loc.parentId);
    while (current) {
      if (collapsedIds.has(current.id)) return true;
      current = locations.find((l) => l.id === current!.parentId);
    }
    return false;
  };

  const [modalTarget, setModalTarget] = useState<LocationModalTarget>(null);

  const permissionsQuery = usePermissions();
  if (!hasPermission("admin.locations.config", permissionsQuery.data)) return null;

  return (
    <div className="space-y-4 m-4">
      <div className="bg-white shadow-xl rounded-[10px] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardHeader text={t("settings.locations.existing")} icon={faBuilding} />
          <ButtonPrimary
            icon={faPlus}
            text={t("settings.locations.createBtn")}
            onClick={() => setModalTarget("create")}
          />
        </div>
        {query.isLoading ? (
          <div className="mt-3 text-[13px] text-[#7a7a7a]">{t("common.loading")}</div>
        ) : flat.length === 0 ? (
          <div className="mt-3 text-[13px] text-[#7a7a7a]">
            {t("settings.locations.empty")}
          </div>
        ) : (
          <div className="mt-3 space-y-1">
            {flat
              .filter((loc) => !isHiddenByCollapse(loc))
              .map(({ depth, ...loc }) => (
                <LocationRow
                  key={loc.id}
                  loc={loc}
                  depth={depth}
                  onEdit={() => setModalTarget(loc)}
                  hasChildren={locations.some((l) => l.parentId === loc.id)}
                  collapsed={collapsedIds.has(loc.id)}
                  onToggleCollapse={() => toggleCollapse(loc.id)}
                />
              ))}
          </div>
        )}
      </div>

      {modalTarget !== null && (
        <LocationModal
          key={modalTarget === "create" ? "create" : modalTarget.id}
          target={modalTarget}
          allLocations={locations}
          onClose={() => setModalTarget(null)}
        />
      )}
    </div>
  );
};

export default Locations;
