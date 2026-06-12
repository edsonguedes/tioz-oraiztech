import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase, type Lead, STATUS_ORDER, STATUS_CONFIG } from "@/lib/supabase";
import { ScoreBadge, StatusBadge, timeAgo } from "@/components/admin/atoms";
import { LeadDrawer } from "@/components/admin/LeadDrawer";
import { TrendingUp, Users, Calendar, Trophy, Flame, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const [totals, setTotals] = useState({ total: 0, week: 0, sessions: 0, clients: 0 });
  const [byStatus, setByStatus] = useState<Record<string, number>>({});
  const [hot, setHot] = useState<Lead[]>([]);
  const [recent, setRecent] = useState<Lead[]>([]);
  const [openLead, setOpenLead] = useState<string | null>(null);

  useEffect(() => {
    refresh();
    const ch = supabase
      .channel("dash-leads")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, refresh)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  async function refresh() {
    const weekAgo = new Date(Date.now() - 7 * 86400 * 1000).toISOString();
    const [{ count: total }, { count: week }, { count: sessions }, { count: clients }] =
      await Promise.all([
        supabase.from("leads").select("*", { count: "exact", head: true }),
        supabase.from("leads").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
        supabase
          .from("leads")
          .select("*", { count: "exact", head: true })
          .in("status", ["agendado", "reuniao-feita"]),
        supabase.from("leads").select("*", { count: "exact", head: true }).eq("status", "ganho"),
      ]);
    setTotals({ total: total ?? 0, week: week ?? 0, sessions: sessions ?? 0, clients: clients ?? 0 });

    const { data: all } = await supabase.from("leads").select("status");
    const counts: Record<string, number> = {};
    STATUS_ORDER.forEach((s) => (counts[s] = 0));
    (all ?? []).forEach((r: { status: string }) => {
      counts[r.status] = (counts[r.status] ?? 0) + 1;
    });
    setByStatus(counts);

    const { data: hotLeads } = await supabase
      .from("leads")
      .select("*")
      .gte("score", 7)
      .order("score", { ascending: false })
      .limit(6);
    setHot((hotLeads as Lead[]) ?? []);

    const { data: recentLeads } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);
    setRecent((recentLeads as Lead[]) ?? []);
  }

  return (
    <div className="p-6 md:p-8">
      <h1 className="mb-6 font-display text-3xl font-extrabold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Metric icon={<Users />} label="Total de Leads" value={totals.total} />
        <Metric
          icon={<TrendingUp />}
          label="Leads esta semana"
          value={totals.week}
          delta={totals.week}
          accent="emerald"
        />
        <Metric icon={<Calendar />} label="Sessões agendadas" value={totals.sessions} />
        <Metric icon={<Trophy />} label="Clientes fechados" value={totals.clients} gold />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[3fr_2fr]">
        <Card title="Pipeline" action={<Link to="/admin/crm" className="text-xs text-amber-400 hover:underline">Ver Kanban →</Link>}>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {STATUS_ORDER.map((s) => {
              const cfg = STATUS_CONFIG[s];
              return (
                <Link
                  key={s}
                  to="/admin/crm"
                  className="rounded-lg border border-white/10 bg-black/20 p-3 transition-colors hover:bg-white/5"
                  style={{ borderTopColor: cfg.color, borderTopWidth: 2 }}
                >
                  <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                    {cfg.label}
                  </div>
                  <div className="mt-1 text-2xl font-extrabold">{byStatus[s] ?? 0}</div>
                </Link>
              );
            })}
          </div>
        </Card>

        <Card
          title={
            <span className="flex items-center gap-2">
              <Flame size={16} className="text-amber-500" /> Leads quentes
            </span>
          }
        >
          {hot.length === 0 && (
            <div className="py-8 text-center text-sm text-gray-500">
              Nenhum lead com score ≥ 7
            </div>
          )}
          <div className="space-y-2">
            {hot.map((l) => (
              <button
                key={l.id}
                onClick={() => setOpenLead(l.id)}
                className="flex w-full items-center justify-between rounded-md border border-white/5 bg-black/20 p-2.5 text-left hover:bg-white/5"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{l.nome}</div>
                  <div className="truncate text-xs text-gray-500">{l.tipo_negocio}</div>
                </div>
                <div className="flex items-center gap-2">
                  <ScoreBadge score={l.score} />
                  <ArrowRight size={14} className="text-gray-500" />
                </div>
              </button>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Atividade recente" className="mt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-widest text-gray-500">
                <th className="pb-2">Lead</th>
                <th className="pb-2">Negócio</th>
                <th className="pb-2">Score</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Quando</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {recent.map((l) => (
                <tr key={l.id} className="border-t border-white/5">
                  <td className="py-2.5 font-medium">{l.nome}</td>
                  <td className="py-2.5 text-gray-400">{l.tipo_negocio}</td>
                  <td className="py-2.5"><ScoreBadge score={l.score} /></td>
                  <td className="py-2.5"><StatusBadge status={l.status} /></td>
                  <td className="py-2.5 text-xs text-gray-400">{timeAgo(l.created_at)}</td>
                  <td className="py-2.5 text-right">
                    <button
                      onClick={() => setOpenLead(l.id)}
                      className="text-xs text-amber-400 hover:underline"
                    >
                      Abrir
                    </button>
                  </td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-gray-500">
                    Nenhum lead ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {openLead && <LeadDrawer leadId={openLead} onClose={() => setOpenLead(null)} />}
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  delta,
  accent,
  gold,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  delta?: number;
  accent?: "emerald";
  gold?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur">
      <div className="flex items-center justify-between">
        <div className="text-gray-400">{icon}</div>
        {delta !== undefined && delta > 0 && (
          <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300">
            +{delta}
          </span>
        )}
      </div>
      <div
        className={
          "mt-3 text-3xl font-extrabold " + (gold ? "text-amber-400" : "text-white")
        }
      >
        {value}
      </div>
      <div className="mt-1 text-xs text-gray-400">{label}</div>
    </div>
  );
}

function Card({
  title,
  children,
  action,
  className,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={
        "rounded-xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur " + (className ?? "")
      }
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-sm font-bold uppercase tracking-widest text-gray-300">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}
