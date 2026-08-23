import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import CardHeader from "../../../../Components/Headers/CardHeader";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import SelectWithCreate from "../../../../Components/Inputs/SelectWithCreate";
import EditDefinitionModal from "../../../../Components/Modals/EditDefinitionModal";
import { faListCheck } from "@fortawesome/free-solid-svg-icons";
import { getSlaDefinitions, putSlaRuleMatrix } from "../../../../Services/sla";

import type { SlaDefinition, SlaRule } from "../../../../Types";

type Props = {
  slaRules: SlaRule[] | undefined;
};

const PRIORITIES = ["Low", "Medium", "High", "Critical"] as const;
const TICKET_TYPE_COLUMNS = [
  { key: "Any", value: null as string | null },
  { key: "Incident", value: "Incident" },
  { key: "Service", value: "Service" },
];

const slotKey = (priority: string, ticketTypeKey: string) => `${priority}::${ticketTypeKey}`;

const SlaRuleMatrix = ({ slaRules }: Props) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [grid, setGrid] = useState<Record<string, string>>({});
  const [createForSlot, setCreateForSlot] = useState<{ priority: string; ticketTypeKey: string } | null>(null);

  const definitionsQuery = useQuery({
    queryKey: ["definitions"],
    queryFn: () => getSlaDefinitions(),
  });

  useEffect(() => {
    if (!slaRules) return;
    const next: Record<string, string> = {};
    for (const rule of slaRules) {
      const ticketTypeKey = rule.ticketType ?? "Any";
      next[slotKey(rule.priority, ticketTypeKey)] = rule.slaDefinition?.id ?? rule.definitionId ?? "";
    }
    setGrid(next);
  }, [slaRules]);

  const definitionOptions = useMemo(
    () =>
      (definitionsQuery.data ?? []).map((def: SlaDefinition) => ({
        value: def.id,
        label: def.name,
      })),
    [definitionsQuery.data],
  );

  const mutation = useMutation({
    mutationFn: putSlaRuleMatrix,
    onSuccess: async () => {
      toast.success(t("toast.success.rulesMatrixSaved"));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["rules"] }),
        queryClient.invalidateQueries({ queryKey: ["definitions"] }),
      ]);
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("toast.error.rulesMatrixSave")),
  });

  const handleCellChange = (priority: string, ticketTypeKey: string, definitionId: string) => {
    setGrid((prev) => ({ ...prev, [slotKey(priority, ticketTypeKey)]: definitionId }));
  };

  const handleSave = () => {
    const entries = PRIORITIES.flatMap((priority) =>
      TICKET_TYPE_COLUMNS.map((column) => {
        const definitionId = grid[slotKey(priority, column.key)];
        if (!definitionId) return null;
        return { priority, ticketType: column.value, definitionId };
      }),
    ).filter((entry): entry is { priority: string; ticketType: string | null; definitionId: string } => entry !== null);

    mutation.mutate(entries);
  };

  if (!slaRules) return null;

  return (
    <div className="bg-white shadow-xl rounded-[10px] p-4">
      <div className="flex justify-between items-center mb-4">
        <CardHeader text={t("settings.rules")} icon={faListCheck} />
        <ButtonPrimary text={t("common.save")} onClick={handleSave} disabled={mutation.isPending} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left p-2 font-bold text-[#3C3C3C]">{t("form.priority")}</th>
              {TICKET_TYPE_COLUMNS.map((column) => (
                <th key={column.key} className="text-left p-2 font-bold text-[#3C3C3C]">
                  {t(`form.ticketType.${column.key.toLowerCase()}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PRIORITIES.map((priority) => (
              <tr key={priority}>
                <td className="p-2 font-bold">{t(`form.priority.${priority.toLowerCase()}`)}</td>
                {TICKET_TYPE_COLUMNS.map((column) => {
                  const key = slotKey(priority, column.key);
                  const selected =
                    definitionOptions.find((o: any) => o.value === grid[key]) ?? null;

                  return (
                    <td key={key} className="p-2 min-w-[200px]">
                      <SelectWithCreate
                        isClearable
                        placeholder={t("settings.rules.matrix.none")}
                        options={definitionOptions}
                        value={selected}
                        onSelect={(opt: any) => handleCellChange(priority, column.key, opt?.value ?? "")}
                        createLabel={t("settings.definitions.createNew")}
                        onCreateNew={() => setCreateForSlot({ priority, ticketTypeKey: column.key })}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <EditDefinitionModal
        data={null}
        isModalOpen={createForSlot !== null}
        handleOnClose={() => setCreateForSlot(null)}
        onCreated={(definition) => {
          if (!createForSlot) return;
          handleCellChange(createForSlot.priority, createForSlot.ticketTypeKey, definition.id);
        }}
      />
    </div>
  );
};

export default SlaRuleMatrix;
