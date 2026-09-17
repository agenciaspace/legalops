# Resultados quantitativos

Gerado por `python3 evals/club-pro/report.py` a partir de respostas preservadas.

| Modelo | Chamadas OK | Custo medido USD | Mediana | p95 |
|---|---:|---:|---:|---:|
| anthropic/claude-sonnet-4.6 | 20/20 | 0.190971 | 4.10s | 9.00s |
| google/gemini-2.5-flash | 20/20 | 0.016044 | 1.73s | 2.26s |
| google/gemini-3.1-flash-lite | 20/20 | 0.010524 | 1.72s | 2.60s |

Total da avaliação: US$ 0.217540; piloto separado: US$ 0.000455.

## Planejamento mensal de IA — não é preço de venda

Premissas: dólar de planejamento R$6, taxa de compra 5,5%, texto sem ferramentas pagas, sem desconto de cache. Requisição padrão: 12 mil tokens de entrada / 1.400 saída. Profunda: 12 mil / 2 mil. Boletim: 3 mil / 600. Carta: 3 mil / 800. Não são médias medidas dos membros.

| Perfil | Padrão / profundas / boletins / cartas | IA estimada | Reserva 2× |
|---|---|---:|---:|
| Leve | 60 / 4 / 30 / 4 | R$ 4.75 | R$ 9.51 |
| Frequente | 200 / 12 / 30 / 8 | R$ 14.46 | R$ 28.92 |
| Intenso | 600 / 40 / 30 / 20 | R$ 44.36 | R$ 88.71 |

Reserva 2× é uma hipótese explícita de contingência, não uma margem observada. Exclui aquisição de conteúdo, transcrição, buscas pagas, armazenamento, hospedagem, email, impostos e trabalho operacional. Múltiplas chamadas numa tarefa devem ser somadas. O piso mensal da infraestrutura dividido pelo número de pagantes também precisa entrar na conta.

Fontes de preços: [Flash Lite](https://openrouter.ai/google/gemini-3.1-flash-lite), [Flash](https://openrouter.ai/google/gemini-2.5-flash), [Sonnet](https://openrouter.ai/anthropic/claude-sonnet-4.6), [taxa OpenRouter](https://openrouter.ai/pricing). Custos medidos vêm de `usage.cost`, conforme [Usage Accounting](https://openrouter.ai/docs/cookbook/administration/usage-accounting).
