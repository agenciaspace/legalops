"use client";
import { useState } from "react";
import { CHAT_AGENTS } from "@/lib/chat/model";
import { ArrowRight, FileText } from "lucide-react";
const examples = [
  {
    summary: "Antes da análise, organizar o que precisamos saber.",
    finding:
      "Falta confirmar a área responsável pela contratação e a data prevista de início.",
    action: "Solicitar essas informações à pessoa que abriu a demanda.",
    source:
      "Solicitação: “Revisar o contrato do novo fornecedor de tecnologia.”",
  },
  {
    summary: "A minuta e o modelo usam prazos diferentes.",
    finding:
      "A minuta prevê renovação automática. O modelo interno prevê renovação mediante acordo escrito.",
    action:
      "Propor ajuste da cláusula de renovação para revisão do responsável.",
    source:
      "Modelo interno, cláusula 7: “A renovação dependerá de acordo escrito entre as partes.”",
  },
  {
    summary: "Uma condição interna precisa entrar na revisão.",
    finding:
      "O escopo menciona dados pessoais. A política fornecida pede avaliação do responsável por privacidade.",
    action: "Encaminhar o tema ao responsável antes de concluir a contratação.",
    source:
      "Política interna: “Contratações com tratamento de dados pessoais devem passar pela avaliação de privacidade.”",
  },
  {
    summary: "Os especialistas reuniram três próximos passos.",
    finding:
      "Confirmar o contexto, revisar a renovação e obter a avaliação de privacidade.",
    action:
      "O responsável humano revisa os apontamentos e registra sua decisão.",
    source: "Consolidação dos agentes de triagem, contratos e políticas.",
  },
];
export default function LandingDemo() {
  const [selected, setSelected] = useState(0);
  const current = examples[selected];
  return (
    <div className="chat-demo">
      <div className="chat-demo-toolbar">
        <span>
          <FileText size={15} /> Contrato de fornecedor
        </span>
        <span className="chat-tag">EXEMPLO FICTÍCIO</span>
      </div>
      <div className="chat-demo-layout">
        <div
          role="tablist"
          aria-label="Etapas do exemplo"
          className="chat-demo-tabs"
        >
          {CHAT_AGENTS.map((a, i) => (
            <button
              type="button"
              key={a.key}
              role="tab"
              id={`demo-tab-${a.key}`}
              aria-controls="demo-panel"
              aria-selected={i === selected}
              tabIndex={i === selected ? 0 : -1}
              onKeyDown={(event) => {
                if (
                  ["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft"].includes(
                    event.key,
                  )
                ) {
                  event.preventDefault();
                  const next =
                    (selected +
                      (["ArrowDown", "ArrowRight"].includes(event.key)
                        ? 1
                        : 3)) %
                    4;
                  setSelected(next);
                  document
                    .getElementById(`demo-tab-${CHAT_AGENTS[next].key}`)
                    ?.focus();
                }
              }}
              onClick={() => setSelected(i)}
            >
              <span className="chat-agent-avatar">{a.initials}</span>
              <span>
                {a.name}
                <small>0{i + 1} / 04</small>
              </span>
              <ArrowRight size={15} />
            </button>
          ))}
        </div>
        <div
          role="tabpanel"
          id="demo-panel"
          aria-labelledby={`demo-tab-${CHAT_AGENTS[selected].key}`}
          className="chat-demo-panel"
        >
          <p className="chat-eyebrow">
            {CHAT_AGENTS[selected].name.toUpperCase()} · ANÁLISE ILUSTRATIVA
          </p>
          <h3>{current.summary}</h3>
          <p>{current.finding}</p>
          <blockquote>{current.source}</blockquote>
          <div className="chat-demo-next">
            <span>PRÓXIMO PASSO</span>
            <p>{current.action}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
