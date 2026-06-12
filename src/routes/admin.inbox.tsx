import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  supabase,
  type Conversation,
  type Lead,
  type Message,
  type Channel,
  type AgentType,
  AGENT_CONFIG,
  SEND_MESSAGE_URL,
} from "@/lib/supabase";
import { Avatar, ChannelIcon, ScoreBadge, timeAgo } from "@/components/admin/atoms";
import { LeadDrawer } from "@/components/admin/LeadDrawer";
import { toast } from "sonner";
import { ArrowLeft, ChevronDown, Send, Bot, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/inbox")({
  component: InboxPage,
});

export { InboxPage };

type ConvWithLead = Conversation & { lead: Lead; last_message?: Message };
type FilterKey = "todas" | "abertas" | "nao-lidas" | "whatsapp" | "instagram";

function InboxPage() {
  const params = useParams({ strict: false }) as { leadId?: string };
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterKey>("todas");
  const [conversations, setConversations] = useState<ConvWithLead[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [agentMenuOpen, setAgentMenuOpen] = useState(false);
  const [drawerLeadId, setDrawerLeadId] = useState<string | null>(null);
  const [showListMobile, setShowListMobile] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // initial fetch (once)
  useEffect(() => {
    fetchConvs();
  }, []);

  // realtime — re-subscribes when activeId changes so the closure sees the latest value
  useEffect(() => {
    const ch = supabase
      .channel(`inbox-rt-${activeId ?? "none"}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const m = payload.new as Message;
          setConversations((prev) => {
            const next = prev.map((c) =>
              c.id === m.conversation_id
                ? {
                    ...c,
                    last_message: m,
                    unread_count:
                      m.direcao === "inbound" && c.id !== activeId
                        ? (c.unread_count ?? 0) + 1
                        : c.unread_count,
                  }
                : c,
            );
            next.sort(
              (a, b) =>
                new Date(b.last_message?.created_at ?? b.created_at).getTime() -
                new Date(a.last_message?.created_at ?? a.created_at).getTime(),
            );
            return next;
          });
          if (m.conversation_id === activeId) {
            setMessages((prev) =>
              prev.some((x) => x.id === m.id) ? prev : [...prev, m],
            );
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 40);
          }
          if (m.direcao === "inbound") {
            audioRef.current?.play().catch(() => {});
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "conversations" },
        (payload) => {
          const c = payload.new as Conversation;
          setConversations((prev) =>
            prev.map((x) =>
              x.id === c.id
                ? { ...x, agent_type: c.agent_type, unread_count: c.unread_count, status: c.status }
                : x,
            ),
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "leads" },
        (payload) => {
          const l = payload.new as Lead;
          setConversations((prev) =>
            prev.map((x) => (x.lead_id === l.id ? { ...x, lead: { ...x.lead, ...l } } : x)),
          );
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [activeId]);


  // open from URL :leadId
  useEffect(() => {
    if (params.leadId && conversations.length) {
      const c = conversations.find((c) => c.lead_id === params.leadId);
      if (c && c.id !== activeId) openConv(c.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.leadId, conversations.length]);

  async function fetchConvs() {
    const { data, error } = await supabase
      .from("conversations")
      .select("*, lead:leads(*)")
      .order("updated_at", { ascending: false, nullsFirst: false });
    if (error) {
      toast.error("Erro ao carregar conversas");
      return;
    }
    const convs = (data as ConvWithLead[]) ?? [];
    const ids = convs.map((c) => c.id);
    if (ids.length) {
      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .in("conversation_id", ids)
        .order("created_at", { ascending: false });
      const lastBy: Record<string, Message> = {};
      (msgs as Message[] | null)?.forEach((m) => {
        if (!lastBy[m.conversation_id]) lastBy[m.conversation_id] = m;
      });
      convs.forEach((c) => (c.last_message = lastBy[c.id]));
      convs.sort(
        (a, b) =>
          new Date(b.last_message?.created_at ?? b.created_at).getTime() -
          new Date(a.last_message?.created_at ?? a.created_at).getTime(),
      );
    }
    setConversations(convs);
  }

  async function openConv(id: string) {
    setActiveId(id);
    setShowListMobile(false);
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });
    setMessages((data as Message[]) ?? []);
    setTimeout(() => bottomRef.current?.scrollIntoView(), 50);
    // mark as read
    await supabase.from("conversations").update({ unread_count: 0 }).eq("id", id);
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unread_count: 0 } : c)),
    );
    setTimeout(() => textareaRef.current?.focus(), 100);
  }

  const active = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [activeId, conversations],
  );

  const totalUnread = conversations.reduce((s, c) => s + (c.unread_count ?? 0), 0);

  const filtered = conversations.filter((c) => {
    if (filter === "whatsapp") return c.canal === "whatsapp";
    if (filter === "instagram") return c.canal === "instagram";
    if (filter === "nao-lidas") return (c.unread_count ?? 0) > 0;
    if (filter === "abertas") return c.status !== "fechada" && c.status !== "closed";
    return true;
  });

  async function send() {
    if (!draft.trim() || !active) return;
    if (active.agent_type !== "human") {
      toast.error("Assuma a conversa antes de enviar manualmente.");
      return;
    }
    const body = draft.trim();
    setDraft("");
    const canal = active.canal;
    const to =
      canal === "whatsapp"
        ? active.lead.whatsapp
        : active.lead.instagram ?? active.lead.instagram_id;
    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      conversation_id: active.id,
      direcao: "outbound",
      conteudo: body,
      metadata: { agent: "human" },
      created_at: new Date().toISOString(),
    };
    setMessages((m) => [...m, optimistic]);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 40);

    if (SEND_MESSAGE_URL) {
      try {
        const { data: sess } = await supabase.auth.getSession();
        await fetch(SEND_MESSAGE_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sess.session?.access_token ?? ""}`,
          },
          body: JSON.stringify({ lead_id: active.lead_id, to, message: body, canal }),
        });
      } catch {
        /* fallback handled below */
      }
    }
    const { data: inserted, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: active.id,
        direcao: "outbound",
        conteudo: body,
        metadata: { agent: "human" },
      })
      .select()
      .single();
    if (error) {
      toast.error("Falha ao salvar mensagem.");
      setMessages((m) => m.filter((x) => x.id !== tempId));
      return;
    }
    if (inserted) {
      setMessages((m) => m.map((x) => (x.id === tempId ? (inserted as Message) : x)));
    }
  }

  async function changeAgent(newType: AgentType) {
    if (!active) return;
    setAgentMenuOpen(false);
    const patch: { agent_type: AgentType; agent_state?: Record<string, unknown> } = {
      agent_type: newType,
    };
    if (newType === "sdr") patch.agent_state = {};
    const { error } = await supabase
      .from("conversations")
      .update(patch)
      .eq("id", active.id);
    if (error) {
      toast.error("Falha ao trocar agente.");
      return;
    }
    setConversations((prev) =>
      prev.map((c) => (c.id === active.id ? { ...c, agent_type: newType } : c)),
    );
    toast.success(`Agente alterado para ${AGENT_CONFIG[newType].label}`);
    if (newType === "human") setTimeout(() => textareaRef.current?.focus(), 50);
  }

  function backToList() {
    setShowListMobile(true);
    setActiveId(null);
    if (params.leadId) navigate({ to: "/admin/inbox" });
  }

  return (
    <div className="flex h-screen bg-[#050c18]">
      <audio
        ref={audioRef}
        src="data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="
        preload="auto"
      />

      {/* LEFT PANEL */}
      <aside
        className={cn(
          "flex w-full shrink-0 flex-col border-r border-white/10 bg-[#0a1628] md:w-[340px]",
          showListMobile ? "flex" : "hidden md:flex",
        )}
      >
        <div className="border-b border-white/10 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h1 className="font-display text-xl font-extrabold">Inbox</h1>
            {totalUnread > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold">
                {totalUnread}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1 text-[11px]">
            {(
              [
                ["todas", "Todas"],
                ["abertas", "Abertas"],
                ["nao-lidas", "Não lidas"],
                ["whatsapp", "WhatsApp"],
                ["instagram", "Instagram"],
              ] as [FilterKey, string][]
            ).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={cn(
                  "rounded-full border px-2.5 py-1 font-medium transition-colors",
                  filter === k
                    ? "border-amber-500/50 bg-amber-500/10 text-amber-300"
                    : "border-white/10 text-gray-400 hover:bg-white/5 hover:text-white",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="p-8 text-center text-sm text-gray-500">Sem conversas.</div>
          )}
          {filtered.map((c) => {
            const last = c.last_message;
            const unread = (c.unread_count ?? 0) > 0;
            const agent = AGENT_CONFIG[c.agent_type ?? "sdr"];
            return (
              <button
                key={c.id}
                onClick={() => openConv(c.id)}
                className={cn(
                  "group flex w-full items-start gap-3 border-b border-white/5 p-3 text-left transition-colors",
                  activeId === c.id
                    ? "border-l-2 border-l-blue-500 bg-blue-500/[0.07]"
                    : "hover:bg-white/[0.03]",
                )}
              >
                <div className="relative shrink-0">
                  <Avatar name={c.lead?.nome ?? "?"} size={40} />
                  <span
                    className={cn(
                      "absolute -bottom-1 -right-1 rounded-full border border-[#0a1628] px-1 py-[1px] text-[9px] font-bold leading-none",
                      agent.classes,
                    )}
                    title={agent.label}
                  >
                    {agent.emoji}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <ChannelIcon channel={c.canal} size={12} />
                      <span
                        className={cn(
                          "truncate text-sm",
                          unread ? "font-bold text-white" : "font-semibold text-gray-200",
                        )}
                      >
                        {c.lead?.nome ?? "Lead"}
                      </span>
                    </div>
                    <span className="shrink-0 text-[10px] text-gray-500">
                      {timeAgo(last?.created_at ?? c.created_at)}
                    </span>
                  </div>
                  <div
                    className={cn(
                      "mt-0.5 truncate text-xs",
                      unread ? "text-gray-200" : "text-gray-500",
                    )}
                  >
                    {last?.direcao === "outbound" && "Você: "}
                    {last?.conteudo ?? "Sem mensagens"}
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <ScoreBadge score={c.lead?.score ?? 0} />
                      <span
                        className={cn(
                          "rounded border px-1.5 py-px text-[9px] font-medium",
                          agent.classes,
                        )}
                      >
                        {agent.emoji} {agent.short}
                      </span>
                    </div>
                    {unread && (
                      <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-500 px-1 text-[10px] font-bold text-white">
                        {c.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* RIGHT PANEL */}
      <section
        className={cn(
          "flex flex-1 flex-col bg-[#050c18]",
          showListMobile ? "hidden md:flex" : "flex",
        )}
      >
        {!active && (
          <div className="grid flex-1 place-items-center text-sm text-gray-500">
            Selecione uma conversa
          </div>
        )}
        {active && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-[#0a1628] p-3">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  onClick={backToList}
                  className="rounded-md p-1.5 text-gray-400 hover:bg-white/5 hover:text-white md:hidden"
                >
                  <ArrowLeft size={18} />
                </button>
                <Avatar name={active.lead.nome} size={40} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-semibold">{active.lead.nome}</span>
                    <ChannelIcon channel={active.canal} size={14} />
                    <ScoreBadge score={active.lead.score} />
                  </div>
                  <div className="truncate text-xs text-gray-500">
                    {active.lead.tipo_negocio ?? "—"}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <AgentSelector
                  current={active.agent_type ?? "sdr"}
                  open={agentMenuOpen}
                  onToggle={() => setAgentMenuOpen((o) => !o)}
                  onSelect={changeAgent}
                />
                <button
                  onClick={() => setDrawerLeadId(active.lead_id)}
                  className="hidden rounded-md border border-white/10 px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-white/5 sm:block"
                >
                  Ver Lead
                </button>
              </div>
            </div>

            {/* Thread */}
            <div className="flex-1 space-y-2 overflow-y-auto p-6">
              {messages.length === 0 && (
                <div className="grid h-full place-items-center text-sm text-gray-500">
                  Sem mensagens ainda.
                </div>
              )}
              {renderMessagesWithSeparators(messages)}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t border-white/10 bg-[#0a1628] p-3">
              {active.agent_type !== "human" ? (
                <div className="flex items-center justify-between gap-3 rounded-md border border-blue-500/30 bg-blue-500/10 px-3 py-2.5 text-sm">
                  <div className="flex items-center gap-2 text-blue-200">
                    <Bot size={16} />
                    <span>
                      {AGENT_CONFIG[active.agent_type].emoji}{" "}
                      <strong>{AGENT_CONFIG[active.agent_type].label}</strong> está respondendo
                    </span>
                  </div>
                  <button
                    onClick={() => changeAgent("human")}
                    className="shrink-0 rounded-md bg-amber-500 px-3 py-1.5 text-xs font-bold text-black hover:bg-amber-400"
                  >
                    Assumir conversa
                  </button>
                </div>
              ) : (
                <div className="flex items-end gap-2">
                  <textarea
                    ref={textareaRef}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    rows={1}
                    placeholder="Digite a mensagem… (Enter para enviar, Shift+Enter quebra linha)"
                    className="max-h-32 min-h-[40px] flex-1 resize-none rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-amber-500/50"
                  />
                  <button
                    onClick={send}
                    disabled={!draft.trim()}
                    className="flex items-center gap-2 rounded-md bg-amber-500 px-4 py-2 text-sm font-bold text-black hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Send size={14} /> Enviar
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </section>

      <LeadDrawer leadId={drawerLeadId} onClose={() => setDrawerLeadId(null)} />
    </div>
  );
}

function AgentSelector({
  current,
  open,
  onToggle,
  onSelect,
}: {
  current: AgentType;
  open: boolean;
  onToggle: () => void;
  onSelect: (t: AgentType) => void;
}) {
  const cfg = AGENT_CONFIG[current];
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className={cn(
          "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-semibold",
          cfg.classes,
        )}
      >
        {cfg.emoji} {cfg.label}
        <ChevronDown size={12} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={onToggle} />
          <div className="absolute right-0 top-full z-40 mt-1 w-56 overflow-hidden rounded-md border border-white/10 bg-[#0a1628] shadow-xl">
            {(["sdr", "atendimento", "human"] as AgentType[]).map((t) => {
              const c = AGENT_CONFIG[t];
              return (
                <button
                  key={t}
                  onClick={() => onSelect(t)}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-white/5",
                    current === t && "bg-white/5",
                  )}
                >
                  <span className="text-base">{c.emoji}</span>
                  <div>
                    <div className="font-semibold text-white">{c.label}</div>
                    <div className="text-[10px] text-gray-500">
                      {t === "sdr" && "Qualifica e aquece leads"}
                      {t === "atendimento" && "Suporte automático com IA"}
                      {t === "human" && "Você responde manualmente"}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function renderMessagesWithSeparators(messages: Message[]) {
  const out: React.ReactNode[] = [];
  let lastDay = "";
  messages.forEach((m) => {
    const d = new Date(m.created_at);
    const day = d.toDateString();
    if (day !== lastDay) {
      lastDay = day;
      out.push(
        <div key={`sep-${m.id}`} className="my-3 text-center text-[11px] text-gray-500">
          — {dayLabel(d)} —
        </div>,
      );
    }
    const meta = (m.metadata ?? {}) as { agent?: AgentType; system?: boolean; type?: string };
    if (meta.system || meta.type === "system") {
      out.push(
        <div
          key={m.id}
          className="my-2 text-center text-[11px] italic text-gray-500"
        >
          {m.conteudo}
        </div>,
      );
      return;
    }
    const isIn = m.direcao === "inbound";
    const agent = meta.agent ?? (isIn ? undefined : "human");
    const agentCfg = agent ? AGENT_CONFIG[agent] : null;
    out.push(
      <div key={m.id} className={cn("flex flex-col gap-1", isIn ? "items-start" : "items-end")}>
        <div
          className={cn(
            "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm shadow-sm",
            isIn
              ? "rounded-bl-sm bg-gray-800 text-white"
              : "rounded-br-sm bg-blue-600 text-white",
          )}
        >
          <div className="whitespace-pre-wrap break-words">{m.conteudo}</div>
        </div>
        <div
          className={cn(
            "flex items-center gap-1.5 px-1 text-[10px] text-gray-500",
            isIn ? "justify-start" : "justify-end",
          )}
        >
          {!isIn && agentCfg && (
            <span className="inline-flex items-center gap-0.5 font-medium">
              {agent === "human" ? <UserIcon size={9} /> : <Bot size={9} />}
              {agentCfg.emoji} {agent === "human" ? "Você" : agentCfg.short}
            </span>
          )}
          <span>
            {d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>,
    );
  });
  return out;
}

function dayLabel(d: Date) {
  const today = new Date();
  const y = new Date(Date.now() - 86400000);
  if (d.toDateString() === today.toDateString()) return "Hoje";
  if (d.toDateString() === y.toDateString()) return "Ontem";
  return d.toLocaleDateString("pt-BR");
}
