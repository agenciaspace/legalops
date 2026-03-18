import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { BrandLogo } from '@/components/BrandLogo'

export const metadata = {
  title: 'Manifesto — LegalOps',
  description:
    'Por que criamos a plataforma que Legal Ops merecia desde o início.',
}

export default function ManifestoPage() {
  return (
    <div className="min-h-screen bg-[#F5F4F0] text-[#1A1A1A]">
      {/* Header */}
      <header className="border-b border-[#1A1A1A]/10 bg-[#F5F4F0]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/">
            <BrandLogo
              className="flex items-center gap-3"
              markClassName="h-10 w-10 text-[#1A1A1A]"
            />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/pricing"
              className="hidden sm:inline-flex rounded-xl px-4 py-2 text-sm font-medium text-[#1A1A1A]/70 transition-colors hover:text-[#1A1A1A]"
            >
              Planos
            </Link>
            <Link
              href="/login"
              className="rounded-xl bg-[#1A1A1A] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-black"
            >
              Entrar
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <article className="mx-auto max-w-2xl px-6 py-16 sm:py-20">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#1A1A1A]/50">
          Manifesto
        </p>

        <h1 className="mt-4 text-4xl leading-tight sm:text-5xl font-bold">
          Legal Ops merece mais do que um job board genérico.
        </h1>

        <div className="mt-10 space-y-8 text-base leading-8 text-[#1A1A1A]/70">
          {/* --- Seção 1: O problema --- */}
          <section>
            <h2 className="text-lg font-semibold text-[#1A1A1A]">
              O mercado está quebrado.
            </h2>
            <p className="mt-3">
              Se você trabalha com operações jurídicas, já sabe: encontrar a
              próxima oportunidade de carreira é um exercício de paciência,
              sorte e dezenas de abas abertas. Vagas de Legal Ops estão
              espalhadas entre Greenhouse, Lever, LinkedIn, Indeed e sites de
              empresas que ninguém indexa. Não existe um lugar só para quem
              constrói operações jurídicas.
            </p>
            <p className="mt-3">
              Do outro lado, empresas que precisam contratar esses profissionais
              sofrem o mesmo problema ao contrário. Publicam vagas em boards
              genéricos e recebem centenas de candidatos que não sabem a
              diferença entre um CLM e um CRM. O tempo de contratação se
              arrasta. O custo explode. O talento certo nunca aparece.
            </p>
          </section>

          {/* --- Seção 2: A crença --- */}
          <section>
            <h2 className="text-lg font-semibold text-[#1A1A1A]">
              Nós acreditamos em algo diferente.
            </h2>
            <p className="mt-3">
              Acreditamos que Legal Ops não é um cargo — é uma disciplina. Uma
              disciplina que está transformando como departamentos jurídicos
              operam no mundo inteiro. Automação de contratos, gestão de
              fornecedores, analytics jurídico, compliance operacional — quem
              faz isso não é um generalista. É um especialista que merece uma
              casa própria.
            </p>
            <p className="mt-3">
              Acreditamos que os melhores profissionais de Legal Ops não
              deveriam competir por atenção com milhões de vagas irrelevantes.
              E que as empresas que os procuram deveriam ter acesso a um pool
              curado, filtrado e inteligente — não a um palheiro infinito.
            </p>
          </section>

          {/* --- Seção 3: O que estamos construindo --- */}
          <section>
            <h2 className="text-lg font-semibold text-[#1A1A1A]">
              Então estamos construindo a plataforma que Legal Ops merecia
              desde o início.
            </h2>
            <p className="mt-3">
              Não é só um job board. É uma rede profissional inteira desenhada
              para quem vive operações jurídicas.
            </p>
            <ul className="mt-4 space-y-3">
              <li className="flex gap-3">
                <span className="mt-1 block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#1A1A1A]" />
                <span>
                  <strong className="text-[#1A1A1A]">Para profissionais:</strong>{' '}
                  um perfil que mostra de verdade o que você faz. Vagas curadas
                  com IA. Pipeline pessoal para acompanhar candidaturas.
                  Interview prep. Cover letters. Tudo no mesmo lugar.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#1A1A1A]" />
                <span>
                  <strong className="text-[#1A1A1A]">Para empresas:</strong>{' '}
                  acesso ao maior pool de talentos especializados em Legal Ops.
                  Match automático com inteligência artificial que entende a
                  diferença entre um Legal Ops Manager e um paralegal. Candidatos
                  pré-qualificados, não leads frios.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#1A1A1A]" />
                <span>
                  <strong className="text-[#1A1A1A]">Para a comunidade:</strong>{' '}
                  um diretório público onde profissionais se encontram, trocam
                  experiências e constroem reputação. Um benchmark salarial
                  transparente. Conteúdo que eleva toda a categoria.
                </span>
              </li>
            </ul>
          </section>

          {/* --- Seção 4: A visão --- */}
          <section>
            <h2 className="text-lg font-semibold text-[#1A1A1A]">
              A visão é simples.
            </h2>
            <p className="mt-3">
              Queremos que quando alguém pensar em "carreira em Legal Ops",
              pense em LegalOps. Quando uma empresa precisar contratar um CLM
              Manager, venha para cá primeiro. Quando um profissional quiser
              entender quanto vale no mercado, consulte nossos dados.
            </p>
            <p className="mt-3">
              Queremos ser a infraestrutura de carreira de uma categoria
              inteira. Não um produto — um ecossistema.
            </p>
          </section>

          {/* --- Seção 5: Como chegamos lá --- */}
          <section>
            <h2 className="text-lg font-semibold text-[#1A1A1A]">
              E como vamos chegar lá?
            </h2>
            <p className="mt-3">
              Começamos do jeito mais difícil: rastreando vagas automaticamente
              de dezenas de fontes, enriquecendo cada uma com IA para extrair
              salários, benefícios, modelo de trabalho e até quem seria seu
              futuro gestor. Fizemos isso porque ninguém mais faz — e porque
              acreditamos que informação é poder.
            </p>
            <p className="mt-3">
              Agora estamos abrindo a plataforma para profissionais criarem
              seus perfis, para empresas publicarem vagas e para que o match
              aconteça de forma natural. Não forçamos conexões — criamos o
              ambiente para que as certas aconteçam.
            </p>
            <p className="mt-3">
              Somos gratuitos para começar. Sempre seremos. Porque a base da
              rede é o profissional, e o profissional precisa estar aqui antes
              de tudo. Quem quer ir mais rápido, paga. Quem quer contratar
              os melhores, paga. Quem só quer participar da comunidade,
              é bem-vindo.
            </p>
          </section>

          {/* --- Seção 6: O convite --- */}
          <section>
            <h2 className="text-lg font-semibold text-[#1A1A1A]">
              Isso é um convite.
            </h2>
            <p className="mt-3">
              Se você é profissional de Legal Ops, este é o seu lugar. Crie
              seu perfil. Mostre ao mercado o que você constrói. Use as
              ferramentas para encontrar sua próxima oportunidade. Faça parte
              de uma comunidade que entende o que você faz — porque faz a
              mesma coisa.
            </p>
            <p className="mt-3">
              Se você contrata profissionais de Legal Ops, pare de procurar no
              lugar errado. Os melhores estão aqui. E nosso algoritmo sabe
              encontrá-los para você.
            </p>
            <p className="mt-3 font-medium text-[#1A1A1A]">
              Legal Ops é o futuro das operações jurídicas.
              <br />
              E o futuro precisa de uma casa.
            </p>
          </section>
        </div>

        {/* CTAs */}
        <div className="mt-12 flex flex-wrap gap-3">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF6A00] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#E65C00]"
          >
            Criar minha conta grátis
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/for-employers"
            className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#1A1A1A] px-6 py-3 text-sm font-bold text-[#1A1A1A] transition-colors hover:bg-[#1A1A1A]/5"
          >
            Sou empresa — quero contratar
          </Link>
        </div>

        {/* Signature */}
        <div className="mt-16 border-t border-[#1A1A1A]/10 pt-8">
          <p className="text-sm text-[#1A1A1A]/60">
            — O time LegalOps
          </p>
          <p className="mt-1 text-sm text-[#1A1A1A]/50">
            Março de 2026
          </p>
        </div>
      </article>
    </div>
  )
}
