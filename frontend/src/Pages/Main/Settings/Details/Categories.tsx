import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { faCheck, faChevronDown, faChevronUp, faLayerGroup, faPen, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import CardHeader from "../../../../Components/Headers/CardHeader";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import Input from "../../../../Components/Inputs/Input";
import Checkbox from "../../../../Components/Inputs/Checkbox";
import ColorPicker from "../../../../Components/Inputs/ColorPicker";
import SelectSecondary from "../../../../Components/Inputs/SelectSecondary";
import ConfirmationModal from "../../../../Components/Modals/ConfirmationModal";
import {
  TicketCategory,
  CustomFieldDef,
  CustomFieldType,
  listTicketCategories,
  upsertTicketCategory,
  deleteTicketCategory,
  listWorkflows,
} from "../../../../Services/ticketWorkflows";

const CUSTOM_FIELD_TYPES: CustomFieldType[] = [
  "text",
  "textarea",
  "number",
  "select",
  "checkbox",
  "date",
];

const emptyCustomField = (): CustomFieldDef => ({
  id: crypto.randomUUID(),
  label: "",
  type: "text",
  required: false,
  options: [],
});

const Categories = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [color, setColor] = useState("#2B9AE9");
  const [ticketType, setTicketType] = useState<"Incident" | "Service" | "">("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<{ open: boolean; onConfirm: () => void; message?: string }>({ open: false, onConfirm: () => {} });
  const askConfirm = (onConfirm: () => void, message?: string) => setConfirmState({ open: true, onConfirm, message });

  const categoriesQuery = useQuery({ queryKey: ["ticket-categories"], queryFn: listTicketCategories });
  const workflowsQuery = useQuery({ queryKey: ["ticket-workflows"], queryFn: listWorkflows });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["ticket-categories"] });

  const upsertMutation = useMutation({
    mutationFn: (c: Partial<TicketCategory> & { name: string }) => upsertTicketCategory(c),
    onSuccess: () => {
      toast.success(t("settings.workflow.categories.saved"));
      setName("");
      setColor("#2B9AE9");
      setTicketType("");
      setEditingId(null);
      invalidate();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("settings.workflow.saveFailed")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTicketCategory(id),
    onSuccess: () => {
      toast.success(t("settings.workflow.categories.deleted"));
      invalidate();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("settings.workflow.deleteFailed")),
  });

  const customFieldsMutation = useMutation({
    mutationFn: (input: Partial<TicketCategory> & { name: string }) => upsertTicketCategory(input),
    onSuccess: () => {
      toast.success(t("settings.workflow.categories.customFieldsSaved"));
      invalidate();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("settings.workflow.saveFailed")),
  });

  const submit = () => {
    if (!name.trim()) {
      toast.error(t("toast.error.nameRequired"));
      return;
    }
    upsertMutation.mutate({
      id: editingId ?? undefined,
      name: name.trim(),
      color,
      ticketType: ticketType || null,
      enabled: true,
    });
  };

  const categories = categoriesQuery.data ?? [];
  const workflows = workflowsQuery.data ?? [];

  return (
    <div className="space-y-4 m-4">
      <div className="bg-white shadow-xl rounded-[10px] p-4">
        <CardHeader text={t("settings.workflow.categories.create")} icon={faPlus} />
        <p className="text-[12px] text-[#7a7a7a] mt-2">{t("settings.workflow.categories.help")}</p>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
          <Input
            className="md:col-span-2 pt-0"
            value={name}
            handleChange={setName}
            placeholder={t("settings.workflow.categories.namePlaceholder")}
          />
          <div className="flex items-end pb-[5px]">
            <ColorPicker value={color} onChange={setColor} />
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <div className="min-w-[180px]">
            <SelectSecondary
              options={[
                { value: "", label: t("settings.workflow.categories.anyType") },
                { value: "Incident", label: t("form.ticketType.incident") },
                { value: "Service", label: t("form.ticketType.service") },
              ]}
              value={
                ticketType
                  ? {
                      value: ticketType,
                      label:
                        ticketType === "Incident"
                          ? t("form.ticketType.incident")
                          : t("form.ticketType.service"),
                    }
                  : { value: "", label: t("settings.workflow.categories.anyType") }
              }
              onSelect={(opt: any) => setTicketType((opt?.value ?? "") as any)}
            />
          </div>
          <ButtonPrimary
            className="h-[42px]"
            icon={editingId ? faCheck : faPlus}
            text={editingId ? t("settings.workflow.categories.update") : t("settings.workflow.categories.add")}
            onClick={submit}
            disabled={upsertMutation.isPending}
          />
          {editingId && (
            <ButtonPrimary
              className="h-[42px]"
              color="white"
              text={t("common.cancel")}
              onClick={() => {
                setEditingId(null);
                setName("");
                setColor("#2B9AE9");
                setTicketType("");
              }}
            />
          )}
        </div>
      </div>

      <div className="bg-white shadow-xl rounded-[10px] p-4">
        <CardHeader text={t("settings.workflow.categories.existing")} icon={faLayerGroup} />
        {categoriesQuery.isLoading ? (
          <div className="mt-3 text-[13px] text-[#7a7a7a]">{t("settings.workflow.loading")}</div>
        ) : categories.length === 0 ? (
          <div className="mt-3 text-[13px] text-[#7a7a7a]">
            {t("settings.workflow.categories.empty")}
          </div>
        ) : (
          <div className="mt-3 space-y-1">
            {categories.map((c) => {
              const wf = workflows.find((w) => w.id === c.workflowId);
              return (
                <div
                  key={c.id}
                  className="rounded-[6px] border border-[#E8E8E8] px-2 py-2"
                >
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span
                      className="w-[10px] h-[10px] rounded-full shrink-0"
                      style={{ backgroundColor: c.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-bold text-[#3C3C3C] truncate">
                        {c.name}
                      </div>
                      <div className="text-[11px] text-[#9a9a9a]">
                        {c.ticketType ?? t("settings.workflow.categories.any")}
                        {wf && (
                          <>
                            {" · "}
                            <span className="text-[#2B9AE9]">↳ {wf.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(c.id);
                        setName(c.name);
                        setColor(c.color);
                        setTicketType(c.ticketType ?? "");
                      }}
                      className="text-[#2B9AE9] cursor-pointer"
                      title={t("common.edit")}
                    >
                      <FontAwesomeIcon icon={faPen} />
                    </button>
                    <button
                      type="button"
                      onClick={() => askConfirm(() => deleteMutation.mutate(c.id), t("settings.workflow.categories.confirmDelete", { name: c.name }))}
                      className="text-[#F3606E] cursor-pointer"
                      title={t("common.delete")}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                  <div className="w-full sm:w-auto sm:min-w-[160px]">
                    <SelectSecondary
                      options={[
                        { value: "", label: t("settings.workflow.categories.noWorkflow") },
                        ...workflows.map((w) => ({ value: w.id, label: w.name })),
                      ]}
                      value={
                        c.workflowId
                          ? {
                              value: c.workflowId,
                              label:
                                workflows.find((w) => w.id === c.workflowId)?.name ??
                                "—",
                            }
                          : { value: "", label: t("settings.workflow.categories.noWorkflow") }
                      }
                      onSelect={(opt: any) => {
                        // createdAt/updatedAt are server-managed -- strip them so
                        // we don't send a whole loaded TicketCategory object
                        // (incl. read-only fields UpsertCategoryDto doesn't
                        // declare) back to the PUT endpoint.
                        const { createdAt, updatedAt, ...input } = c;
                        return upsertTicketCategory({
                          ...input,
                          workflowId: opt?.value || null,
                        }).then(invalidate);
                      }}
                    />
                  </div>
                </div>
                <CategoryCustomFields
                  category={c}
                  saving={customFieldsMutation.isPending}
                  onSave={(fields) => {
                    // createdAt/updatedAt are server-managed -- strip them so
                    // we don't send a whole loaded TicketCategory object
                    // (incl. read-only fields UpsertCategoryDto doesn't
                    // declare) back to the PUT endpoint.
                    const { createdAt, updatedAt, ...input } = c;
                    customFieldsMutation.mutate({ ...input, customFields: fields });
                  }}
                />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmationModal
        isModalOpen={confirmState.open}
        handleOnClose={() => setConfirmState((s) => ({ ...s, open: false }))}
        onCancel={() => setConfirmState((s) => ({ ...s, open: false }))}
        onDelete={() => { confirmState.onConfirm(); setConfirmState((s) => ({ ...s, open: false })); }}
        message={confirmState.message}
      />
    </div>
  );
};

// ───────────────────────── Custom fields ─────────────────────────

const CategoryCustomFields = ({
  category,
  onSave,
  saving,
}: {
  category: TicketCategory;
  onSave: (fields: CustomFieldDef[]) => void;
  saving: boolean;
}) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState<CustomFieldDef | null>(null);
  const fields = category.customFields ?? [];

  const typeOptions = CUSTOM_FIELD_TYPES.map((ty) => ({
    value: ty,
    label: t(`settings.workflow.categories.fieldType.${ty}`),
  }));

  const startAdd = () => setDraft(emptyCustomField());
  const startEdit = (f: CustomFieldDef) => setDraft({ ...f, options: f.options ?? [] });
  const cancelDraft = () => setDraft(null);

  const saveDraft = () => {
    if (!draft || !draft.label.trim()) return;
    const exists = fields.some((f) => f.id === draft.id);
    const next = exists
      ? fields.map((f) => (f.id === draft.id ? draft : f))
      : [...fields, draft];
    onSave(next);
    setDraft(null);
  };

  const removeField = (id: string) => onSave(fields.filter((f) => f.id !== id));

  return (
    <div className="mt-2 border-t border-[#F0F0F0] pt-2">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1.5 text-[12px] font-semibold text-[#2B9AE9] hover:underline cursor-pointer"
      >
        <FontAwesomeIcon icon={expanded ? faChevronUp : faChevronDown} className="text-[10px]" />
        {t("settings.workflow.categories.customFields", { count: fields.length })}
      </button>

      {expanded && (
        <div className="mt-2 space-y-2 rounded-[8px] border border-[#E8E8E8] bg-[#FAFAFA] p-3">
          {fields.length === 0 && !draft && (
            <div className="text-[12px] text-[#9a9a9a]">
              {t("settings.workflow.categories.customFieldsEmpty")}
            </div>
          )}
          {fields.map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-2 rounded-[6px] border border-[#E8E8E8] bg-white px-2 py-1.5"
            >
              <div className="flex-1 min-w-0">
                <span className="text-[13px] font-semibold text-[#3C3C3C]">{f.label}</span>
                <span className="ml-2 text-[11px] text-[#9a9a9a]">
                  {t(`settings.workflow.categories.fieldType.${f.type}`)}
                  {f.required ? ` · ${t("settings.workflow.categories.required")}` : ""}
                </span>
              </div>
              <button type="button" onClick={() => startEdit(f)} className="text-[#2B9AE9] cursor-pointer" title={t("common.edit")}>
                <FontAwesomeIcon icon={faPen} className="text-[11px]" />
              </button>
              <button type="button" onClick={() => removeField(f.id)} className="text-[#F3606E] cursor-pointer" title={t("common.delete")}>
                <FontAwesomeIcon icon={faTrash} className="text-[11px]" />
              </button>
            </div>
          ))}

          {draft ? (
            <div className="space-y-2 rounded-[6px] border border-[#B3D9F7] bg-white p-2">
              <Input
                className="pt-0"
                value={draft.label}
                handleChange={(v: string) => setDraft({ ...draft, label: v })}
                placeholder={t("settings.workflow.categories.fieldLabelPlaceholder")}
              />
              <div className="flex flex-wrap items-center gap-2">
                <div className="min-w-[140px]">
                  <SelectSecondary
                    options={typeOptions}
                    value={typeOptions.find((o) => o.value === draft.type) ?? typeOptions[0]}
                    onSelect={(opt: any) => setDraft({ ...draft, type: opt.value })}
                  />
                </div>
                <Checkbox
                  id={`field-${draft.id}-required`}
                  checked={draft.required}
                  handleChange={(v: boolean) => setDraft({ ...draft, required: v })}
                  label={t("settings.workflow.categories.required")}
                />
              </div>
              {draft.type === "select" && (
                <Input
                  className="pt-0"
                  value={(draft.options ?? []).join(", ")}
                  handleChange={(v: string) =>
                    setDraft({
                      ...draft,
                      options: v.split(",").map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  placeholder={t("settings.workflow.categories.fieldOptionsPlaceholder")}
                />
              )}
              <div className="flex items-center gap-2">
                <ButtonPrimary
                  icon={faCheck}
                  text={t("common.save")}
                  onClick={saveDraft}
                  disabled={!draft.label.trim() || saving}
                />
                <ButtonPrimary color="white" text={t("common.cancel")} onClick={cancelDraft} />
              </div>
            </div>
          ) : (
            <ButtonPrimary
              icon={faPlus}
              color="white"
              text={t("settings.workflow.categories.addField")}
              onClick={startAdd}
              disabled={saving}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default Categories;
