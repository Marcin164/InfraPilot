import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faShoppingCart, faPlus, faPen, faTrash, faCheck, faXmark, faChevronDown,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import PageMotion from "../../../Components/PageMotion/PageMotion";
import ButtonPrimary from "../../../Components/Buttons/ButtonPrimary";
import Input from "../../../Components/Inputs/Input";
import SelectSecondary from "../../../Components/Inputs/SelectSecondary";
import {
  getPurchaseOrders,
  createPurchaseOrder,
  updatePurchaseOrder,
  updatePurchaseOrderStatus,
  deletePurchaseOrder,
  PurchaseOrderStatus,
  CreatePurchaseOrderDto,
  PurchaseOrder,
} from "../../../Services/purchaseOrders";

const STATUS_CONFIG: Record<PurchaseOrderStatus, { color: string; bg: string }> = {
  draft:      { color: "#9a9a9a", bg: "#F5F5F5" },
  submitted:  { color: "#2B9AE9", bg: "#EBF5FB" },
  approved:   { color: "#8E44AD", bg: "#F5EEF8" },
  ordered:    { color: "#F1A20F", bg: "#FEF9EC" },
  received:   { color: "#30A712", bg: "#EAFAE5" },
  cancelled:  { color: "#F3606E", bg: "#FEF0F0" },
};

const STATUSES: PurchaseOrderStatus[] = ["draft","submitted","approved","ordered","received","cancelled"];

const EMPTY: CreatePurchaseOrderDto = {
  title: "",
  supplier: "",
  status: "draft",
  orderDate: "",
  expectedDelivery: "",
  totalCost: "",
  currency: "USD",
  notes: "",
};

const StatusBadge = ({ status }: { status: PurchaseOrderStatus }) => {
  const cfg = STATUS_CONFIG[status] ?? { color: "#9a9a9a", bg: "#F5F5F5" };
  return (
    <span
      className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={{ color: cfg.color, backgroundColor: cfg.bg }}
    >
      {status}
    </span>
  );
};

const formatDate = (s: string | null) => (s ? s.slice(0, 10) : "—");

