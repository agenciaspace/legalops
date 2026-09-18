import type { ClubLocale } from './club-locale'
export const clubEmailCopy: Record<ClubLocale, {
  accountTitle: string; accountPreview: string; accountBody: string; profileAction: string;
  clubTitle: string; clubPreview: string; clubBody: string; communityAction: string;
  inviteTitle: string; inviteBody: string; inviteAction: string;
  confirmTitle: string; confirmBody: string; confirmAction: string;
  hello: string; account: string; whatsapp: string;
}> = {
  'pt-BR': {
    accountTitle:'sua conta está pronta',accountPreview:'Complete seu perfil e encontre sua comunidade.',accountBody:'Você já tem uma conta no ecossistema legalops. Agora, complete seu perfil para entrar na comunidade gratuita. Encontre pessoas, conversas e referências para os desafios do trabalho jurídico.',profileAction:'Completar meu perfil',
    clubTitle:'bem-vindo à comunidade',clubPreview:'Seu acesso está ativo. Apresente-se e entre nas conversas.',clubBody:'Seu acesso ao legalops.club está ativo. Troque experiências com quem vive os mesmos desafios do jurídico. Complete seu perfil, apresente-se nas conversas por tema e acompanhe os próximos encontros no calendário.',communityAction:'Entrar na comunidade',
    inviteTitle:'seu convite chegou',inviteBody:'Seu acesso ao legalops.club foi liberado. Ative sua conta, crie uma senha e complete seu perfil para participar das conversas.',inviteAction:'Ativar meu acesso',
    confirmTitle:'confirme seu email',confirmBody:'Confirme seu email para continuar o cadastro no legalops.club. Depois, complete seu perfil para conhecer outros profissionais e participar das conversas.',confirmAction:'Confirmar meu email',hello:'Olá',account:'Conta',whatsapp:'Entrar na comunidade do WhatsApp',
  },
  en: {
    accountTitle:'your account is ready',accountPreview:'Complete your profile and find your community.',accountBody:'You now have an account in the legalops ecosystem. Complete your profile to join the free community. Meet people, join conversations and find references for the challenges of legal work.',profileAction:'Complete my profile',
    clubTitle:'welcome to the community',clubPreview:'Your access is active. Introduce yourself and join the conversation.',clubBody:'Your access to legalops.club is active. Share experiences with people facing similar challenges in legal work. Complete your profile, introduce yourself in topic discussions and check the calendar for upcoming meetings.',communityAction:'Enter the community',
    inviteTitle:'your invitation is here',inviteBody:'Your access to legalops.club has been approved. Activate your account, create a password and complete your profile to join the conversations.',inviteAction:'Activate my access',
    confirmTitle:'confirm your email',confirmBody:'Confirm your email to continue signing up for legalops.club. Then complete your profile to meet other professionals and join the conversations.',confirmAction:'Confirm my email',hello:'Hello',account:'Account',whatsapp:'Join the WhatsApp community',
  },
  es: {
    accountTitle:'tu cuenta está lista',accountPreview:'Completa tu perfil y encuentra tu comunidad.',accountBody:'Ya tienes una cuenta en el ecosistema legalops. Completa tu perfil para entrar en la comunidad gratuita. Conoce personas, participa en conversaciones y encuentra referencias para los desafíos del trabajo jurídico.',profileAction:'Completar mi perfil',
    clubTitle:'bienvenido a la comunidad',clubPreview:'Tu acceso está activo. Preséntate y participa en las conversaciones.',clubBody:'Tu acceso a legalops.club está activo. Comparte experiencias con personas que afrontan desafíos similares en el trabajo jurídico. Completa tu perfil, preséntate en las conversaciones por tema y consulta los próximos encuentros en el calendario.',communityAction:'Entrar en la comunidad',
    inviteTitle:'tu invitación ha llegado',inviteBody:'Tu acceso a legalops.club ha sido aprobado. Activa tu cuenta, crea una contraseña y completa tu perfil para participar en las conversaciones.',inviteAction:'Activar mi acceso',
    confirmTitle:'confirma tu email',confirmBody:'Confirma tu email para continuar el registro en legalops.club. Después, completa tu perfil para conocer a otros profesionales y participar en las conversaciones.',confirmAction:'Confirmar mi email',hello:'Hola',account:'Cuenta',whatsapp:'Entrar en la comunidad de WhatsApp',
  },
}
