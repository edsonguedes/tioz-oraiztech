import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tiozão RaizTech — Mentoria para negócios locais que querem fila de cliente" },
      {
        name: "description",
        content:
          "Em 90 dias, sistema simples funcionando: cliente novo chegando pelo digital, sem virar influencer e sem depender de agência. Mentoria 1:1 com o Edson.",
      },
      { property: "og:title", content: "Tiozão RaizTech — Mentoria para negócios locais" },
      {
        property: "og:description",
        content:
          "Tecnologia sem frescura para quem vende de verdade. Sessão gratuita de diagnóstico.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: LandingPage,
});

const ENDPOINT = "https://ftcldzqglgujynscfqns.supabase.co/functions/v1/handle-lead";

const fontStack = {
  display: "'Montserrat', system-ui, sans-serif",
  body: "'Inter', system-ui, sans-serif",
};

function formatWhatsapp(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("55")) return `+${digits}`;
  return `+55${digits}`;
}

function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const formRef = useRef<HTMLDivElement | null>(null);
  const [formVisible, setFormVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!formRef.current) return;
    const io = new IntersectionObserver(
      ([e]) => setFormVisible(e.isIntersecting),
      { threshold: 0.15 },
    );
    io.observe(formRef.current);
    return () => io.disconnect();
  }, []);

  const scrollToForm = () => {
    document.getElementById("formulario")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div style={{ fontFamily: fontStack.body, color: "#111827" }} className="min-h-screen bg-white">
      {/* HEADER */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all ${
          scrolled ? "bg-[#111827]/95 backdrop-blur shadow-lg" : "bg-transparent"
        }`}
        style={{ pointerEvents: scrolled ? "auto" : "none" }}
      >
        <div
          className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between"
          style={{ pointerEvents: "auto" }}
        >
          {scrolled && (
            <>
              <span
                className="text-white font-extrabold text-lg tracking-tight"
                style={{ fontFamily: fontStack.display }}
              >
                Tiozão<span style={{ color: "#F59E0B" }}>RaizTech</span>
              </span>
              <button
                onClick={scrollToForm}
                className="bg-amber-400 text-gray-900 font-bold rounded px-4 py-2 text-sm hover:brightness-110 transition"
                style={{ fontFamily: fontStack.display }}
              >
                Sessão gratuita
              </button>
            </>
          )}
        </div>
      </header>

      {/* HERO */}
      <section className="bg-[#111827] text-white pt-20 pb-20 px-5">
        <div className="max-w-4xl mx-auto text-center">
          <span
            className="inline-block bg-amber-400 text-gray-900 font-bold text-xs sm:text-sm px-4 py-1.5 rounded-full mb-6"
            style={{ fontFamily: fontStack.display }}
          >
            ⚡ 5 vagas abertas este mês
          </span>
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl leading-[1.1] font-extrabold mb-6"
            style={{ fontFamily: fontStack.display }}
          >
            Seu negócio local merece ter{" "}
            <span style={{ color: "#F59E0B" }}>fila de cliente</span> — não fila de preocupação
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto mb-8 leading-relaxed">
            Em 90 dias, você vai ter um sistema simples funcionando: cliente novo chegando pelo
            digital, sem precisar virar influencer e sem depender de agência.
          </p>
          <button
            onClick={scrollToForm}
            className="bg-amber-400 text-gray-900 font-bold rounded px-9 py-4 text-base sm:text-lg hover:brightness-110 transition shadow-lg"
            style={{ fontFamily: fontStack.display }}
          >
            Quero minha sessão gratuita de diagnóstico
          </button>
          <p className="text-sm text-gray-400 mt-4">
            Apenas 5 vagas abertas este mês. Sessão gratuita de 30 minutos com o Edson.
          </p>
        </div>
      </section>

      {/* BARRA ATRIBUTOS */}
      <section className="bg-[#F9FAFB] border-y border-gray-200 py-4 px-5">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-xs sm:text-sm font-semibold text-gray-700 tracking-wide">
          {["MENTORIA 1:1", "MÉTODO RAIZTECH", "RESULTADO EM 90 DIAS", "GARANTIA 14 DIAS"].map(
            (item, i, arr) => (
              <span key={item} className="flex items-center gap-6">
                {item}
                {i < arr.length - 1 && <span className="text-amber-500">•</span>}
              </span>
            ),
          )}
        </div>
      </section>

      {/* PROBLEMA */}
      <section className="bg-white py-20 px-5">
        <div className="max-w-3xl mx-auto">
          <span
            className="text-amber-500 font-bold text-sm tracking-widest"
            style={{ fontFamily: fontStack.display }}
          >
            O PROBLEMA
          </span>
          <h2
            className="text-3xl sm:text-4xl font-extrabold mt-3 mb-6"
            style={{ fontFamily: fontStack.display }}
          >
            Você não está aqui por acaso
          </h2>
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            Você está cansado de ver seu negócio estagnado enquanto concorrente com metade da sua
            experiência está cheio de cliente.
          </p>
          <ul className="space-y-4">
            {[
              "Você já tentou impulsionar post e jogou dinheiro fora",
              "Você já pagou agência que sumiu depois do contrato",
              "Você sabe que precisa do digital mas não sabe por onde começar",
              "Você não tem tempo para ficar postando todo dia",
              "Você tem cliente fiel mas não consegue atrair cliente novo",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-gray-800">
                <span className="text-red-500 font-bold text-xl leading-none mt-0.5">✗</span>
                <span className="text-base sm:text-lg">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* SOLUÇÃO */}
      <section className="bg-[#1B4332] text-white py-20 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span
              className="text-amber-400 font-bold text-sm tracking-widest"
              style={{ fontFamily: fontStack.display }}
            >
              A SOLUÇÃO
            </span>
            <h2
              className="text-3xl sm:text-4xl font-extrabold mt-3 mb-4"
              style={{ fontFamily: fontStack.display }}
            >
              Não precisa de mais curso. Precisa de sistema.
            </h2>
            <p className="text-lg text-gray-200 max-w-2xl mx-auto">
              Alguém que conhece SEU tipo de negócio e monta o sistema COM você.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                n: "01",
                t: "Diagnóstico",
                d: "Entendemos o que está travando seu crescimento. Sessão gratuita de 30 minutos.",
              },
              {
                n: "02",
                t: "Estrutura",
                d: "Montamos juntos sua presença digital mínima e sua oferta clara.",
              },
              {
                n: "03",
                t: "Sistema",
                d: "Anúncio simples no ar, WhatsApp respondendo automaticamente, agenda cheia.",
              },
            ].map((c) => (
              <div
                key={c.n}
                className="bg-white/5 border border-white/15 rounded-lg p-6 backdrop-blur"
              >
                <div
                  className="text-amber-400 font-extrabold text-2xl mb-3"
                  style={{ fontFamily: fontStack.display }}
                >
                  {c.n} / {c.t}
                </div>
                <p className="text-gray-200 leading-relaxed">{c.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFÍCIOS */}
      <section className="bg-[#F9FAFB] py-20 px-5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span
              className="text-[#1B4332] font-bold text-sm tracking-widest"
              style={{ fontFamily: fontStack.display }}
            >
              O QUE VOCÊ RECEBE
            </span>
            <h2
              className="text-3xl sm:text-4xl font-extrabold mt-3"
              style={{ fontFamily: fontStack.display }}
            >
              Tudo que você precisa. Nada que você não precisa.
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { i: "🎯", t: "Mentoria 1:1 com o Edson", d: "Atenção total no SEU negócio." },
              { i: "🔧", t: "Método RaizTech", d: "Sem jargão, sem enrolação." },
              { i: "📅", t: "Sistema em 90 dias", d: "Prática com resultado mensurável." },
              { i: "💬", t: "Suporte via WhatsApp", d: "Você não fica sozinho." },
              { i: "👥", t: "Grupo exclusivo", d: "Rede de empresários locais." },
              { i: "📱", t: "Automação de WhatsApp", d: "Respondendo enquanto você trabalha." },
            ].map((b) => (
              <div
                key={b.t}
                className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 hover:shadow-md transition"
              >
                <div className="text-3xl mb-3">{b.i}</div>
                <h3
                  className="font-extrabold text-lg mb-2"
                  style={{ fontFamily: fontStack.display }}
                >
                  {b.t}
                </h3>
                <p className="text-gray-600">{b.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROVA SOCIAL */}
      <section className="bg-white py-20 px-5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span
              className="text-amber-500 font-bold text-sm tracking-widest"
              style={{ fontFamily: fontStack.display }}
            >
              QUEM JÁ PASSOU PELO MÉTODO
            </span>
            <h2
              className="text-3xl sm:text-4xl font-extrabold mt-3"
              style={{ fontFamily: fontStack.display }}
            >
              Resultados reais de negócios locais
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                q: "Fechei 3 clientes novos na primeira semana de anúncio. Nunca pensei que daria tão certo.",
                a: "Seu José",
                r: "Oficina Mecânica, SP",
              },
              {
                q: "Tinha medo de tecnologia. O Edson destravou tudo. 8 pacientes novos no primeiro mês.",
                a: "Dra. Ana",
                r: "Clínica, RJ",
              },
              {
                q: "Aumentou o movimento em 40% em 60 dias. Hoje a agenda do sábado fecha na quarta.",
                a: "Marcos",
                r: "Restaurante, MG",
              },
            ].map((t) => (
              <div
                key={t.a}
                className="bg-white border border-gray-200 border-l-4 border-l-[#1B4332] rounded-lg shadow-sm p-6"
              >
                <p className="text-gray-700 italic leading-relaxed mb-4">"{t.q}"</p>
                <div
                  className="font-extrabold text-[#1B4332]"
                  style={{ fontFamily: fontStack.display }}
                >
                  {t.a}
                </div>
                <div className="text-sm text-gray-500">{t.r}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OFERTA */}
      <section className="bg-[#111827] text-white py-20 px-5">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <span
              className="text-amber-400 font-bold text-sm tracking-widest"
              style={{ fontFamily: fontStack.display }}
            >
              A OFERTA
            </span>
            <h2
              className="text-3xl sm:text-4xl font-extrabold mt-3"
              style={{ fontFamily: fontStack.display }}
            >
              Mentoria completa RaizTech
            </h2>
          </div>
          <div className="bg-[#1B4332] rounded-lg border-t-4 border-amber-400 p-7 sm:p-9 shadow-2xl">
            <ul className="space-y-3 mb-8">
              {[
                "12 sessões 1:1 ao vivo com o Edson (90 dias)",
                "Diagnóstico completo do seu negócio",
                "Montagem da sua oferta e presença digital",
                "Estrutura de anúncio simples no ar",
                "Automação de WhatsApp configurada",
                "Suporte ilimitado por WhatsApp",
                "Acesso ao grupo exclusivo de empresários",
                "BÔNUS: Templates de mensagens e anúncios",
              ].map((i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-green-400 font-bold text-lg leading-none mt-0.5">✓</span>
                  <span className="text-gray-100">{i}</span>
                </li>
              ))}
            </ul>
            <div className="text-center border-t border-white/15 pt-6">
              <div className="text-gray-400 line-through text-sm">De R$ 8.000</div>
              <div
                className="text-5xl sm:text-6xl font-extrabold my-2"
                style={{ fontFamily: fontStack.display, color: "#F59E0B" }}
              >
                R$ 5.000
              </div>
              <div className="text-gray-300 text-sm mb-6">ou plano básico por R$ 3.000</div>
              <button
                onClick={scrollToForm}
                className="bg-amber-400 text-gray-900 font-bold rounded px-9 py-4 hover:brightness-110 transition w-full sm:w-auto"
                style={{ fontFamily: fontStack.display }}
              >
                Quero minha sessão gratuita
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* GARANTIA */}
      <section className="bg-[#F9FAFB] py-20 px-5">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white border border-gray-200 border-l-4 border-l-green-600 rounded-lg shadow-sm p-8 text-center">
            <div className="text-5xl mb-3">🛡️</div>
            <h3
              className="text-2xl font-extrabold text-green-700 mb-3"
              style={{ fontFamily: fontStack.display }}
            >
              Garantia de 14 dias
            </h3>
            <p className="text-gray-700 leading-relaxed">
              Se após as primeiras 2 sessões você sentir que a mentoria não é para você, devolvemos
              100% do valor. Sem burocracia, sem pergunta.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-20 px-5">
        <div className="max-w-2xl mx-auto">
          <h2
            className="text-3xl sm:text-4xl font-extrabold text-center mb-10"
            style={{ fontFamily: fontStack.display }}
          >
            Perguntas frequentes
          </h2>
          <div className="space-y-3">
            {[
              {
                q: "Preciso entender de tecnologia?",
                a: "Não. O método foi criado para quem nunca mexeu com digital. A gente faz junto com você, no seu ritmo.",
              },
              {
                q: "Quanto tempo vou precisar dedicar?",
                a: "Mínimo de 2 horas por semana — entre sessão e execução. Tudo é prático e enxuto.",
              },
              {
                q: "Funciona para qualquer negócio local?",
                a: "Melhor para ticket médio acima de R$200: clínicas, restaurantes, oficinas, lojas e prestadores de serviço.",
              },
              {
                q: "Quando começo a ver resultado?",
                a: "Primeiros clientes em até 30 dias. Sistema completo rodando em 90 dias.",
              },
              {
                q: "A sessão de diagnóstico é gratuita?",
                a: "Sim. 30 minutos ao vivo com o Edson, sem custo e sem compromisso.",
              },
            ].map((f) => (
              <FaqItem key={f.q} q={f.q} a={f.a} />
            ))}
          </div>
        </div>
      </section>

      {/* FORMULÁRIO */}
      <section id="formulario" ref={formRef} className="bg-[#1B4332] text-white py-20 px-5">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <span
              className="text-amber-400 font-bold text-sm tracking-widest"
              style={{ fontFamily: fontStack.display }}
            >
              COMECE HOJE
            </span>
            <h2
              className="text-3xl sm:text-4xl font-extrabold mt-3 mb-3"
              style={{ fontFamily: fontStack.display }}
            >
              Quero minha sessão gratuita de diagnóstico
            </h2>
            <p className="text-gray-200">
              Preencha abaixo e o Edson entra em contato em até 24h para agendar.
            </p>
          </div>
          <LeadForm />
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#111827] text-gray-400 py-12 px-5 pb-28 md:pb-12">
        <div className="max-w-6xl mx-auto text-center">
          <div
            className="text-white font-extrabold text-xl mb-2"
            style={{ fontFamily: fontStack.display }}
          >
            Tiozão<span style={{ color: "#F59E0B" }}>RaizTech</span>
          </div>
          <p className="mb-4">Tecnologia sem frescura para quem vende de verdade.</p>
          <p className="text-sm">© 2026 Tiozão RaizTech · contato@tiozaoraiztech.com.br</p>
        </div>
      </footer>

      {/* FLOATING CTA MOBILE */}
      {!formVisible && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#1B4332] px-4 py-3 shadow-2xl border-t border-white/10">
          <button
            onClick={scrollToForm}
            className="w-full bg-amber-400 text-gray-900 font-bold rounded py-3 hover:brightness-110 transition"
            style={{ fontFamily: fontStack.display }}
          >
            Quero minha sessão gratuita →
          </button>
        </div>
      )}
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between text-left px-5 py-4 hover:bg-gray-50 transition"
      >
        <span className="font-semibold text-gray-900" style={{ fontFamily: fontStack.display }}>
          {q}
        </span>
        <span className={`text-amber-500 text-xl transition-transform ${open ? "rotate-45" : ""}`}>
          +
        </span>
      </button>
      {open && <div className="px-5 pb-4 text-gray-600 leading-relaxed">{a}</div>}
    </div>
  );
}

type Status = { type: "idle" | "loading" | "success" | "error"; msg?: string };

function LeadForm() {
  const [status, setStatus] = useState<Status>({ type: "idle" });
  const [form, setForm] = useState({
    nome: "",
    whatsapp: "",
    tipo_negocio: "",
    faturamento: "",
    maior_dor: "",
  });

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim() || !form.whatsapp.trim() || !form.maior_dor.trim()) {
      setStatus({ type: "error", msg: "Preencha todos os campos obrigatórios." });
      return;
    }
    setStatus({ type: "loading" });
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: form.nome.trim(),
          whatsapp: formatWhatsapp(form.whatsapp),
          tipo_negocio: form.tipo_negocio,
          faturamento: form.faturamento,
          maior_dor: form.maior_dor.trim(),
        }),
      });
      if (res.status === 201 || res.ok) {
        setStatus({
          type: "success",
          msg: "Recebemos seu pedido! O Edson entra em contato em até 24h.",
        });
        setForm({ nome: "", whatsapp: "", tipo_negocio: "", faturamento: "", maior_dor: "" });
        try {
          // @ts-expect-error fbq global
          if (typeof window !== "undefined" && typeof window.fbq === "function") window.fbq("track", "Lead");
        } catch {}
      } else {
        setStatus({ type: "error", msg: "Não foi possível enviar agora. Tente novamente." });
      }
    } catch {
      setStatus({ type: "error", msg: "Erro de conexão. Tente novamente." });
    }
  };

  const inputCls =
    "w-full rounded-md border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition";

  return (
    <div className="bg-white text-gray-900 rounded-lg shadow-2xl p-6 sm:p-8">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-1.5">Nome completo *</label>
          <input
            required
            type="text"
            value={form.nome}
            onChange={update("nome")}
            className={inputCls}
            placeholder="Seu nome"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1.5">WhatsApp com DDD *</label>
          <input
            required
            type="tel"
            value={form.whatsapp}
            onChange={update("whatsapp")}
            className={inputCls}
            placeholder="(11) 99999-9999"
          />
          <p className="text-xs text-gray-500 mt-1">O Edson vai te chamar por aqui.</p>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1.5">Tipo de negócio</label>
          <select value={form.tipo_negocio} onChange={update("tipo_negocio")} className={inputCls}>
            <option value="">Selecione...</option>
            <option value="restaurante">Restaurante / Alimentação</option>
            <option value="clinica">Clínica / Saúde / Estética</option>
            <option value="oficina">Oficina / Automotivo</option>
            <option value="comercio">Comércio / Loja</option>
            <option value="servicos">Prestação de Serviços</option>
            <option value="outro">Outro</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1.5">Faturamento mensal</label>
          <select value={form.faturamento} onChange={update("faturamento")} className={inputCls}>
            <option value="">Selecione...</option>
            <option value="ate-20k">Até R$ 20 mil</option>
            <option value="20k-50k">R$ 20 mil – R$ 50 mil</option>
            <option value="50k-100k">R$ 50 mil – R$ 100 mil</option>
            <option value="acima-100k">Acima de R$ 100 mil</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1.5">Maior desafio hoje *</label>
          <textarea
            required
            value={form.maior_dor}
            onChange={update("maior_dor")}
            rows={4}
            className={inputCls}
            placeholder="Ex: não consigo atrair clientes novos..."
          />
        </div>
        <button
          type="submit"
          disabled={status.type === "loading"}
          className="w-full bg-amber-400 text-gray-900 font-bold rounded px-9 py-4 hover:brightness-110 transition disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ fontFamily: fontStack.display }}
        >
          {status.type === "loading" ? "Enviando..." : "Quero minha sessão gratuita agora →"}
        </button>
        {status.type === "success" && (
          <div className="rounded-md bg-green-50 border border-green-200 text-green-800 px-4 py-3 text-sm">
            ✓ {status.msg}
          </div>
        )}
        {status.type === "error" && (
          <div className="rounded-md bg-red-50 border border-red-200 text-red-800 px-4 py-3 text-sm">
            {status.msg}
          </div>
        )}
        <p className="text-xs text-gray-500 text-center pt-2">
          🔒 Seus dados são privados. Apenas 5 vagas por mês.
        </p>
      </form>
    </div>
  );
}