const Procurement = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<CreatePurchaseOrderDto>({ ...EMPTY });
  const [statusMenuFor, setStatusMenuFor] = useState<string | null>(null);

  const ordersQuery = useQuery({
    queryKey: ["procurement"],
    queryFn: () => getPurchaseOrders(),
  });

  const createMut = useMutation({
    mutationFn: createPurchaseOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procurement"] });
      toast.success(t("procurement.created"));
      setIsFormOpen(false);
      setDraft({ ...EMPTY });
    },
    onError: () => toast.error(t("procurement.error")),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<CreatePurchaseOrderDto> }) =>
      updatePurchaseOrder(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procurement"] });
      toast.success(t("procurement.updated"));
      setIsFormOpen(false);
      setEditing(null);
    },
    onError: () => toast.error(t("procurement.error")),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: PurchaseOrderStatus }) =>
      updatePurchaseOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procurement"] });
      setStatusMenuFor(null);
    },
    onError: () => toast.error(t("procurement.error")),
  });

  const deleteMut = useMutation({
    mutationFn: deletePurchaseOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procurement"] });
      toast.success(t("procurement.deleted"));
    },
    onError: () => toast.error(t("procurement.error")),
  });

  const handleSave = () => {
    if (editing) {
      updateMut.mutate({ id: editing, dto: draft });
    } else {
      createMut.mutate(draft);
    }
  };

  const startEdit = (o: PurchaseOrder) => {
    setEditing(o.id);
    setDraft({
      title: o.title,
      supplier: o.supplier ?? "",
      status: o.status,
      orderDate: o.orderDate ? o.orderDate.slice(0, 10) : "",
      expectedDelivery: o.expectedDelivery ? o.expectedDelivery.slice(0, 10) : "",
      totalCost: o.totalCost ?? "",
      currency: o.currency ?? "USD",
      notes: o.notes ?? "",
    });
    setIsFormOpen(true);
  };

  const cancelForm = () => {
    setIsFormOpen(false);
    setEditing(null);
    setDraft({ ...EMPTY });
  };

  const orders = ordersQuery.data?.data ?? [];
  const total = ordersQuery.data?.total ?? 0;

  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = orders.filter((o) => o.status === s).length;
    return acc;
  }, {} as Record<PurchaseOrderStatus, number>);

  const FormPanel = () => (
    <div className="bg-white shadow-xl rounded-[10px] p-4 mb-4">
      <div className="font-semibold text-[15px] text-[#3C3C3C] mb-3">
        {editing ? t("procurement.edit") : t("procurement.add")}
      </div>
      <div className="grid grid-cols-2 gap-x-4 mb-3">
        <Input
          label={`${t("procurement.field.title")} *`}
          value={draft.title}
          handleChange={(v: string) => setDraft((d) => ({ ...d, title: v }))}
          className="col-span-2"
        />
        <Input
          label={t("procurement.field.supplier")}
          value={draft.supplier}
          handleChange={(v: string) => setDraft((d) => ({ ...d, supplier: v }))}
        />
        <SelectSecondary
          label={t("procurement.field.status")}
          options={STATUSES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
          value={{ value: draft.status, label: draft.status ? draft.status.charAt(0).toUpperCase() + draft.status.slice(1) : "" }}
          onSelect={(opt: any) => setDraft((d) => ({ ...d, status: opt.value as PurchaseOrderStatus }))}
        />
        <Input
          label={t("procurement.field.orderDate")}
          type="date"
          value={draft.orderDate}
          handleChange={(v: string) => setDraft((d) => ({ ...d, orderDate: v }))}
        />
        <Input
          label={t("procurement.field.expectedDelivery")}
          type="date"
          value={draft.expectedDelivery}
          handleChange={(v: string) => setDraft((d) => ({ ...d, expectedDelivery: v }))}
        />
        <Input
          label={t("procurement.field.totalCost")}
          type="number"
          value={draft.totalCost}
          handleChange={(v: string) => setDraft((d) => ({ ...d, totalCost: v }))}
        />
        <Input
          label={t("procurement.field.currency")}
          value={draft.currency}
          handleChange={(v: string) => setDraft((d) => ({ ...d, currency: v }))}
        />
        <div className="col-span-2 pt-2">
          <label className="font-bold text-[#3C3C3C]">{t("procurement.field.notes")}</label>
          <textarea
            rows={2}
            className="w-full mt-[6px] rounded-[10px] border border-[#535353] bg-white font-bold px-3 py-2 text-[16px] block resize-none"
            value={draft.notes}
            onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <ButtonPrimary icon={faCheck} text={t("btn.save")} onClick={handleSave}
          disabled={!draft.title || createMut.isPending || updateMut.isPending} />
        <ButtonPrimary icon={faXmark} text={t("btn.cancel")} color="white" onClick={cancelForm} />
      </div>
    </div>
  );

  return (
    <PageMotion>
      <div className="w-full p-4 max-w-5xl">
        {/* Header */}
        <div className="bg-white shadow-xl rounded-[10px] p-4 mb-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 font-semibold text-[20px] text-[#3C3C3C]">
              <FontAwesomeIcon icon={faShoppingCart} className="text-[#2B9AE9]" />
              {t("procurement.title")}
              <span className="text-[14px] font-normal text-[#9a9a9a]">({total})</span>
            </div>
            <ButtonPrimary
              icon={faPlus}
              text={t("procurement.add")}
              onClick={() => { setIsFormOpen(true); setEditing(null); setDraft({ ...EMPTY }); }}
            />
          </div>

          {/* Status counters */}
          <div className="flex gap-4 mt-3 flex-wrap">
            {STATUSES.map((s) => {
              const cfg = STATUS_CONFIG[s];
              return (
                <div key={s} className="flex items-center gap-1.5">
                  <span className="text-[18px] font-bold" style={{ color: cfg.color }}>{counts[s]}</span>
                  <span className="text-[12px] text-[#9a9a9a]">{s}</span>
                </div>
              );
            })}
          </div>
        </div>

        {isFormOpen && <FormPanel />}

        {/* Orders list */}
        <div className="bg-white shadow-xl rounded-[10px] p-4">
          {ordersQuery.isLoading ? (
            <div className="text-[13px] text-[#9a9a9a] py-4 text-center">{t("loading")}</div>
          ) : orders.length === 0 ? (
            <div className="text-[13px] text-[#9a9a9a] py-4 text-center">{t("procurement.empty")}</div>
          ) : (
            <div className="space-y-2">
              {orders.map((o) => (
                <div key={o.id} className="border border-[#F0F0F0] rounded-[8px] p-3 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-[14px] text-[#3C3C3C]">{o.title}</span>
                      <StatusBadge status={o.status} />
                    </div>
                    <div className="flex gap-4 text-[12px] text-[#9a9a9a] flex-wrap">
                      {o.supplier && <span>{t("procurement.field.supplier")}: <span className="text-[#555]">{o.supplier}</span></span>}
                      {o.orderDate && <span>{t("procurement.field.orderDate")}: <span className="text-[#555]">{formatDate(o.orderDate)}</span></span>}
                      {o.expectedDelivery && <span>{t("procurement.field.expectedDelivery")}: <span className="text-[#555]">{formatDate(o.expectedDelivery)}</span></span>}
                      {o.totalCost && (
                        <span className="font-semibold text-[#3C3C3C]">
                          {Number(o.totalCost).toLocaleString()} {o.currency ?? ""}
                        </span>
                      )}
                    </div>
                    {o.notes && <div className="text-[11px] text-[#9a9a9a] mt-0.5">{o.notes}</div>}
                    {o.requester && (
                      <div className="text-[11px] text-[#9a9a9a] mt-0.5">
                        {t("procurement.field.requester")}: {o.requester.name} {o.requester.surname}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0 relative">
                    {/* Status changer */}
                    <div className="relative">
                      <button
                        onClick={() => setStatusMenuFor(statusMenuFor === o.id ? null : o.id)}
                        className="p-1.5 rounded-[6px] text-[#9a9a9a] hover:text-[#2B9AE9] hover:bg-[#EBF5FB] transition-colors"
                        title={t("procurement.changeStatus")}
                      >
                        <FontAwesomeIcon icon={faChevronDown} className="text-[11px]" />
                      </button>
                      {statusMenuFor === o.id && (
                        <div className="absolute right-0 top-7 z-10 bg-white border border-[#E0E0E0] rounded-[8px] shadow-xl min-w-[140px] py-1">
                          {STATUSES.map((s) => (
                            <button
                              key={s}
                              onClick={() => statusMut.mutate({ id: o.id, status: s })}
                              className="w-full text-left px-3 py-1.5 text-[12px] hover:bg-[#F5F5F5] flex items-center gap-2"
                            >
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_CONFIG[s].color }} />
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => startEdit(o)}
                      className="p-1.5 rounded-[6px] text-[#9a9a9a] hover:text-[#2B9AE9] hover:bg-[#EBF5FB] transition-colors"
                    >
                      <FontAwesomeIcon icon={faPen} className="text-[11px]" />
                    </button>
                    <button
                      onClick={() => { if (window.confirm(t("procurement.confirmDelete"))) deleteMut.mutate(o.id); }}
                      className="p-1.5 rounded-[6px] text-[#9a9a9a] hover:text-[#F3606E] hover:bg-[#FEF0F0] transition-colors"
                    >
                      <FontAwesomeIcon icon={faTrash} className="text-[11px]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageMotion>
  );
};

export default Procurement;
