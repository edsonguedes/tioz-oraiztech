import { useEffect, useState } from "react";
import { X, Calendar, MessageSquare, ListChecks, User as UserIcon } from "lucide-react";
import {
  supabase,
  type Lead,
  type LeadStatus,
  type Message,
  type Appointment,
  type Sequence,
  STATUS_ORDER,
  STATUS_CONFIG,
  SEND_MESSAGE_URL,
} from "@/lib/supabase";
import { Avatar, ScoreBadge, StatusBadge, ChannelIcon, timeAgo } from "@/components/admin/atoms";
import { cn } from "@/lib/utils";

type Tab = "detalhes" | "conversa" | "agendamentos" | "sequencias";

export function LeadDrawer({ leadId, onClose }: { leadId: string | null; onClose: () => void }) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [tab, setTab] = useState<Tab>("detalhes");
  const [messages, setMessages] = useState<Message[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [draft, setDraft] = useState("");
  const [convId, setConvId] = useState<string | null>(null);

  useEffect(() => {
    if (!leadId) return;
    (async () => {
      const { data } = await supabase.from("leads").select("*").eq("id", leadId).maybeSingle();
      setLead(data as Lead | null);
      const { data: convs } = await supabase
        .from("conversations")
        .select("id")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false })
        .limit(1);
      const cid = convs?.[0]?.id ?? null;
      setConvId(cid);
      if (cid) {
        const { data: msgs } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", cid)
          .order("created_at", { ascending: false })
          .limit(20);
        setMessages(((msgs as Message[]) ?? []).reverse());
      } else {
        setMessages([]);
      }
      const { data: apps } = await supabase
        .from("appointments")
        .select("*")
        .eq("lead_id", leadId)
        .order("scheduled_at", { ascending: false });
      setAppointments((apps as Appointment[]) ?? []);
      const { data: seqs } = await supabase
        .from("sequences")
        .select("*")
        .eq("lead_id", leadId)
        .order("scheduled_at", { ascending: true });
      setSequences((seqs as Sequence[]) ?? []);
    })();
  }, [leadId]);

  async function changeStatus(newStatus: LeadStatus) {
    if (!lead) return;
    await supabase
      .from("leads")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", lead.id);
    setLead({ ...lead, status: newStatus });
  }

  async function send() {
    if (!lead || !draft.trim() || !convId) return;
    const body = draft.trim();
    setDraft("");
    const channel: "whatsapp" | "instagram" =
      (lead.instagram ?? lead.instagram_id) && !lead.whatsapp ? "instagram" : "whatsapp";
    const to = channel === "whatsapp" ? lead.whatsapp : (lead.instagram ?? lead.instagram_id);
    try {
      const { data: sess } = await supabase.auth.getSession();
      await fetch(SEND_MESSAGE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sess.session?.access_token ?? ""}`,
        },
        body: JSON.stringify({
          lead_id: lead.id,
          to,
          message: body,
          canal: channel,
        }),
      });
    } catch {
      /* ignore */
    }
    const { data: inserted } = await supabase
      .from("messages")
      .insert({
        conversation_id: convId,
        direcao: "outbound",
        conteudo: body,
        metadata: { agent: "human" },
      })
      .select()
      .single();
    if (inserted) setMessages((m) => [...m, inserted as Message]);
  }


  async function cancelSeq(id: string) {
    await supabase.from("sequences").update({ status: "cancelled" }).eq("id", id);
    setSequences((s) => s.map((x) => (x.id === id ? { ...x, status: "cancelled" } : x)));
  }

  if (!leadId) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/70" onClick={onClose} />
      <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[480px] flex-col border-l border-white/10 bg-[#0a1628]">
        <div className="flex items-start justify-between border-b border-white/10 p-5">
          <div className="flex items-start gap-3">
            <Avatar name={lead?.nome ?? "?"} size={48} />
            <div>
              <div className="text-lg font-bold">{lead?.nome ?? "..."}</div>
              <div className="text-xs text-gray-400">
                {lead?.tipo_negocio} · {lead?.faturamento}
              </div>
              <div className="mt-2 flex items-center gap-2">
                {lead && <ScoreBadge score={lead.score} size="lg" />}
                {lead && (
                  <select
                    value={lead.status}
                    onChange={(e) => changeStatus(e.target.value as LeadStatus)}
                    className="rounded-md border border-white/10 bg-black/30 px-2 py-1 text-xs"
                  >
                    {STATUS_ORDER.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_CONFIG[s].label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="flex border-b border-white/10 text-xs">
          {[
            { id: "detalhes", label: "Detalhes", icon: UserIcon },
            { id: "conversa", label: "Conversa", icon: MessageSquare },
            { id: "agendamentos", label: "Agenda", icon: Calendar },
            { id: "sequencias", label: "Sequências", icon: ListChecks },
          ].map((t) => {
            const I = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id as Tab)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 px-3 py-3 font-medium transition-colors",
                  tab === t.id
                    ? "border-b-2 border-amber-500 text-white"
                    : "text-gray-500 hover:text-white",
                )}
              >
                <I size={13} /> {t.label}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {tab === "detalhes" && lead && (
            <div className="space-y-4 text-sm">
              <Field label="WhatsApp" value={lead.whatsapp} />
              <Field label="Instagram" value={lead.instagram_id ?? "—"} />
              <Field label="Tipo de negócio" value={lead.tipo_negocio} />
              <Field label="Faturamento" value={lead.faturamento} />
              <div>
                <div className="text-[11px] uppercase tracking-widest text-gray-500">
                  Maior desafio
                </div>
                <div className="mt-1 whitespace-pre-wrap rounded-md border border-white/10 bg-black/30 p-3 text-sm">
                  {lead.maior_dor || "—"}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs text-gray-400">
                <div>Cadastro: {new Date(lead.created_at).toLocaleString("pt-BR")}</div>
                <div>Atualizado: {timeAgo(lead.updated_at)}</div>
              </div>
            </div>
          )}

          {tab === "conversa" && (
            <div className="flex h-full flex-col">
              <div className="flex-1 space-y-2">
                {messages.length === 0 && (
                  <div className="text-center text-sm text-gray-500">Sem mensagens ainda.</div>
                )}
                {messages.map((m) => (
                  <MessageBubble key={m.id} m={m} />
                ))}
              </div>
              <div className="mt-3 flex gap-2 border-t border-white/10 pt-3">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder="Digite uma mensagem…"
                  className="flex-1 rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-amber-500/50"
                />
                <button
                  onClick={send}
                  className="rounded-md bg-amber-500 px-4 py-2 text-sm font-bold text-black hover:bg-amber-400"
                >
                  Enviar
                </button>
              </div>
            </div>
          )}

          {tab === "agendamentos" && (
            <div className="space-y-2">
              {appointments.length === 0 && (
                <div className="text-sm text-gray-500">Sem agendamentos.</div>
              )}
              {appointments.map((a) => (
                <div
                  key={a.id}
                  className="rounded-md border border-white/10 bg-black/20 p-3 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium">
                      {new Date(a.scheduled_at).toLocaleString("pt-BR")}
                    </div>
                    <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[11px] text-amber-300">
                      {a.status}
                    </span>
                  </div>
                  <div className="mt-1 truncate text-xs text-gray-500">
                    {a.cal_event_id}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "sequencias" && (
            <div className="space-y-2">
              {sequences.length === 0 && (
                <div className="text-sm text-gray-500">Nenhuma sequência.</div>
              )}
              {sequences.map((s) => (
                <div
                  key={s.id}
                  className="rounded-md border border-white/10 bg-black/20 p-3 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{s.type}</div>
                    <span
                      className={cn(
                        "rounded-md px-2 py-0.5 text-[11px]",
                        s.status === "pending" && "bg-amber-500/15 text-amber-300",
                        s.status === "sent" && "bg-emerald-500/15 text-emerald-300",
                        s.status === "cancelled" && "bg-gray-500/15 text-gray-400",
                      )}
                    >
                      {s.status}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-gray-400">
                    {new Date(s.scheduled_at).toLocaleString("pt-BR")}
                  </div>
                  {s.status === "pending" && (
                    <button
                      onClick={() => cancelSeq(s.id)}
                      className="mt-2 text-xs text-red-400 hover:underline"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-widest text-gray-500">{label}</div>
      <div className="mt-0.5">{value}</div>
    </div>
  );
}

function MessageBubble({ m }: { m: Message }) {
  const isIn = m.direction === "inbound";
  return (
    <div className={cn("flex", isIn ? "justify-start" : "justify-end")}>
      <div
        className={cn(
          "max-w-[80%] rounded-lg border px-3 py-2 text-sm",
          isIn
            ? "border-white/10 bg-gray-800/80 text-white"
            : "border-emerald-500/30 bg-emerald-900/40 text-white",
        )}
      >
        <div className="whitespace-pre-wrap break-words">{m.body}</div>
        <div className="mt-1 flex items-center gap-1 text-[10px] text-gray-400">
          <ChannelIcon channel={m.channel} size={10} />
          {new Date(m.created_at).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}

export { ChannelIcon, StatusBadge };
