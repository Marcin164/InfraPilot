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
  faXmark,
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
import { useCurrentUser } from "../../../../Hooks/useCurrentUser";
import { hasRequiredRole } from "../../../../Constants/navigation";
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

const LocationRow = ({
  loc,
  depth,
  allLocations,
  onRefresh,
  hasChildren,
  collapsed,
  onToggleCollapse,
}: {
  loc: Location;
  depth: number;
  allLocations: Location[];
  onRefresh: () => void;
  hasChildren: boolean;
  collapsed: boolean;
  onToggleCollapse: () => void;
}) => {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewCoords, setPreviewCoords] = useState<Coordinates | null>(
    loc.latitude != null && loc.longitude != null
      ? { lat: loc.latitude, lng: loc.longitude }
      : null,
  );
  const [confirmState, setConfirmState] = useState<{ open: boolean; onConfirm: () => void; message?: string }>({ open: false, onConfirm: () => {} });
  const askConfirm = (onConfirm: () => void, message?: string) => setConfirmState({ open: true, onConfirm, message });

  const coordsMutation = useMutation({
    mutationFn: (coords: Coordinates | null) =>
      updateLocation(loc.id, {
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
      }),
    onSuccess: () => {
      toast.success(t("settings.locations.updated"));
      setPreviewOpen(false);
      onRefresh();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("settings.locations.updateFailed")),
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
      const updated = await updateLocation(loc.id, {
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
        ? uploadLocationPlan(loc.id, values.plan)
        : updated;
    },
    onSuccess: () => {
      toast.success(t("settings.locations.updated"));
      setEditing(false);
      onRefresh();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("settings.locations.updateFailed")),
  });

  const form = useForm({
    defaultValues: {
      name: loc.name,
      type: loc.type,
      parentId: loc.parentId ?? "",
      description: loc.description ?? "",
      plan: null as File | null,
      coordinates:
        loc.latitude != null && loc.longitude != null
          ? { lat: loc.latitude, lng: loc.longitude }
          : (null as Coordinates | null),
      planPosition:
        loc.planX != null && loc.planY != null
          ? { x: loc.planX, y: loc.planY }
          : (null as PlanPosition),
    },
    onSubmit: ({ value }) => updateMutation.mutate(value),
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
      {editing ? (
        <form
          className="flex flex-1 flex-wrap gap-2 items-center"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <form.Field
            name="name"
            validators={{ onChange: ({ value }) => requiredValidator(value) }}
            children={(field) => (
              <div className="flex-1 min-w-[120px]">
                <Input
                  value={field.state.value}
                  handleChange={field.handleChange}
                  errors={field.state.meta.errors?.join(", ")}
                  className="pt-0"
                />
              </div>
            )}
          />
          <form.Field
            name="type"
            children={(field) => (
              <div className="min-w-[140px]">
                <SelectSecondary
                  options={LOCATION_TYPES.map((lt) => ({ value: lt, label: lt }))}
                  value={{ value: field.state.value, label: field.state.value }}
                  onSelect={(opt: any) => field.handleChange(opt.value as LocationType)}
                />
              </div>
            )}
          />
          <form.Field
            name="parentId"
            children={(field) => (
              <div className="min-w-[160px]">
                <SelectSecondary
                  options={[
                    { value: "", label: t("settings.locations.noParent") },
                    ...possibleParents.map((p) => ({ value: p.id, label: p.name })),
                  ]}
                  value={
                    field.state.value
                      ? {
                          value: field.state.value,
                          label: possibleParents.find((p) => p.id === field.state.value)?.name ?? field.state.value,
                        }
                      : { value: "", label: t("settings.locations.noParent") }
                  }
                  onSelect={(opt: any) => field.handleChange(opt.value)}
                />
              </div>
            )}
          />
          <form.Field
            name="description"
            children={(field) => (
              <div className="flex-1 min-w-[100px]">
                <Input
                  value={field.state.value}
                  handleChange={field.handleChange}
                  placeholder={t("common.description")}
                  className="pt-0"
                />
              </div>
            )}
          />
          <form.Subscribe selector={(state) => [state.values.type, state.values.parentId] as const}>
            {([type, parentId]) => (
              <>
                {type === "building" && (
                  <form.Field
                    name="coordinates"
                    children={(field) => (
                      <div className="min-w-[180px]">
                        <CoordinatesPicker value={field.state.value} onChange={field.handleChange} />
                      </div>
                    )}
                  />
                )}
                {type === "floor" && (
                  <form.Field
                    name="plan"
                    validators={{ onChange: ({ value }) => imageFileValidator(value) }}
                    children={(field) => (
                      <div className="flex-1 min-w-[100px]">
                        {!field.state.value && loc.planPath && (
                          <div className="text-[11px] text-[#9a9a9a] mb-1 truncate">
                            {t("settings.locations.currentPlan", {
                              name: loc.planOriginalName ?? t("common.plan"),
                            })}
                          </div>
                        )}
                        <Input
                          type="file"
                          accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml"
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
                      <div className="min-w-[220px] flex-1 basis-full">
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
          <button
            type="submit"
            disabled={!form.state.canSubmit}
            className="text-[#30A712] hover:text-[#27892C]"
          >
            <FontAwesomeIcon icon={faCheck} />
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="text-[#9a9a9a] hover:text-[#3C3C3C]"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </form>
      ) : (
        <>
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
            onClick={() => setEditing(true)}
            className="text-[#2B9AE9] hover:text-[#1a7ac5] ml-2"
          >
            <FontAwesomeIcon icon={faPen} className="text-[12px]" />
          </button>
          <button
            onClick={() => askConfirm(() => deleteMutation.mutate(), `${t("settings.locations.confirmDelete")} "${loc.name}"?`)}
            className="text-[#F3606E] hover:text-[#C0392B]"
          >
            <FontAwesomeIcon icon={faTrash} className="text-[12px]" />
          </button>
        </>
      )}
      <ConfirmationModal
        isModalOpen={confirmState.open}
        handleOnClose={() => setConfirmState((s) => ({ ...s, open: false }))}
        onCancel={() => setConfirmState((s) => ({ ...s, open: false }))}
        onDelete={() => { confirmState.onConfirm(); setConfirmState((s) => ({ ...s, open: false })); }}
        message={confirmState.message}
      />
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
  const queryClient = useQueryClient();

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
      form.reset();
      invalidate();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("settings.locations.createFailed")),
  });

  const form = useForm({
    defaultValues: {
      name: "",
      type: "other" as LocationType,
      parentId: "",
      description: "",
      plan: null as File | null,
      coordinates: null as Coordinates | null,
      planPosition: null as PlanPosition,
    },
    onSubmit: ({ value }) => {
      if (!value.name.trim()) return toast.error(t("settings.locations.nameRequired"));
      createMutation.mutate(value);
    },
  });

  const currentUserQuery = useCurrentUser();
  if (!hasRequiredRole("admin", currentUserQuery.data)) return null;

  return (
    <div className="space-y-4 m-4">
      <div className="bg-white shadow-xl rounded-[10px] p-4">
        <CardHeader text={t("settings.locations.create")} icon={faPlus} />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
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
                    ...locations.map((l) => ({ value: l.id, label: `${l.name} (${l.type})` })),
                  ]}
                  value={
                    field.state.value
                      ? {
                          value: field.state.value,
                          label: locations.find((l) => l.id === field.state.value)?.name ?? field.state.value,
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
                        <Input
                          type="file"
                          accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml"
                          label={t("common.plan")}
                          handleChange={field.handleChange}
                          errors={field.state.meta.errors?.join(", ")}
                          className="pt-0"
                        />
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
                            planLocation={findAncestorFloor(locations, parentId)}
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
          <div className="mt-3">
            <ButtonPrimary
              icon={faPlus}
              type="submit"
              text={
                createMutation.isPending
                  ? t("common.creating")
                  : t("settings.locations.createBtn")
              }
              disabled={!form.state.canSubmit || createMutation.isPending}
            />
          </div>
        </form>
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
            {flat
              .filter((loc) => !isHiddenByCollapse(loc))
              .map(({ depth, ...loc }) => (
                <LocationRow
                  key={loc.id}
                  loc={loc}
                  depth={depth}
                  allLocations={locations}
                  onRefresh={invalidate}
                  hasChildren={locations.some((l) => l.parentId === loc.id)}
                  collapsed={collapsedIds.has(loc.id)}
                  onToggleCollapse={() => toggleCollapse(loc.id)}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Locations;
