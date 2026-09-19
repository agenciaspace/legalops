export const fields=['topic','position','escalation','context'];
export function normalize(input){return Object.fromEntries(fields.map(key=>[key,typeof input?.[key]==='string'?input[key].trim().slice(0,key==='topic'?120:1600):'']))}
export function validate(input){const v=normalize(input);return v.topic.length>=3&&v.position.length>=10&&v.escalation.length>=10}
export function markdown(input){const v=normalize(input);return `# ${v.topic||'Novo tema'}\n\nStatus: proposta para revisão — não é uma posição aprovada.\n\n## O que queremos aceitar\n${v.position}\n\n## Quando pedir aprovação\n${v.escalation}\n\n## Contexto e limites\n${v.context||'A preencher com a equipe revisora.'}\n`}
