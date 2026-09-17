// Open editorial framework. Requirements are evaluated in the company context.
export const criteria = [
  {
    "id": "workflow",
    "group": "Operação contratual",
    "name": "Workflows e aprovações",
    "question": "Quanto importa automatizar solicitações, alçadas e exceções?",
    "test": "Execute duas alçadas, uma exceção e substituição de aprovador. Meça configuração e trabalho manual."
  },
  {
    "id": "salesforce",
    "group": "Integrações",
    "name": "Integração Salesforce",
    "question": "O Salesforce faz parte do fluxo comercial?",
    "test": "Crie pela Opportunity, altere um campo, acompanhe aprovação e devolva contrato e dados ao CRM. Confira permissões e falhas."
  },
  {
    "id": "playbook",
    "group": "IA e revisão",
    "name": "Criação e uso de playbooks",
    "question": "Quanto importa padronizar posições e alternativas de negociação?",
    "test": "Crie e atualize posições e fallbacks; aplique nos mesmos contratos e registre omissões e ajustes manuais."
  },
  {
    "id": "repository",
    "group": "Acervo e dados",
    "name": "Repositório e inteligência",
    "question": "Quanto importa consultar contratos e seus relacionamentos?",
    "test": "Relacione contrato principal e aditivos. Confira respostas com referência ao documento correto."
  },
  {
    "id": "intake",
    "group": "Operação contratual",
    "name": "Entrada e triagem de demandas",
    "question": "As solicitações precisam chegar completas e ao responsável certo?",
    "test": "Envie pedido incompleto, pedido urgente e pedido de outra área. Valide campos obrigatórios, SLA e responsável."
  },
  {
    "id": "templates",
    "group": "Operação contratual",
    "name": "Modelos e geração de documentos",
    "question": "A empresa precisa gerar contratos a partir de modelos?",
    "test": "Gere um contrato com cláusulas condicionais, anexos e dados obrigatórios; confira manutenção das versões do modelo."
  },
  {
    "id": "third_party",
    "group": "Operação contratual",
    "name": "Contratos de terceiros",
    "question": "Quanto do trabalho chega em papel da contraparte?",
    "test": "Receba DOCX e PDF externos e percorra revisão, aprovação, assinatura e arquivamento sem perder a origem."
  },
  {
    "id": "collaboration",
    "group": "Operação contratual",
    "name": "Negociação e controle de versões",
    "question": "Quantas pessoas e contrapartes revisam o mesmo documento?",
    "test": "Compare versões, comentários internos e externos, trilha de alterações e edição concorrente."
  },
  {
    "id": "signature",
    "group": "Integrações",
    "name": "Assinatura eletrônica",
    "question": "Quais provedores de assinatura precisam se conectar?",
    "test": "Use o provedor da empresa; teste signatários, ordem, recusa, reenvio, comprovantes e retorno do assinado."
  },
  {
    "id": "integrations",
    "group": "Integrações",
    "name": "ERP, CRM e ferramentas existentes",
    "question": "Quais sistemas já usados precisam conversar com o CLM?",
    "test": "Para cada integração obrigatória, registre sistema, edição, objetos, direção dos dados, conector e custo; demonstre ponta a ponta."
  },
  {
    "id": "api",
    "group": "Integrações",
    "name": "APIs, webhooks e extensibilidade",
    "question": "Há integrações próprias ou automações a construir?",
    "test": "Confira documentação, autenticação, sandbox, limites, paginação, versionamento e eventos necessários."
  },
  {
    "id": "identity",
    "group": "Integrações",
    "name": "Identidade e provisionamento",
    "question": "O CLM precisa acompanhar a gestão corporativa de usuários?",
    "test": "Teste login corporativo, entrada e saída de usuários, grupos, administradores e contas de integração."
  },
  {
    "id": "sync",
    "group": "Integrações",
    "name": "Operação das integrações",
    "question": "Quem resolve falhas de sincronização?",
    "test": "Interrompa uma integração no piloto; teste alerta, retentativa, deduplicação, reconciliação e dono do incidente."
  },
  {
    "id": "ai_quality",
    "group": "IA e revisão",
    "name": "Qualidade da revisão por IA",
    "question": "Quais erros de análise são aceitáveis no seu caso?",
    "test": "Use amostra com respostas de referência; registre falsos positivos, omissões, fontes e revisão humana necessária."
  },
  {
    "id": "ai_governance",
    "group": "IA e revisão",
    "name": "Governança e custo da IA",
    "question": "Como dados, aprovações e consumo de IA serão controlados?",
    "test": "Verifique uso de dados para treinamento, retenção, limites de agentes, aprovações humanas e cobrança por uso."
  },
  {
    "id": "languages",
    "group": "IA e revisão",
    "name": "Idiomas e contexto jurídico",
    "question": "Quais idiomas e práticas contratuais precisam funcionar?",
    "test": "Aplique a mesma bateria a contratos nos idiomas e contextos relevantes; revise termos e sugestões com o time jurídico."
  },
  {
    "id": "migration",
    "group": "Acervo e dados",
    "name": "Migração do legado",
    "question": "Quanto acervo precisa entrar, com que qualidade?",
    "test": "Migre lote representativo com anexos, permissões, duplicatas e metadados; estime esforço de saneamento."
  },
  {
    "id": "extraction",
    "group": "Acervo e dados",
    "name": "OCR e extração de metadados",
    "question": "O acervo inclui digitalizações ou documentos pouco estruturados?",
    "test": "Confira campos extraídos em arquivos nativos e digitalizados; meça correções manuais e custo por documento."
  },
  {
    "id": "obligations",
    "group": "Acervo e dados",
    "name": "Obrigações e renovações",
    "question": "Quais compromissos precisam de acompanhamento após assinar?",
    "test": "Cadastre aviso prévio, reajuste, renovação e obrigação; teste alertas, responsáveis, escalonamento e encerramento."
  },
  {
    "id": "analytics",
    "group": "Acervo e dados",
    "name": "Relatórios e indicadores",
    "question": "Quais decisões dependem dos dados contratuais?",
    "test": "Reproduza os indicadores do jurídico e exporte os dados; confira filtros, atualização, campos e acesso por área."
  },
  {
    "id": "portability",
    "group": "Acervo e dados",
    "name": "Portabilidade e saída",
    "question": "É possível sair com documentos, dados e histórico?",
    "test": "Exporte amostra com anexos, relações e trilha. Confira formatos, limites, prazo e custo de saída no contrato."
  },
  {
    "id": "permissions",
    "group": "Segurança e governança",
    "name": "Permissões e segregação",
    "question": "Quem pode ver e alterar cada tipo de contrato?",
    "test": "Teste acesso por área, entidade e sensibilidade com perfis distintos, incluindo convidado e usuário desligado."
  },
  {
    "id": "audit",
    "group": "Segurança e governança",
    "name": "Auditoria e rastreabilidade",
    "question": "Quais ações precisam ser comprovadas depois?",
    "test": "Recupere quem leu, editou, aprovou e exportou; confira integridade, retenção e exportação dos registros."
  },
  {
    "id": "privacy",
    "group": "Segurança e governança",
    "name": "Privacidade e segurança",
    "question": "Quais requisitos de dados a empresa exige?",
    "test": "Submeta controles, evidências de segurança, acordo de tratamento, subprocessadores e resposta a incidentes aos responsáveis internos."
  },
  {
    "id": "residency",
    "group": "Segurança e governança",
    "name": "Residência e retenção de dados",
    "question": "Onde os dados podem ficar e por quanto tempo?",
    "test": "Confirme regiões, cópias, transferências, retenção, exclusão e restrições por categoria de documento."
  },
  {
    "id": "continuity",
    "group": "Segurança e governança",
    "name": "Disponibilidade e continuidade",
    "question": "Quanto tempo de interrupção a operação tolera?",
    "test": "Revise SLA, recuperação, backups e contingência; peça evidências de testes e acesso a documentos em indisponibilidade."
  },
  {
    "id": "implementation",
    "group": "Adoção e implantação",
    "name": "Implantação e administração",
    "question": "Quem configura, mantém e evolui os processos?",
    "test": "Monte plano com responsáveis, dependências, horas internas, treinamento e critérios de aceite. Faça uma mudança sem o fornecedor."
  },
  {
    "id": "usability",
    "group": "Adoção e implantação",
    "name": "Usabilidade e acessibilidade",
    "question": "As áreas conseguem concluir suas tarefas com autonomia?",
    "test": "Observe jurídico e áreas de negócio em tarefas reais, por teclado e dispositivos relevantes; conte erros e pedidos de ajuda."
  },
  {
    "id": "support",
    "group": "Adoção e implantação",
    "name": "Suporte e capacitação",
    "question": "Qual apoio será necessário para sustentar a operação?",
    "test": "Confira idioma, horários, níveis de atendimento, escalonamento, materiais e limites do parceiro de implantação."
  },
  {
    "id": "scale",
    "group": "Adoção e implantação",
    "name": "Escala e complexidade organizacional",
    "question": "O produto atende volume, entidades e usuários previstos?",
    "test": "Teste pico de volume e segregação entre entidades. Confirme limites técnicos e comerciais para crescer."
  },
  {
    "id": "tco",
    "group": "Viabilidade econômica",
    "name": "Custo total de propriedade",
    "question": "Quanto custará operar durante todo o período avaliado?",
    "test": "Some licenças, IA, assinatura, conectores, implantação, migração, horas internas, suporte, reajustes e saída. Declare moeda e horizonte."
  },
  {
    "id": "supplier",
    "group": "Viabilidade econômica",
    "name": "Fornecedor, parceiro e condições",
    "question": "Quem responde pela entrega e quais são as dependências?",
    "test": "Valide referências, responsabilidades, evolução do produto, condições de renovação e capacidade do fornecedor e do parceiro."
  }
];

