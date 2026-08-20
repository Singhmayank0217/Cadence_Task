import { Link } from 'react-router-dom'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { Button } from '@/components/ui'

export function NotFoundPage() {
  useDocumentTitle('Page not found')
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="font-mono text-3xs uppercase tracking-[0.2em] text-ink-faint">Error 404</p>
      <h1 className="mt-3 font-sans text-3xl font-semibold tracking-tight text-ink">
        That page doesn&rsquo;t exist
      </h1>
      <p className="mt-2 max-w-sm text-sm text-ink-muted">
        The link may be out of date, or the task it pointed at has been deleted.
      </p>
      <Link to="/" className="mt-5">
        <Button>Back to dashboard</Button>
      </Link>
    </div>
  )
}
