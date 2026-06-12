import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  supabase,
  type Lead,
  type LeadStatus,
  STATUS_ORDER,
  STATUS_CONFIG,
} from "@/lib/supabase";
import { ScoreBadge, ChannelIcon, timeAgo } from "@/components/admin/atoms";
import { LeadDrawer } from "@/components/admin/LeadDrawer";
import { Search, Clock } from "lucide-react";

export const Route = createFileRoute("/admin/crm")({
  component: CRMPage,
});

function CRMPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [tipo, setTipo] = useState<string>("");
  const [openLead, setOpenLead] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const fetch = async () => {
    const { data } = await supabase
      .from("leads")
      .select("*")
      .order("updated_at", { ascending: false });
    setLeads((data as Lead[]) ?? []);
  };

  useEffect(() => {
    fetch();
    const ch = supabase
      .channel("crm-leads")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, fetch)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const tipos = useMemo(
    () =>
      Array.from(
        new Set(leads.map((l) => l.tipo_negocio).filter((t): t is string => !!t)),
      ),
    [leads],
  );

  const filtered = leads.filter(
    (l) =>
      (!search || l.nome.toLowerCase().includes(search.toLowerCase())) &&
      (!tipo || l.tipo_negocio === tipo),
  );

  const grouped = useMemo(() => {
    const g: Record<LeadStatus, Lead[]> = {
      novo: [],
      qualificado: [],
      agendado: [],
      "reuniao-feita": [],
      proposta: [],
      ganho: [],
      perdido: [],
    };
    filtered.forEach((l) => g[l.status]?.push(l));
    return g;
  }, [filtered]);


  async function handleDragEnd(e: DragEndEvent) {
    const leadId = e.active.id as string;
    const newStatus = e.over?.id as LeadStatus | undefined;
    if (!newStatus) return;
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.status === newStatus) return;
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId ? { ...l, status: newStatus, updated_at: new Date().toISOString() } : l,
      ),
    );
    await supabase
      .from("leads")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", leadId);
  }

  return (
    <div className="flex h-screen flex-col p-6 md:p-8">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="font-display text-3xl font-extrabold">CRM Kanban</h1>
        <div className="flex gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome…"
              className="rounded-md border border-white/10 bg-black/30 py-2 pl-9 pr-3 text-sm outline-none focus:border-amber-500/50"
            />
          </div>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm"
          >
            <option value="">Todos os negócios</option>
            {tipos.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex flex-1 gap-4 overflow-x-auto pb-4">
          {STATUS_ORDER.map((status) => (
            <Column key={status} status={status} leads={grouped[status]} onOpen={setOpenLead} />
          ))}
        </div>
      </DndContext>

      {openLead && <LeadDrawer leadId={openLead} onClose={() => setOpenLead(null)} />}
    </div>
  );
}

function Column({
  status,
  leads,
  onOpen,
}: {
  status: LeadStatus;
  leads: Lead[];
  onOpen: (id: string) => void;
}) {
  const cfg = STATUS_CONFIG[status];
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div
      ref={setNodeRef}
      className={
        "flex h-full w-72 shrink-0 flex-col rounded-xl border border-white/10 bg-white/[0.02] " +
        (isOver ? "ring-2 ring-amber-500/50" : "")
      }
      style={{ borderTopColor: cfg.color, borderTopWidth: 3 }}
    >
      <div className="flex items-center justify-between p-3">
        <div className="font-display text-sm font-bold uppercase tracking-widest">
          {cfg.label}
        </div>
        <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs font-semibold">
          {leads.length}
        </span>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto px-3 pb-3">
        {leads.map((l) => (
          <LeadCard key={l.id} lead={l} onOpen={onOpen} />
        ))}
        {leads.length === 0 && (
          <div className="rounded-md border border-dashed border-white/10 p-4 text-center text-xs text-gray-500">
            Vazio
          </div>
        )}
      </div>
    </div>
  );
}

function LeadCard({ lead, onOpen }: { lead: Lead; onOpen: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
  });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;
  const channel = lead.whatsapp ? "whatsapp" : "instagram";
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={
        "cursor-grab rounded-lg border border-white/10 bg-[#0a1628] p-3 transition-shadow hover:border-white/20 " +
        (isDragging ? "opacity-50 shadow-2xl" : "")
      }
    >
      <div className="mb-2 flex items-center justify-between">
        <ScoreBadge score={lead.score} />
        <ChannelIcon channel={channel as "whatsapp" | "instagram"} size={14} />
      </div>
      <div className="text-sm font-semibold">{lead.nome}</div>
      <div className="truncate text-xs text-gray-400">{lead.tipo_negocio}</div>
      <div className="mt-2 flex items-center justify-between border-t border-white/5 pt-2 text-xs">
        <span className="flex items-center gap-1 text-gray-500">
          <Clock size={11} /> {timeAgo(lead.updated_at)}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpen(lead.id);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="text-amber-400 hover:underline"
        >
          Abrir
        </button>
      </div>
    </div>
  );
}
