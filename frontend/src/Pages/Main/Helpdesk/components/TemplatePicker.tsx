import { useMemo, useRef, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaste } from "@fortawesome/free-solid-svg-icons";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import {
  listTicketTemplates,
  substituteTemplate,
  TicketTemplate,
} from "../../../../Services/ticketTemplates";

type Props = {
  ticket: any;
  onPick: (text: string) => void;
  disabled?: boolean;
};

const TemplatePicker = ({ ticket, onPick, disabled }: Props) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);

  const templatesQuery = useQuery({
    queryKey: ["ticket-templates"],
    queryFn: listTicketTemplates,
    staleTime: 60000,
  });

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const context = useMemo(() => {
    const requester = ticket?.requester ?? {};
    const [firstName, lastName] = (requester.distinguishedName ?? "")
      .split(" ")
      .filter(Boolean);
    return {
      ticket: {
        number: ticket?.number,
        type: ticket?.type,
        category: ticket?.category ?? "",
      },
      requester: {
        firstName: requester.name ?? firstName ?? "",
        lastName: requester.surname ?? lastName ?? "",
        email: requester.email ?? "",
        fullName: requester.distinguishedName ?? "",
      },
      device: {
        assetName: ticket?.device?.assetName ?? "",
        serialNumber: ticket?.device?.serialNumber ?? "",
        model: ticket?.device?.model ?? "",
      },
    };
  }, [ticket]);

  const grouped = useMemo(() => {
    const all = templatesQuery.data ?? [];
    const q = query.trim().toLowerCase();
    const matched = q
      ? all.filter(
          (t) =>
            t.name.toLowerCase().includes(q) ||
            t.body.toLowerCase().includes(q) ||
            t.category.toLowerCase().includes(q),
        )
      : all;
    const byCategory = new Map<string, TicketTemplate[]>();
    for (const t of matched) {
      const list = byCategory.get(t.category) ?? [];
      list.push(t);
      byCategory.set(t.category, list);
    }
    return Array.from(byCategory.entries());
  }, [templatesQuery.data, query]);

  const handlePick = (tpl: TicketTemplate) => {
    onPick(substituteTemplate(tpl.body, context));
    setOpen(false);
    setQuery("");
  };

  return (
    <div className="relative" ref={boxRef}>
      <ButtonPrimary
        icon={faPaste}
        className="shrink-0"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        title="Insert template"
      />
      {open && (
        <div className="absolute bottom-[48px] left-0 z-50 w-[360px] max-h-[400px] overflow-y-auto rounded-[10px] bg-white shadow-xl border border-[#E0E0E0]">
          <div className="p-2 border-b border-[#F0F0F0]">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search templates…"
              className="w-full h-[32px] rounded-[6px] border border-[#D0D0D0] px-2 text-[13px] outline-none"
            />
          </div>
          {templatesQuery.isLoading ? (
            <div className="p-3 text-[12px] text-[#7a7a7a]">Loading…</div>
          ) : grouped.length === 0 ? (
            <div className="p-3 text-[12px] text-[#7a7a7a]">
              No templates. Create one in Settings → Templates.
            </div>
          ) : (
            grouped.map(([category, items]) => (
              <div key={category}>
                <div className="px-3 py-1 text-[11px] font-bold uppercase text-[#9a9a9a] bg-[#FAFAFA]">
                  {category}
                </div>
                {items.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handlePick(tpl)}
                    className="block w-full text-left px-3 py-2 hover:bg-[#F5F5F5] border-b border-[#F5F5F5] cursor-pointer"
                  >
                    <div className="text-[13px] font-bold text-[#3C3C3C]">
                      {tpl.name}
                    </div>
                    <div className="text-[11px] text-[#7a7a7a] line-clamp-2">
                      {tpl.body.slice(0, 120)}
                      {tpl.body.length > 120 && "…"}
                    </div>
                  </button>
                ))}
              </div>
            ))
          )}
          <div className="p-2 text-[10px] text-[#9a9a9a] border-t border-[#F0F0F0]">
            Placeholders: <code>{"{requester.firstName}"}</code>,{" "}
            <code>{"{device.assetName}"}</code>,{" "}
            <code>{"{ticket.number}"}</code>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplatePicker;
