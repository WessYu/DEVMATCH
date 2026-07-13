import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, BriefcaseBusiness, Code2, MessageCircle, Sparkles } from "lucide-react";
import { ProductShell } from "@/components/ProductShell";
import { DevMatchLogo } from "@/components/DevMatchLogo";
import { fallbackProfiles } from "@/lib/client-utils";

const featuredProfiles = fallbackProfiles.slice(0, 3);

const workflow = [
  {
    title: "Escolha o lado",
    text: "Empresa busca talentos. Dev monta o perfil.",
  },
  {
    title: "Faça o match",
    text: "O deck organiza stack, projeto e aderencia.",
  },
  {
    title: "Converse",
    text: "O chat abre com contexto da vaga e do portfolio.",
  },
];

const rolePaths = [
  {
    href: "/contratante",
    title: "Sou contratante",
    text: "Quero ver devs, filtrar stack e abrir matches.",
    action: "Buscar devs",
    icon: BriefcaseBusiness,
    primary: true,
  },
  {
    href: "/dev",
    title: "Sou dev",
    text: "Quero montar meu perfil e conectar meu GitHub.",
    action: "Criar perfil",
    icon: Code2,
    primary: false,
  },
];

export default function Home() {
  return (
    <ProductShell>
      <section className="home-stage product-frame">
        <div className="home-hero-panel">
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#111111]/10 px-3 py-1 text-xs font-black">
              <DevMatchLogo className="size-5" />
              DevMatch
            </div>
            <span className="rounded-full bg-[#111111] px-3 py-1 text-xs font-black text-white">
              beta privado
            </span>
          </div>

          <div className="mt-12 max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#675f55]">
              Comece escolhendo seu lado
            </p>
            <h1 className="mt-3 text-5xl font-black leading-[0.9] tracking-[-0.04em] text-[#111111] sm:text-7xl">
              Contrate ou seja encontrado pelo que voce entrega.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-[#4a4640]">
              Empresas entram no deck de candidatos. Devs montam um perfil com portfolio e repositorios. O match leva direto para conversa.
            </p>
          </div>

          <div className="mt-8 grid gap-3">
            {rolePaths.map((role) => {
              const Icon = role.icon;

              return (
                <Link className={`home-role-card ${role.primary ? "is-primary" : ""}`} href={role.href} key={role.href}>
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#111111] text-white">
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-lg font-black text-[#111111]">{role.title}</span>
                    <span className="mt-1 block text-sm leading-6 text-[#4a4640]">{role.text}</span>
                  </span>
                  <span className="home-role-action">
                    {role.action}
                    <ArrowRight className="size-4" />
                  </span>
                </Link>
              );
            })}
            <Link className="home-chat-shortcut" href="/chat">
              <MessageCircle className="size-4" />
              Ja tenho match e quero abrir o chat
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="mt-auto grid gap-2 pt-8 sm:grid-cols-3">
            <HomeMetric label="passo 1" value="Escolha" />
            <HomeMetric label="passo 2" value="Match" />
            <HomeMetric label="passo 3" value="Chat" />
          </div>
        </div>

        <div className="home-product-preview">
          <div className="home-preview-toolbar">
            <span className="flex items-center gap-2 text-sm font-black text-white">
              <Sparkles className="size-4 text-cyan-200" />
              Visao geral do fluxo
            </span>
            <Link className="text-xs font-black text-cyan-100" href="/chat">
              Abrir chat
            </Link>
          </div>

          <div className="home-preview-grid">
            <section className="home-preview-main">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Para contratantes</p>
                  <h2 className="mt-1 text-2xl font-black text-white">Deck de devs pronto para avaliar</h2>
                </div>
                <span className="rounded-full bg-cyan-300 px-3 py-1 text-xs font-black text-[#111111]">
                  5 perfis
                </span>
              </div>

              <div className="mt-5 grid gap-3">
                {featuredProfiles.map((profile) => (
                  <Link className="home-profile-row" href="/contratante" key={profile.id}>
                    <Image alt={`Foto de ${profile.name}`} className="size-14 rounded-xl object-cover" height={56} src={profile.avatar} width={56} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-black text-white">{profile.name}</span>
                      <span className="mt-1 block truncate text-xs text-slate-400">{profile.role}</span>
                    </span>
                    <span className="rounded-full border border-white/10 px-2 py-1 text-xs font-black text-cyan-100">
                      {profile.compatibility.score}%
                    </span>
                  </Link>
                ))}
              </div>
            </section>

            <aside className="home-preview-side">
              <div className="rounded-xl bg-[#f4f1eb] p-4 text-[#111111]">
                <div className="flex items-center gap-2 text-sm font-black">
                  <BriefcaseBusiness className="size-4" />
                  Vaga em foco
                </div>
                <p className="mt-3 text-sm leading-6 text-[#4a4640]">
                  Front-end SaaS com React, Next.js, TypeScript e produto B2B.
                </p>
              </div>

              <div className="space-y-2">
                {workflow.map((item, index) => (
                  <div className="home-step" key={item.title}>
                    <span className="grid size-7 place-items-center rounded-full bg-white/10 text-xs font-black text-cyan-100">
                      {index + 1}
                    </span>
                    <span>
                      <span className="block text-sm font-black text-white">{item.title}</span>
                      <span className="block text-xs leading-5 text-slate-400">{item.text}</span>
                    </span>
                  </div>
                ))}
              </div>

              <Link className="home-chat-card" href="/chat">
                <span className="grid size-10 place-items-center rounded-lg bg-cyan-300 text-[#111111]">
                  <MessageCircle className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-black text-white">Conversa aberta</span>
                  <span className="block truncate text-xs text-slate-400">Match com contexto do projeto</span>
                </span>
                <BadgeCheck className="size-4 text-cyan-100" />
              </Link>
            </aside>
          </div>
        </div>
      </section>
    </ProductShell>
  );
}

function HomeMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#111111]/10 bg-white/45 p-4">
      <p className="text-2xl font-black text-[#111111]">{value}</p>
      <p className="mt-1 text-[11px] font-black uppercase tracking-[0.14em] text-[#665f55]">{label}</p>
    </div>
  );
}
