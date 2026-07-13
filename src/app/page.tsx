import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, BriefcaseBusiness, Code2, PanelTop, Search } from "lucide-react";
import { ProductShell } from "@/components/ProductShell";
import { DevMatchLogo } from "@/components/DevMatchLogo";
import { fallbackProfiles } from "@/lib/client-utils";

const featuredProfiles = fallbackProfiles.slice(0, 3);
const previewFilters = ["React", "Next.js", "Sênior", "Remoto"];

const workflow = [
  {
    title: "Entrada por papel",
    text: "Cada conta acessa somente o workspace correto.",
  },
  {
    title: "Triagem objetiva",
    text: "Stack, projeto, senioridade e aderência ficam juntos.",
  },
  {
    title: "Conversa registrada",
    text: "A conversa nasce do match e mantém o contexto.",
  },
];

const rolePaths = [
  {
    href: "/contratante",
    title: "Contratante",
    text: "Revisar candidatos, montar shortlist e abrir conversas.",
    action: "Abrir pipeline",
    icon: BriefcaseBusiness,
    primary: true,
  },
  {
    href: "/dev",
    title: "Dev",
    text: "Gerenciar portfólio, stack, GitHub e conversas abertas.",
    action: "Abrir console",
    icon: Code2,
    primary: false,
  },
];

export default function Home() {
  const selectedProfile = featuredProfiles[0];

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
              workspace ativo
            </span>
          </div>

          <div className="mt-10 max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#675f55]">
              Plataforma de hiring para times técnicos
            </p>
            <h1 className="mt-3 text-5xl font-black leading-[0.94] tracking-[-0.04em] text-[#111111] sm:text-6xl">
              Um pipeline limpo para avaliar devs com contexto.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-[#4a4640]">
              DevMatch separa contratante e dev, organiza sinais técnicos e leva o match para uma conversa objetiva.
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
            <Link className="home-chat-shortcut" href="/feed">
              <PanelTop className="size-4" />
              Ver feed de vagas e publicações
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="mt-6 grid gap-2 sm:grid-cols-3">
            <HomeMetric label="candidatos" value="5" />
            <HomeMetric label="matches" value="2" />
            <HomeMetric label="conversa ativa" value="1" />
          </div>
        </div>

        <div className="home-product-preview">
          <div className="home-preview-toolbar">
            <span className="flex items-center gap-2 text-sm font-black text-white">
              <PanelTop className="size-4 text-cyan-200" />
              Visão do workspace
            </span>
            <Link className="text-xs font-black text-cyan-100" href="/feed">
              Abrir feed
            </Link>
          </div>

          <div className="home-preview-grid">
            <section className="home-preview-main">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Pipeline</p>
                  <h2 className="mt-1 text-2xl font-black text-white">Shortlist técnica</h2>
                </div>
                <span className="rounded-full bg-cyan-300 px-3 py-1 text-xs font-black text-[#111111]">
                  pronto
                </span>
              </div>

              <div className="mt-4 grid gap-3">
                <div className="home-preview-search">
                  <Search className="size-4 text-slate-500" />
                  <span>Buscar candidato, stack ou projeto</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {previewFilters.map((filter) => (
                    <span className="home-filter-chip" key={filter}>{filter}</span>
                  ))}
                </div>
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
                  Requisição ativa
                </div>
                <p className="mt-3 text-sm leading-6 text-[#4a4640]">
                  Front-end SaaS, React, Next.js, TypeScript e colaboração remota.
                </p>
              </div>

              {selectedProfile ? (
                <div className="home-candidate-detail">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Candidato em foco</p>
                  <div className="mt-3 flex items-center gap-3">
                    <Image alt="" className="size-12 rounded-xl object-cover" height={48} src={selectedProfile.avatar} width={48} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-black text-white">{selectedProfile.name}</span>
                      <span className="block truncate text-xs text-cyan-100">{selectedProfile.role}</span>
                    </span>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-slate-400">{selectedProfile.compatibility.reasons[0]}.</p>
                </div>
              ) : null}

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

              <Link className="home-chat-card" href="/feed">
                <span className="grid size-10 place-items-center rounded-lg bg-cyan-300 text-[#111111]">
                  <PanelTop className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-black text-white">Feed da rede</span>
                  <span className="block truncate text-xs text-slate-400">Vagas, posts, links e portfólio</span>
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
