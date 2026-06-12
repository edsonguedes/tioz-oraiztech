import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  supabase,
  type Conversation,
  type Lead,
  type Message,
  type Channel,
  SEND_MESSAGE_URL,
} from "@/lib/supabase";
import { Avatar, ChannelIcon, ScoreBadge, StatusBadge, timeAgo } from "@/components/admin/atoms";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/inbox")({
  component: InboxPage,
});

export { InboxPage };

type ConvWithLead = Conversation & { lead: Lead; last_message?: Message };

function InboxPage() {
  const params = useParams({ strict: false }) as { leadId?: string };
  const [filter, setFilter] = useState<"all" | Channel>("all");
  const [conversations, setConversations] = useState<ConvWithLead[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [channel, setChannel] = useState<Channel>("whatsapp");
  const bottomRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // initial fetch + realtime
  useEffect(() => {
    fetchConvs();
    const ch = supabase
      .channel("inbox-msgs")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const m = payload.new as Message;
          setConversations((prev) =>
            prev
              .map((c) =>
                c.id === m.conversation_id
                  ? { ...c, last_message: m, created_at: m.created_at }
                  : c,
              )
              .sort(
                (a, b) =>
                  new Date(b.last_message?.created_at ?? b.created_at).getTime() -
                  new Date(a.last_message?.created_at ?? a.created_at).getTime(),
              ),
          );
          if (m.conversation_id === activeId) {
            setMessages((prev) => [...prev, m]);
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
          }
          if (m.direction === "inbound") {
            audioRef.current?.play().catch(() => {});
            const conv = conversations.find((c) => c.id === m.conversation_id);
            toast(`Nova mensagem de ${conv?.lead.nome ?? "Lead"}`, {
              description: m.body.slice(0, 80),
            });
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  // open from URL :leadId
  useEffect(() => {
    if (params.leadId && conversations.length) {
      const c = conversations.find((c) => c.lead_id === params.leadId);
      if (c) openConv(c.id);
    }
  }, [params.leadId, conversations.length]); // eslint-disable-line

  async function fetchConvs() {
    const { data } = await supabase
      .from("conversations")
      .select("*, lead:leads(*)")
      .order("created_at", { ascending: false });
    const convs = (data as ConvWithLead[]) ?? [];
    // attach last message
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
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });
    setMessages((data as Message[]) ?? []);
    const conv = conversations.find((c) => c.id === id);
    if (conv) setChannel(conv.channel);
    setTimeout(() => bottomRef.current?.scrollIntoView(), 50);
  }

  const active = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [activeId, conversations],
  );

  const filtered = conversations.filter((c) => filter === "all" || c.channel === filter);

  async function send() {
    if (!draft.trim() || !active) return;
    const body = draft.trim();
    setDraft("");
    const to = channel === "whatsapp" ? active.lead.whatsapp : active.lead.instagram_id;
    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      conversation_id: active.id,
      direction: "outbound",
      body,
      channel,
      created_at: new Date().toISOString(),
    };
    setMessages((m) => [...m, optimistic]);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

    try {
      const { data: sess } = await supabase.auth.getSession();
      await fetch(SEND_MESSAGE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sess.session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ lead_id: active.lead_id, to, message: body, channel }),
      });
    } catch (e) {
      toast.error("Falha ao enviar via gateway, mas mensagem registrada.");
    }
    const { data: inserted } = await supabase
      .from("messages")
      .insert({ conversation_id: active.id, direction: "outbound", body, channel })
      .select()
      .single();
    if (inserted) {
      setMessages((m) => m.map((x) => (x.id === tempId ? (inserted as Message) : x)));
    }
  }

  return (
    <div className="flex h-screen">
      <audio
        ref={audioRef}
        src="data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="
        preload="auto"
      />

      {/* left list */}
      <div className="flex w-[320px] shrink-0 flex-col border-r border-white/10 bg-[#0a1628]">
        <div className="border-b border-white/10 p-4">
          <h1 className="mb-3 font-display text-xl font-extrabold">Inbox</h1>
          <div className="flex gap-1 rounded-md bg-black/30 p-1 text-xs">
            {(["all", "whatsapp", "instagram"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={cn(
                  "flex-1 rounded px-2 py-1.5 font-medium capitalize transition-colors",
                  filter === t ? "bg-white/10 text-white" : "text-gray-500 hover:text-white",
                )}
              >
                {t === "all" ? "Todos" : t}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="p-6 text-center text-sm text-gray-500">Sem conversas.</div>
          )}
          {filtered.map((c) => {
            const last = c.last_message;
            const unread = last?.direction === "inbound";
            return (
              <button
                key={c.id}
                onClick={() => openConv(c.id)}
                className={cn(
                  "flex w-full items-start gap-3 border-b border-white/5 p-3 text-left transition-colors",
                  activeId === c.id
                    ? "border-l-2 border-l-amber-500 bg-white/[0.04]"
                    : "hover:bg-white/[0.02]",
                  unread && activeId !== c.id && "bg-white/[0.03]",
                )}
              >
                <Avatar name={c.lead.nome} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold">{c.lead.nome}</span>
                    <ChannelIcon channel={c.channel} size={12} />
                  </div>
                  <div className="truncate text-xs text-gray-400">
                    {last?.body ?? "Sem mensagens"}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <ScoreBadge score={c.lead.score} />
                    <span className="truncate text-[10px] text-gray-500">
                      {c.lead.tipo_negocio}
                    </span>
                    <span className="ml-auto text-[10px] text-gray-500">
                      {timeAgo(last?.created_at ?? c.created_at)}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* right pane */}
      <div className="flex flex-1 flex-col bg-[#050c18]">
        {!active && (
          <div className="grid flex-1 place-items-center text-sm text-gray-500">
            Selecione uma conversa
          </div>
        )}
        {active && (
          <>
            <div className="flex items-center justify-between border-b border-white/10 bg-[#0a1628] p-4">
              <div className="flex items-center gap-3">
                <Avatar name={active.lead.nome} size={40} />
                <div>
                  <div className="font-semibold">{active.lead.nome}</div>
                  <div className="text-xs text-gray-400">{active.lead.tipo_negocio}</div>
                </div>
                <ScoreBadge score={active.lead.score} />
                <StatusBadge status={active.lead.status} />
              </div>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto p-6">
              {renderMessagesWithSeparators(messages)}
              <div ref={bottomRef} />
            </div>

            <div className="border-t border-white/10 bg-[#0a1628] p-3">
              <div className="flex gap-2">
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as Channel)}
                  className="rounded-md border border-white/10 bg-black/30 px-2 text-xs"
                >
                  {active.lead.whatsapp && <option value="whatsapp">WhatsApp</option>}
                  {active.lead.instagram_id && <option value="instagram">Instagram</option>}
                </select>
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                  placeholder="Digite a mensagem…"
                  className="flex-1 rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-amber-500/50"
                />
                <button
                  onClick={send}
                  className="flex items-center gap-2 rounded-md bg-amber-500 px-4 py-2 text-sm font-bold text-black hover:bg-amber-400"
                >
                  <Send size={14} /> Enviar
                </button>
              </div>
            </div>
          </>
        )}
      </div>
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
    const isIn = m.direction === "inbound";
    out.push(
      <div key={m.id} className={cn("flex", isIn ? "justify-start" : "justify-end")}>
        <div
          className={cn(
            "max-w-[70%] rounded-lg border px-3 py-2 text-sm",
            isIn
              ? "border-white/10 bg-gray-800/80 text-white"
              : "border-emerald-500/30 bg-emerald-900/40 text-white",
          )}
        >
          <div className="whitespace-pre-wrap break-words">{m.body}</div>
          <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-gray-400">
            <ChannelIcon channel={m.channel} size={10} />
            {d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </div>
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
