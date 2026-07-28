import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Code2, MessageCircle, PanelTop, UserRoundSearch } from "lucide-react";
import { ProductShell } from "@/components/ProductShell";

const rolePaths = [
  {
    href: "/contratante",
    eyebrow: "Para empresas",
    title: "Quero contratar devs",
    text: "Veja candidatos, filtre por tecnologia e sinalize quem você quer conhecer.",
    action: "Encontrar desenvolvedores",
    icon: BriefcaseBusiness,
  },
  {
    href: "/dev",
    eyebrow: "Para desenvolvedores",
    title: "Quero uma oportunidade",
    text: "Monte seu perfil técnico, conecte seu GitHub e deixe seu trabalho falar por você.",
    action: "Criar meu perfil",
    icon: Code2,
  },
];

const steps = [
  {
    icon: UserRoundSearch,
    title: "Escolha como vai usar",
    text: "Empresa ou dev. Você faz essa escolha uma vez e o menu se adapta à sua conta.",
  },
  {
    icon: PanelTop,
    title: "Faça só o que importa",
    text: "Empresa avalia perfis. Dev completa perfil e portfólio. Sem menus que não servem para você.",
  },
  {
    icon: MessageCircle,
    title: "Converse quando houver interesse",
    text: "O match vira conversa com o contexto do perfil e da oportunidade no mesmo lugar.",
  },
];

export default function Home() {
  return (
    <ProductShell>
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
        <div className="product-frame p-5 sm:p-8 lg:p-10">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-100">Comece por aqui</p>
          <h1 className="mt-4 max-w-3xl text-5xl font-black leading-[0.92] text-white sm:text-6xl">
            O que você quer fazer hoje?
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
            Escolha seu objetivo e o DevMatch mostra só as ferramentas que fazem sentido para você.
          </p>

          <div className="mt-8 grid gap-3">
            {rolePaths.map((role) => {
              const Icon = role.icon;
              return (
                <Link
                  className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.055] p-4 transition hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.09] sm:p-5"
                  href={role.href}
                  key={role.href}
                >
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-white/10 text-cyan-100 sm:size-14">
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">{role.eyebrow}</span>
                    <span className="mt-1 block text-lg font-black text-white sm:text-xl">{role.title}</span>
                    <span className="mt-1 block max-w-xl text-sm leading-6 text-slate-400">{role.text}</span>
                  </span>
                  <span className="hidden shrink-0 items-center gap-2 text-sm font-black text-white sm:flex">
                    {role.action}
                    <ArrowRight className="size-4 transition group-hover:translate-x-1" />
                  </span>
                </Link>
              );
            })}
          </div>

          <Link className="mt-5 inline-flex items-center gap-2 text-sm font-black text-slate-300 hover:text-white" href="/feed">
            <PanelTop className="size-4" />
            Só quero explorar vagas e publicações
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <aside className="product-frame p-5 sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Como funciona</p>
          <h2 className="mt-3 text-3xl font-black leading-tight text-white">Três passos. Sem precisar aprender o app.</h2>

          <div className="mt-7 space-y-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div className="flex gap-4 rounded-xl border border-white/10 bg-white/[0.04] p-4" key={step.title}>
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-cyan-300 text-[#111111]">
                    <Icon className="size-4" />
                  </span>
                  <span>
                    <span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Passo {index + 1}</span>
                    <span className="mt-1 block text-sm font-black text-white">{step.title}</span>
                    <span className="mt-1 block text-sm leading-6 text-slate-400">{step.text}</span>
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-5 rounded-xl border border-cyan-300/15 bg-cyan-300/[0.06] p-4">
            <p className="text-sm font-black text-cyan-100">Você não precisa escolher Empresa/Dev de novo depois de entrar.</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">A navegação passa a seguir automaticamente o tipo da sua conta.</p>
          </div>
        </aside>
      </section>
    </ProductShell>
  );
}
