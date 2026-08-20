import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { Button, ErrorState, Field, Input } from '@/components/ui'
import { Brand } from '@/components/layout/Brand'

const DEMO_ACCOUNTS = [
  { email: 'mayank@cadence.dev', role: 'Admin', name: 'Mayank Singh' },
  { email: 'rahul@cadence.dev', role: 'Manager', name: 'Rahul Verma' },
  { email: 'janvi@cadence.dev', role: 'Manager', name: 'Janvi Mehta' },
  { email: 'aditi@cadence.dev', role: 'Member', name: 'Aditi Rao' },
]

export function LoginPage() {
  useDocumentTitle('Sign in')
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('mayank@cadence.dev')
  const [password, setPassword] = useState('password123')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await login({ email: email.trim(), password })
      navigate(location.state?.from ?? '/', { replace: true })
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_minmax(420px,44%)]">
      {/* Left: the product's own idea, drawn rather than described. */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-ink p-10 lg:flex">
        <Brand />

        <div className="relative max-w-md">
          <p className="eyebrow text-white/40">Internal tool</p>
          <h1 className="mt-3 text-[36px] font-semibold leading-[1.12] tracking-[-0.02em] text-white">
            Read the week before it happens.
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-white/55">
            Cadence lays the fortnight ahead out as a single score: one mark per
            open task, on the day it is due. Where the week is heavy is
            something you see, not something you calculate.
          </p>

          {/* A miniature of the dashboard strip - the same idea, drawn small. */}
          <div className="mt-10 flex items-end gap-2" aria-hidden>
            {[
              ['urgent'],
              ['high', 'low'],
              [],
              ['medium'],
              ['urgent', 'high', 'medium'],
              ['low'],
              ['high', 'medium'],
              [],
              ['medium', 'low'],
              ['urgent', 'high'],
            ].map((day, index) => (
              <span key={index} className="flex flex-1 flex-col items-stretch gap-[3px]">
                <span className="flex flex-col-reverse gap-[3px]" style={{ minHeight: '34px' }}>
                  {day.map((priority, tick) => (
                    <span
                      key={tick}
                      className={
                        'h-[6px] animate-tick-in rounded-[1px] ' +
                        {
                          urgent: 'bg-flag',
                          high: 'bg-ochre',
                          medium: 'bg-accent',
                          low: 'bg-white/25',
                        }[priority]
                      }
                      style={{ animationDelay: `${index * 60 + tick * 70}ms` }}
                    />
                  ))}
                </span>
                <span
                  className={
                    'h-[2px] rounded-full ' + (index === 0 ? 'bg-white/70' : 'bg-white/15')
                  }
                />
              </span>
            ))}
          </div>
          <p className="mt-3 font-mono text-3xs uppercase tracking-[0.1em] text-white/30">
            Ten days · one mark per open task
          </p>
        </div>

        <p className="font-mono text-3xs uppercase tracking-[0.1em] text-white/25">
          Built by Mayank Singh &middot; React · Vite · Tailwind · FastAPI
        </p>
      </div>

      {/* Right: the form */}
      <div className="flex items-center justify-center bg-paper px-5 py-12 sm:px-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Brand tone="light" />
          </div>

          <p className="eyebrow">Welcome back</p>
          <h2 className="mt-1.5 font-sans text-2xl font-semibold tracking-tight text-ink">
            Sign in to Cadence
          </h2>
          <p className="mt-1.5 text-sm text-ink-muted">
            Use one of the demo accounts below to explore the dashboard.
          </p>

          <form onSubmit={submit} className="mt-7 flex flex-col gap-4">
            <Field label="Work email" htmlFor="email">
              <Input
                id="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </Field>

            <Field label="Password" htmlFor="password">
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </Field>

            {error && <ErrorState error={error} compact />}

            <Button type="submit" size="lg" loading={loading} iconRight={ArrowRight} className="mt-1">
              Sign in
            </Button>
          </form>

          <div className="mt-8 rounded-xl border border-line bg-surface p-3.5">
            <p className="eyebrow mb-2.5">Demo accounts &middot; password123</p>
            <ul className="space-y-1">
              {DEMO_ACCOUNTS.map((account) => (
                <li key={account.email}>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail(account.email)
                      setPassword('password123')
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left transition hover:bg-raised"
                  >
                    <span className="font-mono text-xs text-ink">{account.email}</span>
                    <span className="font-mono text-2xs uppercase tracking-wider text-ink-faint">
                      {account.role}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