export const stages = [
  {
    "id": "diagnosis",
    "name": "Diagnóstico",
    "description": "Entender a operação antes de escolher uma ferramenta.",
    "tasks": [
      "Mapear volume, tipos, idiomas e origem dos contratos.",
      "Identificar usuários, áreas envolvidas e ferramentas existentes.",
      "Definir o problema prioritário e medir a situação atual."
    ]
  },
  {
    "id": "requirements",
    "name": "Requisitos",
    "description": "Separar o obrigatório do desejável e definir os pesos.",
    "tasks": [
      "Priorizar os critérios com Jurídico, TI, Segurança, Compras e áreas usuárias.",
      "Listar integrações obrigatórias, dados trocados e responsáveis.",
      "Registrar vetos, orçamento e critérios de aceite do piloto."
    ]
  },
  {
    "id": "shortlist",
    "name": "Comparação",
    "description": "Montar uma lista curta e registrar lacunas de evidência.",
    "tasks": [
      "Consultar documentação e referências de cada ferramenta.",
      "Identificar módulos, conectores, limitações e condições da proposta.",
      "Separar recurso documentado, experiência de uso e hipótese."
    ]
  },
  {
    "id": "pilot",
    "name": "Piloto",
    "description": "Comparar as ferramentas no mesmo trabalho e com a mesma amostra.",
    "tasks": [
      "Executar o roteiro com contratos representativos autorizados para o teste.",
      "Medir erros, retrabalho, qualidade da IA e esforço de configuração.",
      "Demonstrar integrações e validar os requisitos obrigatórios."
    ]
  },
  {
    "id": "decision",
    "name": "Decisão",
    "description": "Consolidar evidências, custo total e responsáveis.",
    "tasks": [
      "Revisar notas e resolver lacunas e vetos com os responsáveis.",
      "Comparar custo total no mesmo horizonte e formalizar a justificativa.",
      "Acordar implantação, responsabilidades, aceite e condições de saída."
    ]
  },
  {
    "id": "followup",
    "name": "Acompanhamento",
    "description": "Conferir se o resultado da implantação corresponde ao que foi decidido.",
    "tasks": [
      "Comparar adoção e indicadores com a situação inicial.",
      "Registrar desvios, custos e limitações encontrados no uso.",
      "Compartilhar aprendizados não confidenciais para melhorar o Bench."
    ]
  }
];
