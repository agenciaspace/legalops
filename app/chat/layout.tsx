import type { Metadata } from "next";
import "./chat.css";
export const metadata: Metadata = {
  title: {
    default: "legalops.chat — sua equipe de agentes jurídicos",
    template: "%s · legalops.chat",
  },
  description:
    "Configure uma equipe de agentes com seus documentos, modelos e políticas. Acompanhe análises de contratos com fontes e revisão humana.",
  openGraph: {
    title: "legalops.chat",
    description:
      "Uma equipe de agentes trabalhando com o contexto do seu jurídico.",
    locale: "pt_BR",
    type: "website",
  },
};
export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="chat-product">{children}</div>;
}
