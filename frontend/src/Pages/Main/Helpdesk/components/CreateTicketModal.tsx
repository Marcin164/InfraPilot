import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTicket, faXmark, faCheck } from "@fortawesome/free-solid-svg-icons";

import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import SelectSecondary from "../../../../Components/Inputs/SelectSecondary";
import {
  createTicket,
  getTicketCategories,
  type CreateTicketPayload,
} from "../../../../Services/tickets";
import { getUsers } from "../../../../Services/users";
import { getDevicesByOwner } from "../../../../Services/devices";
import type { TicketType, TicketPriority, TicketImpact, TicketUrgency } from "../../../../Types";

const TYPE_OPTIONS: { value: TicketType; label: string }[] = [
  { value: "Incident", label: "Incident" },
  { value: "Service", label: "Service" },
];

const PRIORITY_OPTIONS: TicketPriority[] = ["Low", "Medium", "High", "Critical"];
const IMPACT_OPTIONS: TicketImpact[] = ["Single user", "Multiple users", "Whole company"];
const URGENCY_OPTIONS: TicketUrgency[] = ["Low", "Medium", "High"];

type Props = {
  onClose: () => void;
  onCreated: () => void;
};

const CreateTicketModal = ({ onClose, onCreated }: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [requester, setRequester] = useState<{ value: string; label: string } | null>(null);
  const [type, setType] = useState<TicketType | null>(null);
  const [category, setCategory] = useState<{ value: string; label: string } | null>(null);
  const [priority, setPriority] = useState<{ value: TicketPriority; label: string } | null>(null);
  const [impact, setImpact] = useState<{ value: TicketImpact; label: string } | null>(null);
  const [urgency, setUrgency] = useState<{ value: TicketUrgency; label: string } | null>(null);
  const [device, setDevice] = useState<{ value: string; label: string } | null>(null);
  const [description, setDescription] = useState("");

  const usersQuery = useQuery({ queryKey: ["users-all"], queryFn: getUsers });
  const categoriesQuery = useQuery({
    queryKey: ["ticket-categories"],
    queryFn: getTicketCategories,
  });
  const devicesQuery = useQuery({
    queryKey: ["user-devices", requester?.value],
    queryFn: () => getDevicesByOwner(requester!.value),
    enabled: Boolean(requester?.value),
  });

  const userOptions = useMemo(
    () =>
      (usersQuery.data ?? []).map((u) => ({
        value: u.id,
        label: [u.name, u.surname].filter(Boolean).join(" ") || u.username || u.email || u.id,
      })),
    [usersQuery.data],
  );

  const categoryOptions = useMemo(() => {
    if (!type || !categoriesQuery.data) return [];
    return (categoriesQuery.data[type] ?? []).map((c) => ({ value: c.name, label: c.name }));
  }, [type, categoriesQuery.data]);

  const deviceOptions = useMemo(
    () =>
      (devicesQuery.data ?? []).map((d) => ({
        value: d.id,
        label: [d.assetName || d.model, d.serialNumber].filter(Boolean).join(" — "),
      })),
    [devicesQuery.data],
  );

  const createMutation = useMutation({
    mutationFn: () => {
      const payload: CreateTicketPayload = {
        type: type!,
        description: description.trim(),
        requesterId: requester!.value,
        category: category?.value,
        deviceId: device?.value,
        priority: priority?.value,
        impact: impact?.value,
        urgency: urgency?.value,
      };
      return createTicket(payload);
    },
    onSuccess: (ticket) => {
      toast.success(t("toast.success.ticketCreated"));
      onCreated();
      onClose();
      navigate(`/admin/helpdesk/${ticket.id}`);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? t("toast.error.ticket")),
  });

  const canSubmit =
    Boolean(requester) && Boolean(type) && description.trim().length > 0 && !createMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-[12px] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F0F0]">
          <div className="flex items-center gap-2 font-bold text-[16px]">
            <FontAwesomeIcon icon={faTicket} className="text-[#2B9AE9]" />
            {t("helpdesk.newTicket.title")}
          </div>
          <button onClick={onClose} className="text-[#9a9a9a] hover:text-[#3C3C3C] cursor-pointer">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className="px-6 py-4 flex flex-col gap-2">
          <SelectSecondary
            label={`${t("helpdesk.newTicket.requester")} *`}
            options={userOptions}
            value={requester}
            onSelect={(opt: any) => setRequester(opt)}
            placeholder={t("helpdesk.newTicket.requesterPlaceholder")}
          />

          <div className="grid grid-cols-2 gap-3">
            <SelectSecondary
              label={`${t("helpdesk.newTicket.type")} *`}
              options={TYPE_OPTIONS}
              value={TYPE_OPTIONS.find((o) => o.value === type) ?? null}
              onSelect={(opt: any) => {
                setType(opt?.value ?? null);
                setCategory(null);
              }}
            />
            <SelectSecondary
              label={t("helpdesk.newTicket.category")}
              options={categoryOptions}
              value={category}
              onSelect={(opt: any) => setCategory(opt)}
              placeholder={t("helpdesk.newTicket.categoryPlaceholder")}
              isDisabled={!type}
              isClearable
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <SelectSecondary
              label={t("helpdesk.newTicket.priority")}
              options={PRIORITY_OPTIONS.map((p) => ({ value: p, label: p }))}
              value={priority}
              onSelect={(opt: any) => setPriority(opt)}
              isClearable
            />
            <SelectSecondary
              label={t("helpdesk.newTicket.impact")}
              options={IMPACT_OPTIONS.map((i) => ({ value: i, label: i }))}
              value={impact}
              onSelect={(opt: any) => setImpact(opt)}
              isClearable
            />
            <SelectSecondary
              label={t("helpdesk.newTicket.urgency")}
              options={URGENCY_OPTIONS.map((u) => ({ value: u, label: u }))}
              value={urgency}
              onSelect={(opt: any) => setUrgency(opt)}
              isClearable
            />
          </div>

          <SelectSecondary
            label={t("helpdesk.newTicket.device")}
            options={deviceOptions}
            value={device}
            onSelect={(opt: any) => setDevice(opt)}
            placeholder={
              requester ? t("helpdesk.newTicket.devicePlaceholder") : t("helpdesk.newTicket.deviceNeedsRequester")
            }
            isDisabled={!requester}
            isClearable
          />

          <div className="pt-2">
            <label className="font-bold text-[#3C3C3C]">{`${t("helpdesk.newTicket.description")} *`}</label>
            <textarea
              rows={4}
              className="w-full mt-[6px] border border-[#535353] bg-white text-[16px] font-bold block rounded-[10px] px-3 py-2 resize-none"
              placeholder={t("helpdesk.newTicket.descriptionPlaceholder")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#F0F0F0]">
          <ButtonPrimary icon={faXmark} text={t("common.cancel")} color="white" onClick={onClose} />
          <ButtonPrimary
            icon={faCheck}
            text={createMutation.isPending ? t("helpdesk.newTicket.creating") : t("helpdesk.newTicket.create")}
            onClick={() => createMutation.mutate()}
            disabled={!canSubmit}
          />
        </div>
      </div>
    </div>
  );
};

export default CreateTicketModal;
