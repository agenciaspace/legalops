import Link from 'next/link'
import { ArrowRight, Users, Zap, BarChart3, Shield, Search, Target } from 'lucide-react'
import { BrandLogo } from '@/components/BrandLogo'

const features = [
  {
    icon: Target,
    title: 'AI-powered matching',
    description:
      'Our algorithm analyzes skills, experience, and preferences to connect you with the ideal candidates.',
  },
  {
    icon: Users,
    title: 'Specialized talent pool',
    description:
      'Access thousands of verified professionals in Legal Ops, CLM, and legal operations.',
  },
  {
    icon: Search,
    title: 'Advanced filters',
    description:
      'Filter by specialization, tools mastered, years of experience, salary expectations, and location.',
  },
  {
    icon: Zap,
    title: 'Faster hiring',
    description:
      'Reduce time-to-hire from months to weeks with pre-qualified candidates.',
  },
  {
    icon: BarChart3,
    title: 'Recruitment analytics',
    description:
      'Dashboard with funnel metrics, time-to-hire, and candidate quality insights.',
  },
  {
    icon: Shield,
    title: 'Verified candidates',
    description:
      'Complete professional profiles with work history, certifications, and community reviews.',
  },
]

const steps = [
  {
    number: '01',
    title: 'Post your job',
    description: 'Describe what you are looking for. Our AI automatically enriches it with market data.',
  },
  {
    number: '02',
    title: 'Receive matches',
    description:
      'Within minutes, our algorithm identifies the professionals best aligned with your job profile.',
  },
  {
    number: '03',
    title: 'Connect',
    description:
      'Reach out to candidates directly or let them apply to your posting.',
  },
]

export default function ForEmployersPage() {
  return (
    <div className="min-h-screen bg-[#F5F4F0] text-[#1A1A1A]">
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
              className="rounded-xl border-2 border-[#1A1A1A] px-4 py-2 text-sm font-bold text-[#1A1A1A] transition-colors hover:bg-[#1A1A1A]/5"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="rounded-xl bg-[#1A1A1A] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-black"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        {/* Hero */}
        <section className="py-16 sm:py-20">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#1A1A1A]/50">
              For Companies
            </p>
            <h1 className="mt-3 text-4xl font-bold leading-tight sm:text-5xl">
              Hire the best Legal Ops professionals
            </h1>
            <p className="mt-4 text-lg leading-8 text-[#1A1A1A]/70">
              Access the largest pool of talent specialized in legal operations.
              AI-powered matching. Pre-qualified and filtered candidates.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF6A00] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#E65C00]"
              >
                Post a job — $299
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#1A1A1A] px-6 py-3 text-sm font-bold text-[#1A1A1A] transition-colors hover:bg-[#1A1A1A]/5"
              >
                View all plans
              </Link>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-[#1A1A1A]/10 py-16">
          <h2 className="text-3xl font-bold sm:text-4xl">
            How it works
          </h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number}>
                <span className="text-4xl font-bold text-[#1A1A1A]/10">{step.number}</span>
                <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#1A1A1A]/70">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-[#1A1A1A]/10 py-16">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Why companies choose LegalOps
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-2xl border border-[#1A1A1A]/10 bg-white p-6">
                <feature.icon className="h-6 w-6 text-[#FF6A00]" />
                <h3 className="mt-3 font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#1A1A1A]/70">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section className="border-t border-[#1A1A1A]/10 py-16">
          <div className="grid gap-8 sm:grid-cols-3">
            <div className="text-center">
              <p className="text-4xl font-bold">500+</p>
              <p className="mt-1 text-sm text-[#1A1A1A]/70">Jobs mapped</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold">95%</p>
              <p className="mt-1 text-sm text-[#1A1A1A]/70">Average match score</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold">2 wks</p>
              <p className="mt-1 text-sm text-[#1A1A1A]/70">Average time-to-hire</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mb-16 rounded-2xl border border-[#1A1A1A]/10 bg-white px-6 py-8 sm:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-bold">
                Ready to find your next talent?
              </h2>
              <p className="mt-2 text-[#1A1A1A]/70">
                Post your first job today and receive matches in minutes.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF6A00] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#E65C00]"
            >
              Get started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
