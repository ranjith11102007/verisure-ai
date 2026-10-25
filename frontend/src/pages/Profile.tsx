import { useEffect, useState } from 'react'
import { usersApi, getApiError, formatDate } from '../lib/api'
import { Card, ErrorBanner, Field, PageHeader, PrimaryButton, StatusBadge, inputClass } from '../components/ui'

export default function Profile() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [fullName, setFullName] = useState('')
  const [saving, setSaving] = useState(false)
  const [info, setInfo] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await usersApi.me()
      setProfile(res.data)
      setFullName(res.data.full_name || '')
    } catch (err: any) {
      setError(getApiError(err, 'Failed to load profile'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setInfo('')
    try {
      const res = await usersApi.update(fullName)
      setProfile((p: any) => ({ ...p, full_name: res.data.full_name }))
      setInfo('Profile updated successfully.')
    } catch (err: any) {
      setError(getApiError(err, 'Could not update profile'))
    } finally {
      setSaving(false)
    }
  }

  const initials = (profile?.full_name || profile?.email || 'U')
    .split(' ')
    .map((s: string) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" subtitle="Your account identity and access level" />

      {error && <ErrorBanner message={error} onRetry={load} />}
      {info && (
        <div className="rounded-lg border border-secondary/30 bg-secondary-fixed/30 px-4 py-3 text-sm text-on-secondary-fixed-variant">
          {info}
        </div>
      )}

      {loading ? (
        <Card>
          <div className="text-center py-12 text-on-surface-variant">Loading...</div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-on-primary text-2xl font-bold">
                {initials}
              </div>
              <h2 className="mt-4 text-lg font-headline font-semibold text-on-surface">{profile?.full_name}</h2>
              <p className="text-sm text-on-surface-variant">{profile?.email}</p>
              <div className="mt-3">
                <StatusBadge status={profile?.role} />
              </div>
            </div>
            <dl className="mt-6 space-y-3 text-sm border-t border-outline-variant/20 pt-4">
              <div className="flex items-center justify-between">
                <dt className="text-on-surface-variant">Account status</dt>
                <dd className="text-on-surface">{profile?.is_active ? 'Active' : 'Inactive'}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-on-surface-variant">Member since</dt>
                <dd className="text-on-surface">{formatDate(profile?.created_at)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-on-surface-variant">User ID</dt>
                <dd className="font-mono text-[11px] text-on-surface break-all max-w-[140px] text-right">
                  {profile?.id}
                </dd>
              </div>
            </dl>
          </Card>

          <Card className="lg:col-span-2">
            <h2 className="text-lg font-headline font-semibold text-on-surface mb-1">Account Details</h2>
            <p className="text-sm text-on-surface-variant mb-4">Update the name associated with your submissions</p>
            <form onSubmit={save} className="space-y-4 max-w-md">
              <Field label="Full Name">
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className={inputClass}
                />
              </Field>
              <Field label="Email Address" hint="Email changes require administrative approval">
                <input value={profile?.email || ''} disabled className={`${inputClass} opacity-60`} />
              </Field>
              <Field label="Access Role" hint="Roles are assigned by a system administrator">
                <input value={profile?.role || ''} disabled className={`${inputClass} opacity-60 capitalize`} />
              </Field>
              <PrimaryButton type="submit" icon="save" disabled={saving || fullName === profile?.full_name}>
                {saving ? 'Saving...' : 'Save Changes'}
              </PrimaryButton>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
