import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";
import {
  LayoutDashboard,
  Kanban,
  Inbox as InboxIcon,
  Flame,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/admin/atoms";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [unread, setUnread] = useState(0);
  const [hotLeads, setHotLeads] = useState<{ id: string; nome: string; score: number }[]>([]);
  const [open, setOpen] = useState(false);

  // auth bootstrap
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // redirect when unauthenticated
  useEffect(() => {
    if (!ready) return;
    if (!session && pathname !== "/admin/login") {
      navigate({ to: "/admin/login" });
    }
    if (session && pathname === "/admin/login") {
      navigate({ to: "/admin" });
    }
  }, [ready, session, pathname, navigate]);

  // unread badge + hot leads
  useEffect(() => {
    if (!session) return;
    const fetchUnread = async () => {
      const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("direction", "inbound")
        .gte("created_at", since);
      setUnread(count ?? 0);
    };
    const fetchHot = async () => {
      const { data } = await supabase
        .from("leads")
        .select("id,nome,score")
        .gte("score", 7)
        .order("score", { ascending: false })
        .limit(5);
      setHotLeads(data ?? []);
    };
    fetchUnread();
    fetchHot();
    const ch = supabase
      .channel("admin-shell")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => fetchUnread(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leads" },
        () => fetchHot(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [session]);

  useEffect(() => {
    document.title =
      unread > 0
        ? `(${unread}) Inbox — Tiozão RaizTech`
        : "Painel — Tiozão RaizTech";
  }, [unread]);

  // login page: render without shell
  if (pathname === "/admin/login") {
    return <div className="min-h-screen bg-[#050c18] text-white">{children}</div>;
  }

  if (!ready || !session) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#050c18] text-gray-400">
        Carregando…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#050c18] text-white">
      {/* mobile top bar */}
      <div className="fixed left-0 right-0 top-0 z-40 flex items-center justify-between border-b border-white/10 bg-[#0a1628] px-4 py-3 md:hidden">
        <div className="font-extrabold">
          Tiozão <span className="text-amber-500">RaizTech</span>
        </div>
        <button onClick={() => setOpen(!open)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-[260px] flex-col border-r border-white/10 bg-[#0a1628] p-4 transition-transform md:relative md:flex md:translate-x-0",
          open ? "flex translate-x-0" : "hidden -translate-x-full md:flex",
        )}
      >
        <div className="mb-6 pt-12 md:pt-2">
          <div className="text-xl font-extrabold tracking-tight">
            Tiozão <span className="text-amber-500">RaizTech</span>
          </div>
          <div className="text-[11px] uppercase tracking-widest text-gray-500">
            Painel
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          <NavItem
            to="/admin"
            icon={<LayoutDashboard size={18} />}
            label="Dashboard"
            active={pathname === "/admin"}
            onClick={() => setOpen(false)}
          />
          <NavItem
            to="/admin/crm"
            icon={<Kanban size={18} />}
            label="CRM Kanban"
            active={pathname.startsWith("/admin/crm")}
            onClick={() => setOpen(false)}
          />
          <NavItem
            to="/admin/inbox"
            icon={<InboxIcon size={18} />}
            label="Inbox"
            badge={unread}
            active={pathname.startsWith("/admin/inbox")}
            onClick={() => setOpen(false)}
          />
        </nav>

        <div className="mt-6 border-t border-white/10 pt-4">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-gray-500">
            <Flame size={12} className="text-amber-500" /> Leads quentes
          </div>
          <div className="flex flex-col gap-1">
            {hotLeads.length === 0 && (
              <div className="text-xs text-gray-600">Nenhum lead com score ≥ 7</div>
            )}
            {hotLeads.map((l) => (
              <Link
                key={l.id}
                to="/admin/crm"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm text-gray-300 hover:bg-white/5"
              >
                <span className="truncate">{l.nome}</span>
                <span className="text-xs font-semibold text-amber-400">{l.score}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-auto flex items-center gap-3 border-t border-white/10 pt-4">
          <Avatar name={session.user.email ?? "U"} size={36} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{session.user.email}</div>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                navigate({ to: "/admin/login" });
              }}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-white"
            >
              <LogOut size={12} /> Sair
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden pt-14 md:pt-0">{children}</main>
    </div>
  );
}

function NavItem({
  to,
  icon,
  label,
  badge,
  active,
  onClick,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-white/10 text-white"
          : "text-gray-400 hover:bg-white/5 hover:text-white",
      )}
    >
      {icon}
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-black">
          {badge}
        </span>
      )}
    </Link>
  );
}

export function AdminLayoutRoute() {
  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  );
}
