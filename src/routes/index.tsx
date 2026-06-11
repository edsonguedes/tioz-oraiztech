import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tiozão RaizTech — Mentoria de negócio local com Edson Guedes" },
      {
        name: "description",
        content:
          "Mentoria 1:1 com Edson Guedes para dono de negócio local. Sistema RaizTech de 90 dias: cliente novo pelo digital, sem virar influencer e sem agência.",
      },
      { property: "og:title", content: "Tiozão RaizTech — Mentoria com Edson Guedes" },
      {
        property: "og:description",
        content:
          "Sistema RaizTech: primeiros clientes em 30 dias, sistema rodando em 90. Sessão gratuita de diagnóstico.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

const ENDPOINT = "https://ftcldzqglgujynscfqns.supabase.co/functions/v1/handle-lead";

const FF_DISPLAY = "'Montserrat', system-ui, sans-serif";
const FF_BODY = "'Inter', system-ui, sans-serif";

function formatWhatsapp(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("55")) return `+${digits}`;
  return `+55${digits}`;
}

/* ============ Hero canvas particles ============ */
function ParticlesCanvas() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let w = (canvas.width = canvas.offsetWidth);
    let h = (canvas.height = canvas.offsetHeight);
    const count = Math.min(80, Math.floor((w * h) / 18000));
    const pts = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
    }));
    const onResize = () => {
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", onResize);
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i], b = pts[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d = Math.hypot(dx, dy);
          if (d < 140) {
            ctx.strokeStyle = `rgba(64,145,108,${(1 - d / 140) * 0.35})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      ctx.fillStyle = "rgba(27,67,50,.8)";
      for (const p of pts) {
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2); ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, []);
  return <canvas ref={ref} className="absolute inset-0 w-full h-full" />;
}

/* ============ Counter ============ */
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [val, setVal] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let started = false;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !started) {
        started = true;
        const start = performance.now();
        const dur = 1400;
        const tick = (t: number) => {
          const p = Math.min(1, (t - start) / dur);
          setVal(Math.round(to * (1 - Math.pow(1 - p, 3))));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [to]);
  return <span ref={ref}>{val}{suffix}</span>;
}

/* ============ Scroll reveal ============ */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".tz-reveal");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e, i) => {
        if (e.isIntersecting) {
          setTimeout(() => e.target.classList.add("tz-in"), i * 60);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const formRef = useRef<HTMLDivElement | null>(null);
  const [formVisible, setFormVisible] = useState(false);

  useReveal();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!formRef.current) return;
    const io = new IntersectionObserver(([e]) => setFormVisible(e.isIntersecting), { threshold: 0.15 });
    io.observe(formRef.current);
    return () => io.disconnect();
  }, []);

  const scrollToForm = () =>
    document.getElementById("formulario")?.scrollIntoView({ behavior: "smooth" });
  const scrollToMetodo = () =>
    document.getElementById("metodo")?.scrollIntoView({ behavior: "smooth" });

  return (
    <div
      style={{ fontFamily: FF_BODY, color: "#E5E7EB", background: "#050c18" }}
      className="min-h-screen overflow-x-hidden"
    >
      {/* NAV */}
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all"
        style={{
          background: scrolled ? "rgba(5,12,24,.94)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,.06)" : "1px solid transparent",
        }}
      >
        <div className="max-w-6xl mx-auto px-5 py-3.5 flex items-center justify-between">
          <span
            className="text-white text-lg sm:text-xl font-black tracking-tight"
            style={{ fontFamily: FF_DISPLAY }}
          >
            Tiozão <span style={{ color: "#F59E0B" }}>RaizTech</span>
          </span>
          <button
            onClick={scrollToForm}
            className="tz-btn-gold rounded-lg px-4 py-2 text-xs sm:text-sm"
            style={{ fontFamily: FF_DISPLAY }}
          >
            Sessão gratuita →
          </button>
        </div>
      </header>

      {/* HERO */}
      <section
        className="relative pt-28 sm:pt-32 pb-16 px-5 overflow-hidden"
        style={{ background: "radial-gradient(ellipse at top, #0a1628 0%, #050c18 60%)" }}
      >
        <div className="absolute inset-0 opacity-70"><ParticlesCanvas /></div>
        <div className="tz-orb" style={{ top: "30%", right: "5%" }} />
        <div className="relative max-w-6xl mx-auto grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
          {/* LEFT */}
          <div className="tz-reveal">
            <span
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold px-4 py-2 rounded-full mb-6"
              style={{
                color: "#FCD34D",
                background: "rgba(245,158,11,.1)",
                border: "1px solid rgba(245,158,11,.3)",
                fontFamily: FF_DISPLAY,
              }}
            >
              <span className="tz-pulse-dot inline-block w-2 h-2 rounded-full" style={{ background: "#F59E0B" }} />
              5 vagas abertas este mês — 2 já preenchidas
            </span>
            <h1
              className="text-white font-black leading-[1.05] mb-6"
              style={{
                fontFamily: FF_DISPLAY,
                fontSize: "clamp(2.2rem, 5.5vw, 3.75rem)",
                letterSpacing: "-1.5px",
              }}
            >
              Dono de negócio local:<br />
              <span className="tz-shimmer">seu próximo cliente</span><br />
              pode vir do digital<br />
              em 30 dias
            </h1>
            <p className="text-base sm:text-lg leading-relaxed mb-8" style={{ color: "#9CA3AF" }}>
              O Método RaizTech coloca seu negócio no digital de forma simples, sem você precisar
              virar influencer, sem agência, sem post todo dia. <strong style={{ color: "#E5E7EB" }}>Edson Guedes</strong> acompanha
              você do zero ao sistema funcionando.
            </p>
            <div className="flex flex-wrap gap-3 mb-6">
              <button
                onClick={scrollToForm}
                className="tz-btn-gold rounded-xl px-6 py-4 text-sm sm:text-base"
                style={{ fontFamily: FF_DISPLAY }}
              >
                Quero minha sessão gratuita de diagnóstico →
              </button>
              <button
                onClick={scrollToMetodo}
                className="rounded-xl px-6 py-4 text-sm sm:text-base font-bold transition hover:bg-white/5"
                style={{
                  fontFamily: FF_DISPLAY,
                  color: "#E5E7EB",
                  border: "1px solid rgba(255,255,255,.15)",
                }}
              >
                Como funciona
              </button>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm" style={{ color: "#9CA3AF" }}>
              {["Sessão de 30 min gratuita", "Garantia 14 dias", "Sem compromisso"].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5">
                  <span style={{ color: "#10B981" }}>✓</span> {t}
                </span>
              ))}
            </div>
          </div>

          {/* RIGHT - Photo frame */}
          <div className="relative tz-reveal flex justify-center lg:justify-end">
            <div className="relative" style={{ width: "min(380px, 88vw)" }}>
              <div className="tz-ring-spin" />
              <div
                className="relative rounded-3xl overflow-hidden"
                style={{
                  width: "100%",
                  aspectRatio: "380 / 460",
                  background:
                    "linear-gradient(145deg, rgba(27,67,50,.6) 0%, rgba(5,12,24,.95) 100%)",
                  border: "1px solid rgba(255,255,255,.08)",
                  backdropFilter: "blur(8px)",
                }}
              >
                {/* TODO: replace with <img src="/edson-guedes-hero.jpg" ... /> */}
                <svg viewBox="0 0 200 240" className="absolute inset-0 w-full h-full opacity-60">
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="#40916C" />
                      <stop offset="1" stopColor="#1B4332" />
                    </linearGradient>
                  </defs>
                  <circle cx="100" cy="85" r="38" fill="url(#g1)" />
                  <path d="M30 240 Q30 150 100 150 Q170 150 170 240 Z" fill="url(#g1)" />
                </svg>
                <div
                  className="absolute bottom-0 left-0 right-0 p-5 text-center"
                  style={{ background: "linear-gradient(to top, rgba(5,12,24,.95), transparent)" }}
                >
                  <div className="text-white font-black text-lg" style={{ fontFamily: FF_DISPLAY }}>
                    Edson Guedes
                  </div>
                  <div className="text-xs" style={{ color: "#FCD34D" }}>
                    Mentor Tiozão RaizTech
                  </div>
                </div>
              </div>
              {/* Floating cards */}
              <div
                className="absolute -bottom-6 -left-6 tz-float p-3 rounded-xl tz-card"
                style={{ animationDelay: "1s" }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📈</span>
                  <div>
                    <div className="text-[10px]" style={{ color: "#9CA3AF" }}>Resultado médio</div>
                    <div className="text-sm font-bold text-white" style={{ fontFamily: FF_DISPLAY }}>
                      +40% clientes em 60d
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 tz-float p-3 rounded-xl tz-card">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">⭐</span>
                  <div>
                    <div className="text-[10px]" style={{ color: "#9CA3AF" }}>Avaliação</div>
                    <div className="text-sm font-bold text-white" style={{ fontFamily: FF_DISPLAY }}>
                      5.0 / 5.0
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="px-5 py-10 sm:py-14" style={{ background: "rgba(255,255,255,.025)" }}>
        <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { n: 30, s: "dias", d: "para os primeiros clientes digitais chegarem" },
            { n: 90, s: "dias", d: "para o sistema completo rodar sozinho" },
            { n: 2, s: "h/sem", d: "é tudo que você precisa dedicar por semana" },
            { n: 14, s: "dias", d: "de garantia total, sem burocracia" },
          ].map((s, i) => (
            <div
              key={i}
              className="text-center px-3 tz-reveal"
              style={{
                borderRight: i < 3 ? "1px solid rgba(255,255,255,.08)" : "none",
              }}
            >
              <div
                className="font-black tz-shimmer"
                style={{ fontFamily: FF_DISPLAY, fontSize: "clamp(2rem, 5vw, 3rem)", letterSpacing: "-1.5px" }}
              >
                <Counter to={s.n} suffix={" " + s.s} />
              </div>
              <div className="text-xs sm:text-sm mt-1" style={{ color: "#9CA3AF" }}>
                {s.d}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PROBLEMA */}
      <section className="py-20 px-5" style={{ background: "#050c18" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 tz-reveal">
            <Tag>O PROBLEMA</Tag>
            <H2>Você já tentou de tudo. <span className="tz-shimmer">Nada funcionou de verdade.</span></H2>
            <Sub>Aqui está a lista. Se você marcar 3 ou mais, você está no lugar certo.</Sub>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              "Você impulsionou post e jogou dinheiro fora — sem saber o que estava fazendo",
              "Você pagou agência que sumiu depois de assinar o contrato",
              "Você sabe que precisa do digital mas não sabe por onde começar sem perder tempo",
              "Você não tem tempo para ficar postando todo dia — tem um negócio para operar",
              "Você tem cliente fiel mas depende só do boca a boca para atrair cliente novo",
              "Você comprou curso online que não se encaixou na sua realidade de negócio local",
            ].map((p) => (
              <div key={p} className="tz-card tz-pain rounded-xl p-5 tz-reveal">
                <div className="flex items-start gap-3">
                  <span className="text-xl font-black" style={{ color: "#EF4444" }}>✗</span>
                  <span style={{ color: "#E5E7EB" }}>{p}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-12 tz-reveal">
            <button
              onClick={scrollToForm}
              className="tz-btn-gold rounded-xl px-7 py-4"
              style={{ fontFamily: FF_DISPLAY }}
            >
              Quero meu diagnóstico gratuito →
            </button>
            <p className="text-sm italic mt-3" style={{ color: "#9CA3AF" }}>
              Sessão gratuita de diagnóstico. <strong style={{ color: "#FCD34D" }}>Sem compromisso.</strong>
            </p>
          </div>
        </div>
      </section>

      {/* SOBRE EDSON GUEDES */}
      <section
        className="py-20 px-5"
        style={{ background: "linear-gradient(180deg, #050c18 0%, #0d2a1e 50%, #050c18 100%)" }}
      >
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative tz-reveal order-2 lg:order-1">
            <div
              className="relative rounded-2xl overflow-hidden"
              style={{
                paddingBottom: "120%",
                background: "linear-gradient(145deg, rgba(27,67,50,.6) 0%, rgba(5,12,24,.9) 100%)",
                border: "1px solid rgba(255,255,255,.08)",
              }}
            >
              {/* TODO: replace with <img src="/edson-guedes-sobre.jpg" /> */}
              <svg viewBox="0 0 200 240" className="absolute inset-0 w-full h-full opacity-55">
                <defs>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#40916C" />
                    <stop offset="1" stopColor="#1B4332" />
                  </linearGradient>
                </defs>
                <circle cx="100" cy="80" r="42" fill="url(#g2)" />
                <path d="M20 240 Q20 145 100 145 Q180 145 180 240 Z" fill="url(#g2)" />
              </svg>
              <div
                className="absolute bottom-0 left-0 right-0 text-center py-4"
                style={{ background: "linear-gradient(to top, rgba(5,12,24,.92), transparent)" }}
              >
                <div className="text-white font-black" style={{ fontFamily: FF_DISPLAY }}>Edson Guedes</div>
              </div>
            </div>
            <div
              className="absolute -bottom-5 -right-5 px-5 py-3 rounded-xl"
              style={{
                background: "#050c18",
                border: "1px solid rgba(245,158,11,.4)",
              }}
            >
              <div className="text-2xl font-black tz-shimmer" style={{ fontFamily: FF_DISPLAY }}>+100</div>
              <div className="text-[10px] uppercase tracking-wide" style={{ color: "#9CA3AF" }}>
                negócios orientados
              </div>
            </div>
            <div
              className="absolute -top-3 -left-3 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ background: "#10B981", color: "#050c18", fontFamily: FF_DISPLAY }}
            >
              ✓ Método validado
            </div>
          </div>

          <div className="tz-reveal order-1 lg:order-2">
            <Tag>QUEM É O EDSON GUEDES</Tag>
            <H2>O Tiozão não é guru. <span className="tz-shimmer">É um empresário que testou tudo antes de você.</span></H2>
            <p className="text-base sm:text-lg leading-relaxed mb-6" style={{ color: "#9CA3AF" }}>
              Edson Guedes passou pelo mesmo caminho que você está. Tentou o digital, errou, perdeu
              dinheiro, e depois descobriu o que realmente funciona para negócio local. O Método
              RaizTech é o resultado disso.
            </p>
            <blockquote
              className="pl-5 py-2 mb-6 italic"
              style={{ borderLeft: "3px solid #F59E0B", color: "#E5E7EB" }}
            >
              "Eu não ensino teoria. Eu ensino exatamente o que funciona para o tipo de negócio que
              você tem, no tipo de cidade que você opera."
              <div className="mt-2 not-italic text-sm" style={{ color: "#FCD34D" }}>— Edson Guedes</div>
            </blockquote>
            <ul className="space-y-3 mb-7">
              {[
                "Mais de 100 donos de negócio local orientados no digital",
                "Especialista em inteligência artificial aplicada a negócios locais",
                "Método criado para quem nunca tocou em tecnologia antes",
                "Atende pessoalmente — sem assistente, sem equipe de vendas",
                "Foco em resultado mensurável em 30 dias ou devolve seu dinheiro",
              ].map((c) => (
                <li key={c} className="flex items-start gap-2.5" style={{ color: "#E5E7EB" }}>
                  <span style={{ color: "#F59E0B" }} className="mt-1.5 inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
                    /><span>{c}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={scrollToForm}
              className="tz-btn-gold rounded-xl px-6 py-3.5"
              style={{ fontFamily: FF_DISPLAY }}
            >
              Falar com Edson Guedes →
            </button>
          </div>
        </div>
      </section>

      {/* MÉTODO */}
      <section id="metodo" className="py-20 px-5" style={{ background: "#050c18" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14 tz-reveal">
            <Tag>O MÉTODO</Tag>
            <H2>Sistema <span className="tz-shimmer">RaizTech 90 Dias</span></H2>
            <Sub>Três fases. Cada uma com entregas claras e mensuráveis.</Sub>
          </div>
          <div className="relative grid lg:grid-cols-3 gap-6">
            <div
              className="hidden lg:block absolute top-8 left-[16%] right-[16%] h-px"
              style={{ background: "linear-gradient(90deg, #1B4332, #F59E0B, #1B4332)" }}
            />
            {[
              {
                n: "01",
                t: "Dias 1–30",
                title: "Diagnóstico + Estrutura",
                items: [
                  "Google Meu Negócio otimizado",
                  "Bio e oferta clara no Instagram",
                  "Primeiros clientes digitais chegando",
                ],
              },
              {
                n: "02",
                t: "Dias 31–60",
                title: "Tráfego + Automação",
                items: [
                  "Meta Ads simples no ar",
                  "WhatsApp Business configurado",
                  "Automação de atendimento",
                  "Sistema de agendamento",
                ],
              },
              {
                n: "03",
                t: "Dias 61–90",
                title: "Escala + Autonomia",
                items: [
                  "Funil de conversão ajustado",
                  "IA aplicada no atendimento",
                  "Relatório de resultados",
                  "Planejamento próximo trimestre",
                ],
              },
            ].map((f) => (
              <div key={f.n} className="relative tz-card tz-card-top rounded-2xl p-7 tz-reveal">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-5 mx-auto font-black text-xl"
                  style={{
                    background: "linear-gradient(135deg, #1B4332, #F59E0B)",
                    color: "#050c18",
                    fontFamily: FF_DISPLAY,
                    boxShadow: "0 0 30px rgba(245,158,11,.3)",
                  }}
                >
                  {f.n}
                </div>
                <div className="text-center text-xs font-bold tracking-widest mb-1" style={{ color: "#FCD34D" }}>
                  {f.t}
                </div>
                <h3 className="text-center text-white font-black text-xl mb-4" style={{ fontFamily: FF_DISPLAY }}>
                  {f.title}
                </h3>
                <ul className="space-y-2.5">
                  {f.items.map((i) => (
                    <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "#E5E7EB" }}>
                      <span style={{ color: "#10B981" }}>✓</span> {i}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="text-center mt-12 tz-reveal">
            <button onClick={scrollToForm} className="tz-btn-gold rounded-xl px-7 py-4" style={{ fontFamily: FF_DISPLAY }}>
              Quero começar meu Sistema RaizTech →
            </button>
          </div>
        </div>
      </section>

      {/* O QUE ESTÁ INCLUSO */}
      <section
        className="py-20 px-5"
        style={{ background: "linear-gradient(180deg, #050c18 0%, #0a1628 100%)" }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 tz-reveal">
            <Tag>O QUE ESTÁ INCLUSO</Tag>
            <H2>Tudo que você precisa. <span className="tz-shimmer">Nada que você não vai usar.</span></H2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { i: "🎯", t: "Mentoria 1:1 com Edson Guedes", d: "Atenção total no seu negócio. Edson Guedes acompanha do diagnóstico à execução.", b: "INCLUSO" },
              { i: "📐", t: "Método RaizTech Completo", d: "Sistema documentado de 90 dias. Cada passo adaptado para o seu segmento.", b: "INCLUSO" },
              { i: "💬", t: "Suporte WhatsApp 5 dias/sem", d: "Edson Guedes responde pessoalmente durante toda a mentoria.", b: "INCLUSO" },
              { i: "🤖", t: "IA Aplicada ao Seu Negócio", d: "Automação de WhatsApp e agendamento — sem precisar entender de tecnologia.", b: "INCLUSO" },
              { i: "📢", t: "Primeiro Anúncio no Meta Ads", d: "Criamos junto o primeiro anúncio funcional — você aprende fazendo.", b: "INCLUSO" },
              { i: "👥", t: "Grupo Exclusivo de Empresários", d: "Rede de contatos com outros donos de negócio local no mesmo caminho.", b: "BÔNUS" },
            ].map((c) => (
              <div key={c.t} className="tz-card tz-card-top rounded-2xl p-6 tz-reveal">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl">{c.i}</span>
                  <span
                    className="text-[10px] font-black px-2 py-1 rounded"
                    style={{
                      background: c.b === "BÔNUS" ? "rgba(16,185,129,.15)" : "rgba(245,158,11,.15)",
                      color: c.b === "BÔNUS" ? "#10B981" : "#FCD34D",
                      fontFamily: FF_DISPLAY,
                    }}
                  >
                    {c.b}
                  </span>
                </div>
                <h3 className="text-white font-black text-lg mb-2" style={{ fontFamily: FF_DISPLAY }}>{c.t}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#9CA3AF" }}>{c.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="py-20 px-5" style={{ background: "#0a1628" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 tz-reveal">
            <Tag>RESULTADOS REAIS</Tag>
            <H2>Números que donos de negócio <span className="tz-shimmer">alcançaram com o Método</span></H2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                num: "+3 clientes",
                sub: "na primeira semana após o anúncio",
                q: "Nunca achei que fosse funcionar tão rápido. O Edson Guedes foi direto ao ponto — em 2 sessões já estava tudo no ar e os clientes começaram a aparecer.",
                ini: "JM", grad: "linear-gradient(135deg,#1B4332,#40916C)",
                nome: "Seu José — Oficina Mecânica",
                loc: "São Paulo, SP · 18 anos no mercado",
              },
              {
                num: "+8 pacientes",
                sub: "novos no primeiro mês pelo Instagram",
                q: "Tinha muito medo de tecnologia. O Edson Guedes foi tão direto e sem jargão que em 2 semanas já estava agendando consulta pelo direct.",
                ini: "AS", grad: "linear-gradient(135deg,#1e3a8a,#3b82f6)",
                nome: "Dra. Ana — Clínica Estética",
                loc: "Rio de Janeiro, RJ · Clínica há 7 anos",
              },
              {
                num: "+40% movimento",
                sub: "em 60 dias — fila de espera nos fins de semana",
                q: "Estava prestes a fechar. O sistema que o Edson Guedes montou comigo custou menos em um mês do que eu gastei com uma agência que não entregou nada.",
                ini: "MR", grad: "linear-gradient(135deg,#9a3412,#f97316)",
                nome: "Marcos — Restaurante Familiar",
                loc: "Belo Horizonte, MG · 12 anos na cidade",
              },
            ].map((t) => (
              <div key={t.ini} className="tz-card tz-card-top rounded-2xl p-7 relative tz-reveal">
                <div
                  className="absolute top-3 right-5 text-6xl font-black opacity-20"
                  style={{ color: "#F59E0B", fontFamily: "Georgia, serif" }}
                >“</div>
                <div style={{ color: "#FCD34D" }} className="mb-3 text-sm">★★★★★</div>
                <div className="font-black text-2xl tz-shimmer mb-1" style={{ fontFamily: FF_DISPLAY }}>
                  {t.num}
                </div>
                <div className="text-xs mb-4" style={{ color: "#9CA3AF" }}>{t.sub}</div>
                <p className="text-sm italic mb-5 leading-relaxed" style={{ color: "#E5E7EB" }}>
                  "{t.q}"
                </p>
                <div className="flex items-center gap-3 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,.08)" }}>
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-white font-black text-sm"
                    style={{ background: t.grad, fontFamily: FF_DISPLAY }}
                  >
                    {t.ini}
                  </div>
                  <div>
                    <div className="text-white text-sm font-bold" style={{ fontFamily: FF_DISPLAY }}>{t.nome}</div>
                    <div className="text-[11px]" style={{ color: "#9CA3AF" }}>{t.loc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DIFERENCIAIS */}
      <section
        className="py-20 px-5 relative"
        style={{
          background: "linear-gradient(180deg, #1B4332 0%, #0d2a1e 50%, #050c18 100%)",
        }}
      >
        <div className="absolute inset-0 tz-chess opacity-50 pointer-events-none" />
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-12 tz-reveal">
            <Tag>POR QUE O RAIZTECH</Tag>
            <H2>Não é agência. Não é curso. <span className="tz-shimmer">É resultado ou devolve o dinheiro.</span></H2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,.08)" }}>
            {[
              { i: "🚫", t: "Não é agência", d: "Agência faz por você, você nunca aprende e fica dependente.", bad: true },
              { i: "🚫", t: "Não é curso gravado", d: "Curso gravado é genérico. Aqui é ao vivo com Edson Guedes, focado no SEU negócio.", bad: true },
              { i: "🚫", t: "Não é guru de Instagram", d: "Zero promessa de \"1 milhão de seguidores\". É sistema para atrair cliente local real.", bad: true },
              { i: "✅", t: "É resultado mensurável", d: "Primeiros clientes em 30 dias. Sistema em 90 dias. Resultado ou devolução total.", bad: false },
            ].map((d, i) => (
              <div
                key={d.t}
                className="p-7 tz-reveal"
                style={{
                  background: d.bad ? "rgba(5,12,24,.4)" : "rgba(245,158,11,.08)",
                  borderRight: i < 3 ? "1px solid rgba(255,255,255,.08)" : "none",
                  borderBottom: "1px solid rgba(255,255,255,.04)",
                }}
              >
                <div className="text-2xl mb-3">{d.i}</div>
                <h3 className="text-white font-black text-base mb-2" style={{ fontFamily: FF_DISPLAY }}>{d.t}</h3>
                <p className="text-sm leading-relaxed" style={{ color: d.bad ? "#9CA3AF" : "#FCD34D" }}>{d.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARAÇÃO */}
      <section className="py-20 px-5" style={{ background: "#050c18" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 tz-reveal">
            <Tag>COMPARAÇÃO</Tag>
            <H2>Faça as contas <span className="tz-shimmer">você mesmo</span></H2>
          </div>
          <div className="overflow-x-auto tz-reveal">
            <table className="w-full text-sm" style={{ minWidth: 560, borderCollapse: "separate", borderSpacing: 0 }}>
              <thead>
                <tr>
                  <th className="text-left p-4 font-bold" style={{ color: "#9CA3AF", fontFamily: FF_DISPLAY }}>O que você precisa</th>
                  <th className="p-4 font-bold" style={{ color: "#9CA3AF", fontFamily: FF_DISPLAY }}>Agência</th>
                  <th className="p-4 font-bold" style={{ color: "#9CA3AF", fontFamily: FF_DISPLAY }}>Curso Online</th>
                  <th className="p-4 font-black tz-shimmer" style={{ fontFamily: FF_DISPLAY, background: "rgba(245,158,11,.05)" }}>Método RaizTech</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Personalizado para seu negócio", "—", "—", "✓"],
                  ["Você aprende e fica independente", "—", "✓", "✓"],
                  ["Acompanhamento direto (1:1)", "—", "—", "✓"],
                  ["Resultado nos primeiros 30 dias", "—", "—", "✓"],
                  ["Garantia de devolução", "—", "Raramente", "✓ 14 dias"],
                  ["IA e automação incluídas", "Extra", "—", "✓"],
                ].map((row, i) => (
                  <tr key={i} style={{ borderTop: "1px solid rgba(255,255,255,.06)" }}>
                    <td className="p-4" style={{ color: "#E5E7EB" }}>{row[0]}</td>
                    <td className="p-4 text-center" style={{ color: "#6B7280" }}>{row[1]}</td>
                    <td className="p-4 text-center" style={{ color: "#9CA3AF" }}>{row[2]}</td>
                    <td className="p-4 text-center font-bold" style={{ color: "#10B981", background: "rgba(245,158,11,.05)" }}>{row[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* GARANTIA */}
      <section className="py-20 px-5" style={{ background: "#0a1628" }}>
        <div
          className="max-w-3xl mx-auto rounded-3xl p-8 sm:p-12 tz-reveal"
          style={{
            background: "linear-gradient(135deg, rgba(16,185,129,.08), rgba(5,12,24,1))",
            border: "1px solid rgba(16,185,129,.3)",
          }}
        >
          <div className="grid sm:grid-cols-[auto_1fr] gap-6 items-center">
            <div className="text-7xl text-center tz-float">🛡️</div>
            <div>
              <h3 className="text-2xl sm:text-3xl font-black mb-3" style={{ color: "#10B981", fontFamily: FF_DISPLAY, letterSpacing: "-0.5px" }}>
                Garantia Incondicional de 14 Dias
              </h3>
              <p className="leading-relaxed mb-3" style={{ color: "#E5E7EB" }}>
                Se após as primeiras 2 sessões você sentir que a mentoria não é para o seu negócio
                — seja qual for o motivo — devolvemos 100% do valor investido. Sem formulário, sem
                burocracia, sem questionamento. O risco é 100% nosso.
              </p>
              <p className="italic text-sm" style={{ color: "#9CA3AF" }}>
                Edson Guedes só aceita clientes que ele tem certeza que vai conseguir ajudar. Por
                isso a taxa de reembolso é menor que 1%.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-5" style={{ background: "#050c18" }}>
        <div className="max-w-3xl mx-auto">
          <h2
            className="text-3xl sm:text-4xl font-black text-white text-center mb-10 tz-reveal"
            style={{ fontFamily: FF_DISPLAY, letterSpacing: "-1.5px" }}
          >
            Perguntas <span className="tz-shimmer">frequentes</span>
          </h2>
          <div className="space-y-3">
            {[
              { q: "Preciso entender de tecnologia?", a: "Não. O Método RaizTech foi criado especificamente para quem nunca mexeu com digital. Edson Guedes vai do zero com você." },
              { q: "Quanto tempo preciso dedicar por semana?", a: "Mínimo 2 horas por semana. O sistema é construído para funcionar com o mínimo de tempo do dono." },
              { q: "Funciona para o meu tipo de negócio?", a: "Melhor para negócios locais com ticket médio acima de R$200 que dependem de relação com o cliente." },
              { q: "Quando começo a ver resultado?", a: "Primeiros clientes digitais chegam em 30 dias para a maioria dos negócios. Em 90 dias o sistema roda sozinho." },
              { q: "A sessão de diagnóstico é mesmo de graça?", a: "Sim. 30 minutos ao vivo com Edson Guedes, sem custo e sem compromisso. Edson Guedes atende pessoalmente." },
              { q: "Qual é o investimento na mentoria?", a: "O investimento é apresentado na sessão gratuita de diagnóstico, depois que Edson Guedes entender a situação do seu negócio. O diagnóstico é gratuito e sem compromisso." },
            ].map((f) => (
              <details
                key={f.q}
                className="tz-faq tz-card rounded-xl p-5 tz-reveal"
              >
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <span className="text-white font-bold pr-4" style={{ fontFamily: FF_DISPLAY }}>{f.q}</span>
                  <span className="tz-faq-icon text-2xl font-black flex-shrink-0" style={{ color: "#F59E0B" }}>+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed" style={{ color: "#9CA3AF" }}>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FORMULÁRIO */}
      <section id="formulario" ref={formRef} className="py-20 px-5" style={{ background: "#050c18" }}>
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-start">
          <div className="tz-reveal">
            <Tag>COMECE AGORA</Tag>
            <H2>Sua sessão gratuita de diagnóstico com <span className="tz-shimmer">Edson Guedes</span></H2>
            <p className="text-base sm:text-lg leading-relaxed mb-6" style={{ color: "#9CA3AF" }}>
              30 minutos ao vivo. Sem custo. Sem compromisso. Edson Guedes vai entender o seu
              negócio e te mostrar exatamente o que está travando o crescimento.
            </p>
            <ul className="space-y-3">
              {[
                "Diagnóstico personalizado para o seu segmento",
                "Pelo menos 1 ação concreta para implementar hoje",
                "Edson Guedes atende pessoalmente — não é IA, não é assistente",
                "Sem pitch de venda forçado — só valor real",
                "Apenas 5 vagas por mês — 2 já preenchidas",
              ].map((p) => (
                <li key={p} className="flex items-start gap-3" style={{ color: "#E5E7EB" }}>
                  <span style={{ color: "#10B981" }} className="font-black mt-0.5">✓</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="tz-reveal">
            <LeadForm />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 px-5" style={{ background: "#020810", borderTop: "1px solid rgba(255,255,255,.06)" }}>
        <div className="max-w-6xl mx-auto text-center">
          <div className="text-white text-xl font-black mb-3" style={{ fontFamily: FF_DISPLAY }}>
            Tiozão <span style={{ color: "#F59E0B" }}>RaizTech</span>
          </div>
          <p className="italic mb-5 text-sm" style={{ color: "#9CA3AF" }}>
            "Tecnologia sem frescura para quem vende de verdade." — Edson Guedes
          </p>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm mb-5" style={{ color: "#9CA3AF" }}>
            <a href="mailto:contato@tiozaoraiztech.com.br" className="hover:text-amber-400 transition">contato@tiozaoraiztech.com.br</a>
            <span>·</span>
            <a href="https://instagram.com/tiozaoraitech" className="hover:text-amber-400 transition">@tiozaoraitech</a>
            <span>·</span>
            <a href="#" className="hover:text-amber-400 transition">Privacidade</a>
            <span>·</span>
            <a href="#" className="hover:text-amber-400 transition">Garantia</a>
          </div>
          <p className="text-xs" style={{ color: "#6B7280" }}>
            © 2026 Tiozão RaizTech · Edson Guedes · Todos os direitos reservados
          </p>
        </div>
      </footer>

      {/* FLOATING MOBILE CTA */}
      {!formVisible && (
        <div
          className="lg:hidden fixed bottom-0 left-0 right-0 z-40 p-3"
          style={{ background: "rgba(5,12,24,.96)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(245,158,11,.2)" }}
        >
          <button
            onClick={scrollToForm}
            className="tz-btn-gold rounded-xl w-full py-3.5 text-sm"
            style={{ fontFamily: FF_DISPLAY }}
          >
            Quero minha sessão gratuita →
          </button>
        </div>
      )}
    </div>
  );
}

/* ============ Small helpers ============ */
function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-block text-xs font-black tracking-[0.2em] mb-4"
      style={{ color: "#FCD34D", fontFamily: FF_DISPLAY }}
    >
      {children}
    </span>
  );
}
function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-white font-black mb-4"
      style={{ fontFamily: FF_DISPLAY, fontSize: "clamp(1.75rem, 4vw, 2.5rem)", letterSpacing: "-1.5px", lineHeight: 1.15 }}
    >
      {children}
    </h2>
  );
}
function Sub({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-base sm:text-lg max-w-2xl mx-auto" style={{ color: "#9CA3AF" }}>
      {children}
    </p>
  );
}

/* ============ Lead form ============ */
type Status = "idle" | "loading" | "success" | "error";
function LeadForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({
    nome: "", whatsapp: "", tipo_negocio: "", faturamento: "", maior_dor: "",
  });

  const onChange = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading"); setMsg("");
    try {
      const payload = { ...form, whatsapp: formatWhatsapp(form.whatsapp) };
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("fail");
      setStatus("success");
      setMsg("Recebemos! Edson Guedes vai te chamar no WhatsApp em breve.");
      setForm({ nome: "", whatsapp: "", tipo_negocio: "", faturamento: "", maior_dor: "" });
      const w = window as unknown as { fbq?: (...a: unknown[]) => void };
      w.fbq?.("track", "Lead");
      w.fbq?.("trackCustom", "DiagnosticoSolicitado", { tipo_negocio: payload.tipo_negocio });
    } catch {
      setStatus("error");
      setMsg("Erro ao enviar. Fale com a gente no @tiozaoraitech.");
    }
  };

  const inputCls =
    "w-full rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-amber-400 transition";
  const inputStyle: React.CSSProperties = {
    background: "rgba(255,255,255,.04)",
    border: "1px solid rgba(255,255,255,.1)",
  };

  return (
    <form
      onSubmit={onSubmit}
      className="tz-card tz-card-top rounded-2xl p-6 sm:p-8"
    >
      <h3 className="text-white font-black text-xl mb-1" style={{ fontFamily: FF_DISPLAY }}>
        Garanta sua vaga <span className="tz-shimmer">agora</span>
      </h3>
      <p className="text-xs mb-5" style={{ color: "#9CA3AF" }}>Apenas 3 vagas restantes este mês.</p>
      <div className="space-y-3">
        <input className={inputCls} style={inputStyle} required value={form.nome}
          onChange={onChange("nome")} placeholder="Como o Edson Guedes pode te chamar?" />
        <div>
          <input className={inputCls} style={inputStyle} required value={form.whatsapp}
            onChange={onChange("whatsapp")} placeholder="WhatsApp com DDD (ex: 11 99999-9999)" />
          <p className="text-[11px] mt-1" style={{ color: "#6B7280" }}>Edson Guedes vai te chamar aqui para agendar.</p>
        </div>
        <select className={inputCls} style={inputStyle} required value={form.tipo_negocio}
          onChange={onChange("tipo_negocio")}>
          <option value="">Tipo de negócio</option>
          <option>Restaurante/Alimentação</option>
          <option>Clínica/Saúde/Estética</option>
          <option>Oficina/Serviços Automotivos</option>
          <option>Comércio/Loja</option>
          <option>Prestação de Serviços</option>
          <option>Outro tipo de negócio</option>
        </select>
        <select className={inputCls} style={inputStyle} required value={form.faturamento}
          onChange={onChange("faturamento")}>
          <option value="">Faturamento mensal</option>
          <option>Até R$20mil</option>
          <option>R$20–50mil</option>
          <option>R$50–100mil</option>
          <option>Acima de R$100mil</option>
        </select>
        <textarea className={inputCls} style={inputStyle} required value={form.maior_dor} rows={3}
          onChange={onChange("maior_dor")}
          placeholder="Maior desafio hoje (ex: não consigo atrair clientes novos, só dependo do boca a boca...)" />
      </div>
      <button
        type="submit"
        disabled={status === "loading"}
        className="tz-btn-gold rounded-xl w-full mt-5 py-4 disabled:opacity-70"
        style={{ fontFamily: FF_DISPLAY }}
      >
        {status === "loading" ? "Enviando..." : "Quero minha sessão gratuita agora →"}
      </button>
      {status === "success" && (
        <p className="mt-3 text-sm p-3 rounded-lg" style={{ background: "rgba(16,185,129,.1)", color: "#10B981", border: "1px solid rgba(16,185,129,.3)" }}>
          ✓ {msg}
        </p>
      )}
      {status === "error" && (
        <p className="mt-3 text-sm p-3 rounded-lg" style={{ background: "rgba(239,68,68,.1)", color: "#EF4444", border: "1px solid rgba(239,68,68,.3)" }}>
          {msg}
        </p>
      )}
      <p className="text-[11px] text-center mt-4" style={{ color: "#6B7280" }}>
        🔒 Seus dados são privados · 5 vagas/mês
      </p>
    </form>
  );
}
