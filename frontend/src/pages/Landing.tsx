import { Link } from 'react-router-dom'

const hasSession = () =>
  typeof window !== 'undefined' && Boolean(localStorage.getItem('token'))

const features = [
  {
    icon: 'description',
    title: 'Document Authentication',
    body: 'Every uploaded file is fingerprinted with SHA-256 and can be re-verified at any time to detect tampering.',
  },
  {
    icon: 'fact_check',
    title: 'Automated Compliance',
    body: 'A versioned rule engine evaluates each application against statutory requirements and raises actionable findings.',
  },
  {
    icon: 'history_toggle_off',
    title: 'Immutable Audit Trail',
    body: 'Every submission, decision and verification is recorded chronologically for regulatory accountability.',
  },
  {
    icon: 'groups',
    title: 'Role-Based Workflow',
    body: 'Applicants, reviewers and administrators each see exactly the actions and records they are entitled to.',
  },
  {
    icon: 'insights',
    title: 'Portfolio Analytics',
    body: 'Live dashboards track throughput, approval rates, compliance exposure and evidence volumes.',
  },
  {
    icon: 'mark_email_unread',
    title: 'Evidence Requests',
    body: 'Reviewers request missing evidence; applicants respond in-app with a full record of the exchange.',
  },
]

const steps = [
  { n: '01', title: 'Register & apply', body: 'Create an institutional application with its registration and contact details.' },
  { n: '02', title: 'Upload evidence', body: 'Attach supporting documents; each is hashed and checked for duplicates.' },
  { n: '03', title: 'Submit for review', body: 'Send the application into the regulatory workflow with one click.' },
  { n: '04', title: 'Get a decision', body: 'Reviewers evaluate, request evidence, and record an auditable decision.' },
]

export default function Landing() {
  const signedIn = hasSession()
  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur border-b border-outline-variant/30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px] text-on-primary">shield</span>
            </div>
            <span className="font-headline font-bold text-lg text-on-surface">VeriSure AI</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="px-4 py-2 rounded text-sm text-on-surface hover:bg-surface-container"
            >
              Sign In
            </Link>
            <Link
              to={signedIn ? '/dashboard' : '/register'}
              className="px-4 py-2 rounded bg-primary text-on-primary text-sm hover:bg-primary-container shadow-sm"
            >
              {signedIn ? 'Open Dashboard' : 'Get Started'}
            </Link>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 pt-16 pb-14">
        <div className="inline-flex items-center gap-2 rounded-full border border-outline-variant/50 bg-surface-container-low px-3 py-1 text-xs text-on-surface-variant">
          <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
          Intelligent Application Validation &amp; Regulatory Compliance
        </div>
        <h1 className="mt-5 text-4xl md:text-5xl font-headline font-bold text-on-surface leading-tight max-w-3xl">
          Trustworthy decisions for every application you process.
        </h1>
        <p className="mt-5 text-lg text-on-surface-variant max-w-2xl">
          VeriSure AI combines document authentication, automated statutory compliance and a complete
          audit trail into a single regulated workflow — so institutions can prove every decision.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            to={signedIn ? '/dashboard' : '/register'}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-primary text-on-primary hover:bg-primary-container shadow-sm text-sm font-medium"
          >
            <span className="material-symbols-outlined text-[18px]">
              {signedIn ? 'dashboard' : 'rocket_launch'}
            </span>
            {signedIn ? 'Open your dashboard' : 'Create an account'}
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-surface-container text-on-surface hover:bg-surface-container-high text-sm font-medium"
          >
            <span className="material-symbols-outlined text-[18px]">login</span>
            Sign in to the platform
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'SHA-256 fingerprinting', icon: 'fingerprint' },
            { label: 'Rule-based compliance', icon: 'gavel' },
            { label: 'Full audit history', icon: 'history' },
            { label: 'Role-based access', icon: 'admin_panel_settings' },
          ].map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-2 rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2.5"
            >
              <span className="material-symbols-outlined text-[18px] text-primary">{s.icon}</span>
              <span className="text-xs text-on-surface-variant">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-surface-container-low border-y border-outline-variant/30">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-headline font-bold text-on-surface">Everything the review cycle needs</h2>
          <p className="mt-2 text-on-surface-variant max-w-2xl">
            From ingest to decision, each step produces evidence you can defend.
          </p>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl bg-surface-container-lowest border border-outline-variant/20 p-5 shadow-sm"
              >
                <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[22px]">{f.icon}</span>
                </div>
                <h3 className="mt-3 font-headline font-semibold text-on-surface">{f.title}</h3>
                <p className="mt-1 text-sm text-on-surface-variant">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-headline font-bold text-on-surface">How it works</h2>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          {steps.map((s) => (
            <div key={s.n} className="relative rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-5">
              <span className="font-mono text-xs font-semibold text-primary">{s.n}</span>
              <h3 className="mt-2 font-headline font-semibold text-on-surface">{s.title}</h3>
              <p className="mt-1 text-sm text-on-surface-variant">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="rounded-2xl bg-[#0F172A] text-white p-8 md:p-12 flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-xl">
            <h2 className="text-2xl font-headline font-bold">Start processing applications with verifiable trust.</h2>
            <p className="mt-2 text-[#CBD5E1] text-sm">
              Create an applicant account to run the full workflow, or sign in as an administrator to review
              submissions.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to={signedIn ? '/dashboard' : '/register'}
              className="px-5 py-2.5 rounded bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-sm font-medium"
            >
              {signedIn ? 'Open Dashboard' : 'Register'}
            </Link>
            <Link
              to="/login"
              className="px-5 py-2.5 rounded border border-[#334155] hover:bg-[#1E293B] text-white text-sm font-medium"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-outline-variant/30">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-wrap items-center justify-between gap-2 text-xs text-on-surface-variant">
          <span>VeriSure AI — Intelligent Application Validation, Document Authentication &amp; Regulatory Compliance</span>
          <span>Built for auditable institutional decisions</span>
        </div>
      </footer>
    </div>
  )
}
