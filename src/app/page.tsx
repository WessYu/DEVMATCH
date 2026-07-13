import Link from "next/link";
import { BriefcaseBusiness, Code2, MessageCircle } from "lucide-react";
import { ProductShell } from "@/components/ProductShell";
import { DevMatchLogo } from "@/components/DevMatchLogo";

const entryCards = [
  {
    href: "/contratante",
    title: "Area do contratante",
    text: "Deck de devs com filtro por stack, projetos, codigo e matches.",
    icon: BriefcaseBusiness,
  },
  {
    href: "/dev",
    title: "Area do dev",
    text: "Perfil publico, portfolio, stack e importacao de repositorios.",
    icon: Code2,
  },
  {
    href: "/chat",
    title: "Chat",
    text: "Conversas entre empresa e dev depois do match.",
    icon: MessageCircle,
  },
];

export default function Home() {
  return (
    <ProductShell>
      <section className="product-frame overflow-hidden">
        <div className="grid gap-3 p-3 lg:grid-cols-[0.9fr_1.1fr] lg:p-4">
          <div className="rounded-xl bg-[#f4f1eb] p-6 text-[#111111] sm:p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#111111]/10 px-3 py-1 text-xs font-semibold">
              <DevMatchLogo className="size-5" />
              DevMatch
            </div>
            <p className="mt-8 text-sm font-semibold uppercase tracking-[0.18em] text-[#5d5750]">
              Contratacao tecnica
            </p>
            <h1 className="mt-3 max-w-xl text-5xl font-black leading-[0.92] tracking-[-0.04em] sm:text-6xl">
              Um produto para contratar pelo que foi entregue.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-[#4a4640]">
              Separei a experiencia por papel: empresa encontra devs, dev cuida do perfil e o chat centraliza as conversas.
            </p>
          </div>

          <div className="grid gap-3">
            {entryCards.map((card) => {
              const Icon = card.icon;

              return (
                <Link className="home-entry-card" href={card.href} key={card.href}>
                  <span className="grid size-12 place-items-center rounded-xl bg-cyan-300 text-[#111111]">
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xl font-black text-white">{card.title}</span>
                    <span className="mt-1 block text-sm leading-6 text-slate-400">{card.text}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </ProductShell>
  );
}
