import type { ClubLocale } from './club-locale'

const pt = {
  title: 'Sua chave de API',
  intro: 'Use sua conta de API da OpenAI no agente pessoal do Club Pro.',
  billing: 'O consumo é cobrado pela OpenAI na sua conta de API. A assinatura do ChatGPT não inclui esses créditos. O acesso Pro e o limite de 30 perguntas por dia continuam valendo.',
  privacy: 'A chave é armazenada com criptografia e usada somente nas suas perguntas. Seu contexto e as mensagens necessárias para responder são enviados à OpenAI.',
  label: 'Chave de API da OpenAI',
  consent: 'Autorizo o uso desta chave nas minhas próximas perguntas e a cobrança na minha conta de API da OpenAI.',
  connect: 'Validar e conectar', replace: 'Validar e substituir', busy: 'Salvando…',
  disconnect: 'Remover chave', removing: 'Removendo…',
  removed: 'Chave removida. As próximas perguntas voltam a usar a IA do Club Pro.',
  saved: 'Chave conectada. Suas próximas perguntas usarão sua conta de API.',
  connected: 'Conectada', loading: 'Carregando conexão…', retry: 'Tentar novamente',
  create: 'Obter chave na OpenAI', usage: 'Ver consumo na OpenAI',
  model: 'Modelo: GPT-4.1 mini. A validação verifica a chave e o acesso ao modelo, sem gerar texto. Saldo e permissão de geração são verificados ao perguntar.',
  active: 'Usando sua API OpenAI', club: 'Usando a IA do Club Pro', manage: 'Gerenciar chave de API',
}

const en: typeof pt = {
  title: 'Your API key', intro: 'Use your OpenAI API account with your Club Pro personal assistant.',
  billing: 'OpenAI bills usage to your API account. Your ChatGPT subscription does not include these credits. Pro access and the 30-question daily limit still apply.',
  privacy: 'Your key is encrypted in storage and used only for your questions. Your context and the messages needed to answer are sent to OpenAI.',
  label: 'OpenAI API key', consent: 'I authorize using this key for my next questions and billing my OpenAI API account.',
  connect: 'Validate and connect', replace: 'Validate and replace', busy: 'Saving…',
  disconnect: 'Remove key', removing: 'Removing…', removed: 'Key removed. Your next questions will use Club Pro AI again.',
  saved: 'Key connected. Your next questions will use your API account.', connected: 'Connected',
  loading: 'Loading connection…', retry: 'Try again', create: 'Get an OpenAI key', usage: 'View OpenAI usage',
  model: 'Model: GPT-4.1 mini. Validation checks the key and model access without generating text. Balance and generation permissions are checked when you ask a question.',
  active: 'Using your OpenAI API', club: 'Using Club Pro AI', manage: 'Manage API key',
}

const es: typeof pt = {
  title: 'Tu clave de API', intro: 'Usa tu cuenta de API de OpenAI con el agente personal de Club Pro.',
  billing: 'OpenAI cobra el consumo en tu cuenta de API. La suscripción de ChatGPT no incluye estos créditos. Se mantienen el acceso Pro y el límite de 30 preguntas al día.',
  privacy: 'La clave se almacena cifrada y se usa solo para tus preguntas. Tu contexto y los mensajes necesarios para responder se envían a OpenAI.',
  label: 'Clave de API de OpenAI', consent: 'Autorizo el uso de esta clave en mis próximas preguntas y el cobro en mi cuenta de API de OpenAI.',
  connect: 'Validar y conectar', replace: 'Validar y sustituir', busy: 'Guardando…',
  disconnect: 'Eliminar clave', removing: 'Eliminando…', removed: 'Clave eliminada. Las próximas preguntas volverán a usar la IA de Club Pro.',
  saved: 'Clave conectada. Tus próximas preguntas usarán tu cuenta de API.', connected: 'Conectada',
  loading: 'Cargando conexión…', retry: 'Reintentar', create: 'Obtener clave en OpenAI', usage: 'Ver consumo en OpenAI',
  model: 'Modelo: GPT-4.1 mini. La validación comprueba la clave y el acceso al modelo sin generar texto. El saldo y los permisos de generación se comprueban al preguntar.',
  active: 'Usando tu API de OpenAI', club: 'Usando la IA de Club Pro', manage: 'Gestionar clave de API',
}

export function memberKeyCopy(locale: ClubLocale) { return locale === 'en' ? en : locale === 'es' ? es : pt }

const errors: Record<string, [string, string, string]> = {
  invalid_api_key: ['A OpenAI não aceitou a chave. Confira ou substitua a chave no perfil.', 'OpenAI did not accept the key. Check or replace it in your profile.', 'OpenAI no aceptó la clave. Revísala o sustitúyela en tu perfil.'],
  model_access_denied: ['A chave não tem acesso ao GPT-4.1 mini ou à operação solicitada. Confira as permissões na OpenAI.', 'The key cannot access GPT-4.1 mini or the requested operation. Check its OpenAI permissions.', 'La clave no tiene acceso a GPT-4.1 mini o a la operación solicitada. Revisa sus permisos en OpenAI.'],
  provider_limit: ['Sua conta de API atingiu um limite ou está sem créditos. Confira o consumo e a cobrança na OpenAI.', 'Your API account reached a limit or ran out of credits. Check usage and billing at OpenAI.', 'Tu cuenta de API alcanzó un límite o no tiene créditos. Revisa el consumo y la facturación en OpenAI.'],
  provider_unavailable: ['A OpenAI não respondeu agora. Tente novamente. Não usamos outra conta para cobrar esta pergunta.', 'OpenAI could not respond. Try again. We did not use another account to bill this question.', 'OpenAI no pudo responder. Inténtalo de nuevo. No usamos otra cuenta para cobrar esta pregunta.'],
  key_storage_unavailable: ['Não conseguimos acessar sua conexão de API. Tente novamente em instantes.', 'We could not access your API connection. Try again shortly.', 'No pudimos acceder a tu conexión de API. Inténtalo de nuevo en unos instantes.'],
  sign_in_required: ['Entre na sua conta para gerenciar a chave.', 'Sign in to manage your key.', 'Inicia sesión para gestionar tu clave.'],
  club_access_required: ['É preciso ter acesso ativo ao Club para conectar uma chave.', 'Active Club access is required to connect a key.', 'Necesitas acceso activo al Club para conectar una clave.'],
  consent_required: ['Confirme a autorização de uso e cobrança para conectar a chave.', 'Confirm usage and billing authorization to connect the key.', 'Confirma la autorización de uso y cobro para conectar la clave.'],
  invalid_origin: ['Atualize a página e tente novamente.', 'Reload the page and try again.', 'Actualiza la página e inténtalo de nuevo.'],
  invalid_request: ['Confira a chave e tente novamente.', 'Check the key and try again.', 'Revisa la clave e inténtalo de nuevo.'],
}
export function memberKeyErrorMessage(code: string, locale: ClubLocale) {
  return (errors[code] ?? errors.key_storage_unavailable)[locale === 'en' ? 1 : locale === 'es' ? 2 : 0]
}
