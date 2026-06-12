import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Mail } from "lucide-react";

export const Route = createFileRoute("/admin/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin" });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s) navigate({ to: "/admin" });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/admin` },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="text-3xl font-extrabold tracking-tight">
            Tiozão <span className="text-amber-500">RaizTech</span>
          </div>
          <div className="mt-1 text-sm text-gray-400">Painel Administrativo</div>
        </div>

        {sent ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
            <Mail className="mx-auto mb-3 text-emerald-400" size={28} />
            <p className="text-sm text-emerald-200">
              Verifique seu email — o link de acesso foi enviado para{" "}
              <strong>{email}</strong>.
            </p>
          </div>
        ) : (
          <form
            onSubmit={submit}
            className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur"
          >
            <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
              className="w-full rounded-md border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-amber-500/50"
            />
            {error && <div className="text-xs text-red-400">{error}</div>}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-amber-500 px-4 py-2.5 text-sm font-bold text-black transition-colors hover:bg-amber-400 disabled:opacity-60"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : null}
              Entrar com Magic Link
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
