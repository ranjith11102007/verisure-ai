import { useEffect, useState } from 'react'
import { usersApi, systemApi } from '../lib/api'
import { Card, Field, PageHeader, PrimaryButton, inputClass } from '../components/ui'

const STORAGE_KEY = 'verisure.preferences'

const defaultPrefs = {
  emailNotifications: true,
  evidenceAlerts: true,
  weeklyDigest: false,
  compactTables: false,
  showAuditDetails: true,
}

export default function Settings() {
  const [prefs, setPrefs] = useState(defaultPrefs)
  const [profile, setProfile] = useState<any>(null)
  const [saved, setSaved] = useState(false)
  const [db, setDb] = useState<any>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setPrefs({ ...defaultPrefs, ...JSON.parse(raw) })
    } catch {
      // ignore malformed preferences
    }
    usersApi
      .me()
      .then((res) => setProfile(res.data))
      .catch(() => setProfile(null))
    systemApi
      .database()
      .then((res) => setDb(res.data))
      .catch(() => setDb(null))
  }, [])

  const update = (key: keyof typeof defaultPrefs, value: boolean) => {
    setPrefs((p) => ({ ...p, [key]: value }))
    setSaved(false)
  }

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
    setSaved(true)
    setTimeout(() => setSaved(false), 4000)
  }

  const toggles: { key: keyof typeof defaultPrefs; label: string; description: string }[] = [
    {
      key: 'emailNotifications',
      label: 'Email notifications',
      description: 'Receive workflow notifications at your registered address.',
    },
    {
      key: 'evidenceAlerts',
      label: 'Evidence request alerts',
      description: 'Highlight new evidence requests on the dashboard.',
    },
    {
      key: 'weeklyDigest',
      label: 'Weekly compliance digest',
      description: 'Summarise new findings and decisions every week.',
    },
    {
      key: 'compactTables',
      label: 'Compact table density',
      description: 'Show more rows per screen in registries.',
    },
    {
      key: 'showAuditDetails',
      label: 'Show raw audit details',
      description: 'Display the JSON payload for audit events.',
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Configure how the platform presents information to you" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-headline font-semibold text-on-surface mb-1">Workspace Preferences</h2>
          <p className="text-sm text-on-surface-variant mb-4">
            Stored locally in this browser for this demo environment.
          </p>
          <div className="space-y-4">
            {toggles.map((t) => (
              <label key={t.key} className="flex items-start justify-between gap-4 cursor-pointer">
                <span>
                  <span className="block text-sm font-medium text-on-surface">{t.label}</span>
                  <span className="block text-xs text-on-surface-variant mt-0.5">{t.description}</span>
                </span>
                <button
                  type="button"
                  onClick={() => update(t.key, !prefs[t.key])}
                  className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                    prefs[t.key] ? 'bg-primary' : 'bg-surface-container-high'
                  }`}
                  aria-pressed={prefs[t.key]}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${
                      prefs[t.key] ? 'left-[22px]' : 'left-0.5'
                    }`}
                  ></span>
                </button>
              </label>
            ))}
          </div>
          <div className="mt-5 flex items-center gap-3">
            <PrimaryButton icon="save" onClick={save}>
              Save Preferences
            </PrimaryButton>
            {saved && <span className="text-sm text-secondary">Saved</span>}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-headline font-semibold text-on-surface mb-1">Account</h2>
            <p className="text-sm text-on-surface-variant mb-4">Identity currently signed in to this workspace</p>
            <Field label="Signed in as">
              <input value={profile?.email || '-'} disabled className={`${inputClass} opacity-60`} />
            </Field>
            <div className="mt-3">
              <Field label="Access role">
                <input
                  value={profile?.role || '-'}
                  disabled
                  className={`${inputClass} opacity-60 capitalize`}
                />
              </Field>
            </div>
            <p className="text-xs text-on-surface-variant mt-3">
              Role and email changes are managed by an administrator.
            </p>
          </Card>

          <Card>
            <h2 className="text-lg font-headline font-semibold text-on-surface mb-1">Platform Information</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-on-surface-variant">Application</dt>
                <dd className="text-on-surface">VeriSure AI</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-on-surface-variant">Version</dt>
                <dd className="text-on-surface">1.0.0</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-on-surface-variant">API base URL</dt>
                <dd className="text-on-surface font-mono text-[11px] break-all max-w-[220px] text-right">
                  {import.meta.env.VITE_API_BASE_URL || '(same origin)'}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-on-surface-variant">Storage</dt>
                <dd className="text-on-surface text-right">
                  {db
                    ? db.backend === 'postgresql'
                      ? 'PostgreSQL'
                      : db.is_fallback
                        ? 'SQLite (fallback)'
                        : 'SQLite'
                    : 'Checking…'}
                </dd>
              </div>
              {db && (
                <div className="flex items-center justify-between">
                  <dt className="text-on-surface-variant">Database tables</dt>
                  <dd className="text-on-surface">{db.table_count ?? '-'}</dd>
                </div>
              )}
            </dl>
            {db?.is_fallback && (
              <p className="mt-3 text-xs rounded bg-error-container/40 text-on-error-container px-3 py-2">
                The configured database is unreachable, so this deployment is using temporary
                local storage. Records will be lost when the service restarts.
              </p>
            )}
            {db && !db.is_fallback && db.backend === 'sqlite' && (
              <p className="mt-3 text-xs rounded bg-surface-container text-on-surface-variant px-3 py-2">
                This deployment uses local SQLite storage. Records persist while the service
                stays running but are cleared on redeploy.
              </p>
            )}
          </Card>

          <Card>
            <h2 className="text-lg font-headline font-semibold text-on-surface mb-1">Known Deployment Limits</h2>
            <ul className="mt-2 text-sm text-on-surface-variant space-y-1 list-disc pl-5">
              <li>Uploaded files use ephemeral storage and may be cleared on restart.</li>
              <li>OCR/deskew processing is disabled because Tesseract is unavailable on the free tier.</li>
              <li>The backend sleeps after inactivity on the free plan and wakes on the next request.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}
