import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Code2,
  GitBranch,
  Heart,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { ProductShell } from "@/components/ProductShell";
import { fallbackProfiles } from "@/lib/client-utils";

const featuredProfiles = fallbackProfiles.slice(0, 3);
const selectedProfile = featuredProfiles[0];

const proofPoints = [
  { value: "5 min", label: "para revisar um perfil", icon: Search },
  { value: "92%", label: "de aderência média", icon: BadgeCheck },
  { value: "1 lugar", label: "para contexto e conversa", icon: MessageCircle },
];

const signalRows = [
  { label: "Stack principal", value: "React · Next.js", score: "Forte" },
  { label: "Experiência SaaS", value: "3 projetos", score: "Validado" },
  { label: "Disponibilidade", value: "Remoto", score: "Agora" },
];

export default function Home() {
  return (
    <ProductShell>
      <section className="ux-home" aria-labelledby="home-title">
        <div className="ux-hero-copy">
          <div className="ux-eyebrow">
            <span className="ux-live-dot" />
            Talent intelligence para times de produto
          </div>

          <h1 id="home-title">
            Contrate pela <span>evidência.</span>
            <br />
            Conecte pelo contexto.
          </h1>

          <p className="ux-hero-description">
            DevMatch transforma portfólio, stack e compatibilidade em uma experiência de contratação objetiva — do primeiro sinal técnico até a conversa.
          </p>

          <div className="ux-hero-actions">
            <Link className="ux-primary-cta" href="/contratante">
              Explorar talentos
              <ArrowRight className="size-4" />
            </Link>
            <Link className="ux-secondary-cta" href="/dev">
              <Code2 className="size-4" />
              Criar perfil dev
            </Link>
          </div>

          <div className="ux-proof-grid" aria-label="Indicadores do produto">
            {proofPoints.map((item) => {
              const Icon = item.icon;

              return (
                <div className="ux-proof-card" key={item.label}>
                  <span className="ux-proof-icon">
                    <Icon className="size-4" />
                  </span>
                  <span>
                    <strong>{item.value}</strong>
                    <small>{item.label}</small>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="ux-product-demo" aria-label="Prévia do fluxo de contratação">
          <div className="ux-demo-topbar">
            <div>
              <span className="ux-demo-kicker">Pipeline ativo</span>
              <strong>Front-end Product Engineer</strong>
            </div>
            <span className="ux-demo-count">12 talentos</span>
          </div>

          <div className="ux-demo-layout">
            <div className="ux-candidate-stack" aria-label="Talentos em destaque">
              <div className="ux-search-box">
                <Search className="size-4" />
                <span>Buscar por stack, projeto ou senioridade</span>
                <kbd>⌘ K</kbd>
              </div>

              <div className="ux-filter-row" aria-label="Filtros ativos">
                <span className="is-active">React</span>
                <span>Next.js</span>
                <span>TypeScript</span>
                <span>Remoto</span>
              </div>

              <div className="ux-profile-list">
                {featuredProfiles.map((profile, index) => (
                  <Link
                    className={`ux-profile-item ${index === 0 ? "is-selected" : ""}`}
                    href="/contratante"
                    key={profile.id}
                  >
                    <span className="ux-profile-avatar">
                      <Image
                        alt={`Foto de ${profile.name}`}
                        className="h-full w-full object-cover"
                        height={56}
                        src={profile.avatar}
                        unoptimized
                        width={56}
                      />
                      {index === 0 ? <span className="ux-online-dot" /> : null}
                    </span>
                    <span className="ux-profile-copy">
                      <strong>{profile.name}</strong>
                      <small>{profile.role}</small>
                    </span>
                    <span className="ux-match-score">{profile.compatibility.score}%</span>
                  </Link>
                ))}
              </div>

              <Link className="ux-list-link" href="/contratante">
                Ver pipeline completo
                <ArrowRight className="size-4" />
              </Link>
            </div>

            {selectedProfile ? (
              <article className="ux-focus-card">
                <div className="ux-focus-photo">
                  <Image
                    alt={`Foto de ${selectedProfile.name}`}
                    className="h-full w-full object-cover"
                    height={540}
                    src={selectedProfile.avatar}
                    unoptimized
                    width={520}
                  />
                  <span className="ux-focus-gradient" />
                  <span className="ux-focus-badge">
                    <BadgeCheck className="size-4" />
                    {selectedProfile.compatibility.score}% compatível
                  </span>
                  <span className="ux-focus-identity">
                    <strong>{selectedProfile.name}</strong>
                    <small>{selectedProfile.role}</small>
                  </span>
                </div>

                <div className="ux-focus-content">
                  <div className="ux-focus-heading">
                    <div>
                      <span>Sinais de aderência</span>
                      <strong>Decisão com contexto</strong>
                    </div>
                    <span className="ux-verified-chip">
                      <ShieldCheck className="size-4" />
                      Verificado
                    </span>
                  </div>

                  <div className="ux-signal-list">
                    {signalRows.map((row) => (
                      <div className="ux-signal-row" key={row.label}>
                        <span>
                          <small>{row.label}</small>
                          <strong>{row.value}</strong>
                        </span>
                        <em>{row.score}</em>
                      </div>
                    ))}
                  </div>

                  <div className="ux-stack-row">
                    {selectedProfile.stack.slice(0, 4).map((skill: string) => (
                      <span key={skill}>{skill}</span>
                    ))}
                  </div>

                  <div className="ux-decision-row">
                    <button aria-label="Revisar perfil depois" className="ux-pass-button" type="button">
                      <GitBranch className="size-4" />
                      Revisar depois
                    </button>
                    <Link className="ux-match-button" href="/contratante">
                      <Heart className="size-4" />
                      Criar match
                    </Link>
                  </div>
                </div>
              </article>
            ) : null}
          </div>
        </div>

        <div className="ux-role-strip">
          <div className="ux-role-intro">
            <Sparkles className="size-5" />
            <span>
              <small>Dois lados. Um fluxo.</small>
              <strong>Entre no workspace certo.</strong>
            </span>
          </div>

          <Link className="ux-role-entry" href="/contratante">
            <span className="ux-role-icon">
              <BriefcaseBusiness className="size-5" />
            </span>
            <span>
              <strong>Sou contratante</strong>
              <small>Triagem, shortlist e matches</small>
            </span>
            <ArrowRight className="size-4" />
          </Link>

          <Link className="ux-role-entry" href="/dev">
            <span className="ux-role-icon is-dev">
              <Code2 className="size-5" />
            </span>
            <span>
              <strong>Sou desenvolvedor</strong>
              <small>Perfil, portfólio e oportunidades</small>
            </span>
            <ArrowRight className="size-4" />
          </Link>

          <div className="ux-role-network">
            <Users className="size-5" />
            <span>
              <strong>Rede qualificada</strong>
              <small>Perfis e vagas no mesmo contexto</small>
            </span>
          </div>
        </div>
      </section>
    </ProductShell>
  );
}
