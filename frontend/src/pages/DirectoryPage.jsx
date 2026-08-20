import { useState } from 'react'
import {
  Building2,
  CloudOff,
  Download,
  Globe,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
} from 'lucide-react'
import { externalService } from '@/services/externalService'
import { useAsync } from '@/hooks/useAsync'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useToast } from '@/context/ToastContext'
import { formatDateTime } from '@/lib/date'
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Panel,
  PanelHeader,
  SearchInput,
  Skeleton,
} from '@/components/ui'
import { PageHeader } from '@/components/layout/PageHeader'

/**
 * Demonstrates the third-party integration end to end. The browser never calls
 * the partner API directly - our backend owns the key, the timeout, the retry
 * policy, the cache and the rate limit, and returns a normalised shape.
 */
export function DirectoryPage() {
  useDocumentTitle('Partner directory')
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [importing, setImporting] = useState(null)

  const { data, loading, error, refetch, setData } = useAsync(
    () => externalService.users(),
    [reloadKey],
  )

  const refresh = async () => {
    setRefreshing(true)
    try {
      const fresh = await externalService.users(true)
      setData(fresh)
      toast.success('Directory refreshed', { description: `${fresh.count} contacts fetched.` })
    } catch (err) {
      toast.error("Couldn't reach the directory", { description: err.message })
    } finally {
      setRefreshing(false)
    }
  }

  const importContact = async (contact) => {
    setImporting(contact.external_id)
    try {
      const user = await externalService.importUser(contact.external_id)
      toast.success(`${user.name} added to the team`, {
        description: 'They can now be assigned tasks.',
      })
      setReloadKey((key) => key + 1)
    } catch (err) {
      toast.error("Couldn't import this contact", { description: err.message })
    } finally {
      setImporting(null)
    }
  }

  const contacts = (data?.items ?? []).filter((contact) => {
    if (!search) return true
    const term = search.toLowerCase()
    return (
      contact.name.toLowerCase().includes(term) ||
      contact.email.toLowerCase().includes(term) ||
      (contact.company ?? '').toLowerCase().includes(term)
    )
  })

  return (
    <>
      <PageHeader
        eyebrow="External API integration"
        title="Partner directory"
        description="Contacts pulled from a third-party REST API through our backend. Import anyone here to make them assignable inside Cadence."
        actions={
          <Button variant="secondary" icon={RefreshCw} onClick={refresh} loading={refreshing}>
            Refresh from source
          </Button>
        }
      />

      <Panel className="mb-4">
        <PanelHeader
          eyebrow="Integration"
          title={data?.source ?? 'Upstream directory'}
          meta={data ? `${data.count} contacts` : undefined}
          action={
            data?.cached ? (
              <Badge tone="neutral">Served from cache</Badge>
            ) : data ? (
              <Badge tone="accent">Fresh response</Badge>
            ) : null
          }
        />
        <dl className="grid grid-cols-2 divide-line text-sm sm:grid-cols-4 sm:divide-x">
          <div className="px-5 py-3">
            <dt className="eyebrow">Last fetched</dt>
            <dd className="mt-1 font-mono text-xs text-ink">
              {data ? formatDateTime(data.fetched_at) : '--'}
            </dd>
          </div>
          <div className="px-5 py-3">
            <dt className="eyebrow">Timeout</dt>
            <dd className="mt-1 font-mono text-xs text-ink">8s + 2 retries</dd>
          </div>
          <div className="px-5 py-3">
            <dt className="eyebrow">Cache</dt>
            <dd className="mt-1 font-mono text-xs text-ink">5 min TTL</dd>
          </div>
          <div className="px-5 py-3">
            <dt className="eyebrow">Rate limit</dt>
            <dd className="mt-1 font-mono text-xs text-ink">30 calls / min</dd>
          </div>
        </dl>
      </Panel>

      {error ? (
        <Panel>
          <EmptyState
            icon={CloudOff}
            title="The partner directory is unavailable"
            message={`${error.message} Cadence keeps working - only this page depends on the upstream service.`}
            action={
              <Button icon={RefreshCw} onClick={refetch}>
                Try again
              </Button>
            }
          />
        </Panel>
      ) : (
        <>
          <div className="mb-4">
            <SearchInput
              className="sm:w-80"
              value={search}
              onChange={setSearch}
              onClear={() => setSearch('')}
              placeholder="Search name, email or company"
            />
          </div>

          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-[184px] rounded-lg" />
              ))}
            </div>
          ) : contacts.length === 0 ? (
            <Panel>
              <EmptyState
                icon={Building2}
                title="No contacts match that search"
                message="Clear the search to see everyone the partner directory returned."
              />
            </Panel>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {contacts.map((contact) => (
                <article
                  key={contact.external_id}
                  className="flex flex-col rounded-lg border border-line bg-surface p-4 shadow-card"
                >
                  <div className="flex items-start gap-3">
                    <Avatar user={contact} size="md" />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-sans text-[15px] font-semibold text-ink">
                        {contact.name}
                      </h3>
                      {contact.company && (
                        <p className="truncate text-xs text-ink-muted">{contact.company}</p>
                      )}
                    </div>
                    <span className="font-mono text-3xs text-ink-faint">#{contact.external_id}</span>
                  </div>

                  <ul className="mt-3 flex-1 space-y-1.5 text-xs text-ink-muted">
                    <li className="flex items-center gap-2 truncate">
                      <Mail className="h-3.5 w-3.5 shrink-0 text-ink-faint" aria-hidden />
                      <span className="truncate font-mono">{contact.email}</span>
                    </li>
                    {contact.phone && (
                      <li className="flex items-center gap-2 truncate">
                        <Phone className="h-3.5 w-3.5 shrink-0 text-ink-faint" aria-hidden />
                        <span className="truncate font-mono">{contact.phone}</span>
                      </li>
                    )}
                    {contact.city && (
                      <li className="flex items-center gap-2 truncate">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-ink-faint" aria-hidden />
                        <span className="truncate">{contact.city}</span>
                      </li>
                    )}
                    {contact.website && (
                      <li className="flex items-center gap-2 truncate">
                        <Globe className="h-3.5 w-3.5 shrink-0 text-ink-faint" aria-hidden />
                        <span className="truncate font-mono">{contact.website}</span>
                      </li>
                    )}
                  </ul>

                  <div className="mt-4 border-t border-line pt-3">
                    {contact.already_imported ? (
                      <Badge tone="accent">Already on the team</Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={Download}
                        loading={importing === contact.external_id}
                        onClick={() => importContact(contact)}
                      >
                        Import as member
                      </Button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </>
  )
}
