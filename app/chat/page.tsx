import { BrandWordmark } from "@/components/BrandLogo";
import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  Check,
  FileText,
  LockKeyhole,
  MoveRight,
} from "lucide-react";
import { CHAT_AGENTS } from "@/lib/chat/model";
import LandingDemo from "./LandingDemo";
import { ClubHeader } from "@/components/ClubHeader";

const start = "https://legalops.club/chat/workspace";
export default function ChatLanding() {
  return (
    <>
      <ClubHeader
        product="chat"
        navigation={[
          { href: "#como-funciona", label: "Como funciona" },
          { href: "#equipe", label: "Os agentes" },
          { href: start, label: "Entrar", action: true },
        ]}
      />
      <main>
        <section className="chat-hero chat-container">
          <div className="chat-hero-copy">
            <p className="chat-eyebrow">
              <span className="chat-live-dot" /> PILOTO ABERTO · ESCRITÓRIOS E
              JURÍDICOS
            </p>
            <h1>
              seu jurídico.
              <br />
              seus dados.
              <br />
              <span>uma equipe de agentes.</span>
            </h1>
            <p className="chat-hero-description">
              Especialistas que trabalham juntos, com os seus documentos, as
              suas regras e o contexto de cada demanda.
            </p>
            <div className="chat-actions">
              <Link href={start} className="brand-action chat-button">
                Montar minha equipe <ArrowUpRight size={18} />
              </Link>
              <a href="#exemplo" className="chat-text-link">
                Ver uma análise em conjunto <ArrowRight size={16} />
              </a>
            </div>
            <p className="chat-subtle">
              Comece com contratos. Importe sua base e acompanhe cada etapa.
            </p>
          </div>
          <div
            className="chat-hero-system"
            aria-label="Ilustração da coordenação dos agentes"
          >
            <div className="chat-system-top">
              <span>SEU ESPAÇO DE TRABALHO</span>
              <LockKeyhole size={14} />
            </div>
            <div className="chat-system-request">
              <span className="chat-file-icon">
                <FileText size={21} />
              </span>
              <div>
                <strong>Uma nova demanda</strong>
                <p>Minuta + modelos + políticas</p>
              </div>
              <span className="chat-tiny-label">ENTRADA</span>
            </div>
            <div className="chat-system-connector" />
            <div className="chat-system-agents">
              {CHAT_AGENTS.slice(0, 3).map((agent, i) => (
                <div key={agent.key}>
                  <span className={`chat-agent-avatar tone-${i}`}>
                    {agent.initials}
                  </span>
                  <strong>{agent.name}</strong>
                  <span>Contexto compartilhado</span>
                </div>
              ))}
            </div>
            <div className="chat-system-connector" />
            <div className="chat-system-coordinator">
              <span className="chat-agent-avatar dark">CD</span>
              <div>
                <strong>Coordenação</strong>
                <p>Análises conectadas. Próximos passos claros.</p>
              </div>
            </div>
            <div className="chat-system-review">
              <Check size={15} />
              <span>A decisão continua com você.</span>
            </div>
            <p className="chat-illustration-note">
              Fluxo ilustrativo da equipe
            </p>
          </div>
        </section>
        <div className="chat-principles">
          <div className="chat-container">
            <span>Contexto da sua organização</span>
            <span>Fontes em cada análise</span>
            <span>Trabalho com continuidade</span>
            <span>Revisão humana</span>
          </div>
        </div>
        <section id="como-funciona" className="chat-container chat-section">
          <div className="chat-section-heading">
            <p className="chat-eyebrow">DO SEU CONTEXTO À PRIMEIRA ENTREGA</p>
            <h2>
              uma equipe que começa
              <br />
              pelo seu jeito de trabalhar.
            </h2>
          </div>
          <div className="chat-process">
            {[
              {
                title: "Conte quem você é.",
                text: "Escritório ou departamento jurídico? Configure sua atuação, o tamanho da equipe e o que precisa resolver.",
              },
              {
                title: "Traga sua base.",
                text: "Importe modelos, políticas e referências. Confira o texto extraído e escolha o que entra em cada análise.",
              },
              {
                title: "Coloque o trabalho em movimento.",
                text: "Abra uma demanda, anexe a minuta e acompanhe os especialistas até a sua revisão.",
              },
            ].map((item, i) => (
              <article key={item.title}>
                <span className="chat-process-number">0{i + 1}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>
        <section id="exemplo" className="chat-demo-section">
          <div className="chat-container">
            <div className="chat-section-heading">
              <p className="chat-eyebrow">UM TRABALHO. DIFERENTES OLHARES.</p>
              <h2>
                veja como a equipe
                <br />
                analisa um contrato.
              </h2>
              <p>
                Explore um exemplo fictício. Na sua organização, os agentes usam
                os documentos que você selecionar.
              </p>
            </div>
            <LandingDemo />
          </div>
        </section>
        <section id="equipe" className="chat-container chat-section">
          <div className="chat-section-heading">
            <p className="chat-eyebrow">
              ESPECIALISTAS COM RESPONSABILIDADES CLARAS
            </p>
            <h2>
              cada agente com uma missão.
              <br />
              todos no mesmo assunto.
            </h2>
          </div>
          <div className="chat-agent-list">
            {CHAT_AGENTS.map((agent, i) => (
              <article key={agent.key}>
                <span className={`chat-agent-avatar tone-${i}`}>
                  {agent.initials}
                </span>
                <h3>{agent.name}</h3>
                <p>{agent.description}</p>
                <MoveRight size={20} />
              </article>
            ))}
          </div>
        </section>
        <section className="chat-audience-section">
          <div className="chat-container chat-audience-grid">
            <div>
              <p className="chat-eyebrow">DOIS CONTEXTOS. A SUA OPERAÇÃO.</p>
              <h2>
                feito para quem
                <br />
                entrega e organiza
                <br />o trabalho jurídico.
              </h2>
            </div>
            <div>
              <article>
                <span className="chat-eyebrow">01 / ESCRITÓRIOS</span>
                <h3>O contexto de cada cliente, preservado.</h3>
                <p>
                  Abra demandas privadas, use seus modelos e prepare a revisão
                  com documentos e decisões reunidos no mesmo lugar.
                </p>
              </article>
              <article>
                <span className="chat-eyebrow">
                  02 / DEPARTAMENTOS JURÍDICOS
                </span>
                <h3>Suas políticas entram na conversa.</h3>
                <p>
                  Organize solicitações, compare minutas e registre orientações
                  que poderão apoiar as próximas análises da equipe.
                </p>
              </article>
            </div>
          </div>
        </section>
        <section className="chat-container chat-section chat-memory">
          <div className="chat-section-heading">
            <p className="chat-eyebrow">O CONHECIMENTO CONTINUA</p>
            <h2>
              cada decisão pode
              <br />
              melhorar o próximo trabalho.
            </h2>
            <p>
              Corrija a análise e registre sua decisão. O administrador pode
              transformar uma orientação em memória compartilhada para as
              próximas demandas. Você escolhe o que vira regra e pode remover
              essa orientação depois.
            </p>
          </div>
          <div className="chat-memory-example">
            <p className="chat-eyebrow">EXEMPLO DE ORIENTAÇÃO APROVADA</p>
            <blockquote>
              “Nas próximas minutas de fornecedores, sinalize renovação
              automática para nossa revisão.”
            </blockquote>
            <div>
              <Check size={16} /> Salva por uma pessoa. Consultada pela equipe.
            </div>
          </div>
        </section>
        <section className="chat-container chat-faq">
          <h2>antes de começar.</h2>
          {[
            [
              "O que já posso usar?",
              "O piloto inclui configuração da organização, importação de arquivos, demandas de contratos, quatro agentes coordenados, fontes, decisão humana e orientações compartilhadas. São até cinco análises por dia por organização.",
            ],
            [
              "Quais arquivos posso importar?",
              "PDFs com texto, DOCX, TXT, Markdown e CSV. Até 8 MB por arquivo, 80 páginas por PDF e 120 mil caracteres de texto. PDFs digitalizados precisam passar por OCR antes da importação.",
            ],
            [
              "Os agentes leem o documento inteiro?",
              "A análise seleciona até 20 trechos dos documentos escolhidos, conforme o contexto da demanda. O resultado mostra os trechos usados e a cobertura. É uma análise assistida por trechos, que precisa da revisão do responsável.",
            ],
            [
              "Como funcionam os dados e o acesso?",
              "Cada organização tem seu espaço. A base compartilhada fica disponível aos seus membros; demandas são privadas por padrão e podem ser compartilhadas com a organização. Os trechos selecionados são processados por um provedor externo de IA.",
            ],
            [
              "A equipe envia ou assina documentos?",
              "Nesta versão, a equipe prepara análises e propostas de ajuste. A decisão é registrada por uma pessoa. Envio de emails, assinaturas e integrações com sistemas externos ficam para etapas futuras.",
            ],
          ].map(([q, a]) => (
            <details key={q}>
              <summary>
                {q}
                <span>+</span>
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </section>
        <section className="chat-container chat-final-cta">
          <p className="chat-eyebrow">SEU PRÓXIMO CONTRATO PODE COMEÇAR AQUI</p>
          <h2>
            monte sua equipe.
            <br />
            traga seu contexto.
          </h2>
          <Link href={start} className="brand-action chat-button">
            Começar meu espaço <ArrowUpRight size={18} />
          </Link>
        </section>
      </main>
      <footer className="chat-footer chat-container">
        <BrandWordmark suffix="chat" />
        <p>Uma ferramenta do ecossistema legalops.</p>
        <nav aria-label="Ecossistema">
          <a href="https://legalops.club">
            club <ArrowUpRight size={12} />
          </a>
          <a href="https://legalops.dev">
            dev <ArrowUpRight size={12} />
          </a>
          <a href="https://legalops.club/news">
            news <ArrowUpRight size={12} />
          </a>
        </nav>
      </footer>
    </>
  );
}
