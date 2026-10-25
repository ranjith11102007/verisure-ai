import { useEffect, useState } from 'react'
import { complianceApi, getApiError, formatDate } from '../lib/api'
import {
  Card,
  EmptyState,
  ErrorBanner,
  Field,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  StatusBadge,
  inputClass,
} from '../components/ui'

const SEVERITIES = ['low', 'medium', 'high', 'critical']

export default function Rules() {
  const [rules, setRules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState({
    rule_code: '',
    name: '',
    description: '',
    applicable_category: '',
    severity: 'medium',
    source_ref: '',
  })

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await complianceApi.rules()
      setRules(res.data.rules || [])
    } catch (err: any) {
      setError(getApiError(err, 'Failed to load rules'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setSaving(true)
    try {
      await complianceApi.createRule({
        ...form,
        applicable_category: form.applicable_category || null,
        source_ref: form.source_ref || null,
      })
      setShowCreate(false)
      setForm({ rule_code: '', name: '', description: '', applicable_category: '', severity: 'medium', source_ref: '' })
      await load()
    } catch (err: any) {
      setFormError(getApiError(err, 'Could not create rule'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rules Engine"
        subtitle="Versioned statutory rules evaluated against every application"
        actions={<PrimaryButton icon="add" onClick={() => setShowCreate(true)}>New Rule</PrimaryButton>}
      />

      {error && <ErrorBanner message={error} onRetry={load} />}

      {showCreate && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-headline font-semibold text-on-surface">Define a compliance rule</h2>
            <button onClick={() => setShowCreate(false)} className="text-outline-variant hover:text-on-surface">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {formError && (
            <div className="mb-4 rounded bg-error-container/40 px-3 py-2 text-sm text-on-error-container">
              {formError}
            </div>
          )}

          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Rule Code" hint="Unique identifier, e.g. DOC-003">
              <input
                value={form.rule_code}
                onChange={(e) => setForm({ ...form, rule_code: e.target.value })}
                required
                className={inputClass}
                placeholder="DOC-003"
              />
            </Field>
            <Field label="Rule Name">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className={inputClass}
                placeholder="Documents must be legible"
              />
            </Field>
            <Field label="Severity">
              <select
                value={form.severity}
                onChange={(e) => setForm({ ...form, severity: e.target.value })}
                className={inputClass}
              >
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Applicable Category" hint="Optional; leave blank for all categories">
              <input
                value={form.applicable_category}
                onChange={(e) => setForm({ ...form, applicable_category: e.target.value })}
                className={inputClass}
                placeholder="New Establishment"
              />
            </Field>
            <div className="md:col-span-2">
              <Field label="Description">
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 rounded border border-outline-variant bg-surface-container-lowest text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </Field>
            </div>
            <Field label="Source Reference" hint="Statutory citation for the rule">
              <input
                value={form.source_ref}
                onChange={(e) => setForm({ ...form, source_ref: e.target.value })}
                className={inputClass}
                placeholder="Statutory Governance Circular 12/2024"
              />
            </Field>
            <div className="md:col-span-2 flex gap-2">
              <SecondaryButton onClick={() => setShowCreate(false)}>Cancel</SecondaryButton>
              <PrimaryButton type="submit" icon="save" disabled={saving}>
                {saving ? 'Saving...' : 'Create Rule'}
              </PrimaryButton>
            </div>
          </form>
        </Card>
      )}

      <Card padded={false}>
        {loading ? (
          <div className="text-center py-12 text-on-surface-variant">Loading...</div>
        ) : rules.length === 0 ? (
          <EmptyState
            icon="rule"
            title="No rules defined"
            description="Add statutory rules to enable automated compliance evaluation."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-container-low">
                <tr>
                  {['Code', 'Name', 'Severity', 'Category', 'Version', 'Source', 'Active'].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-2.5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {rules.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-container-low/40">
                    <td className="px-4 py-3 font-mono text-sm text-primary font-semibold">{r.rule_code}</td>
                    <td className="px-4 py-3 text-sm text-on-surface">
                      <div>{r.name}</div>
                      {r.description && (
                        <div className="text-xs text-on-surface-variant mt-0.5 max-w-md">{r.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.severity} />
                    </td>
                    <td className="px-4 py-3 text-sm text-on-surface-variant">{r.applicable_category || 'All'}</td>
                    <td className="px-4 py-3 text-sm text-on-surface-variant">v{r.version}</td>
                    <td className="px-4 py-3 text-xs text-on-surface-variant">{r.source_ref || '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-medium ${r.active ? 'text-secondary' : 'text-outline'}`}
                      >
                        {r.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-on-surface mb-2">Default rule set</h2>
        <p className="text-sm text-on-surface-variant">
          The platform seeds four baseline rules on first startup: document presence, minimum evidence set,
          organization registration number and verifiable institutional contact. Additional rules created here are
          evaluated immediately on the next compliance run.
        </p>
        {rules.length > 0 && (
          <p className="text-xs text-on-surface-variant mt-2">
            Rules last loaded {formatDate(new Date().toISOString())}.
          </p>
        )}
      </Card>
    </div>
  )
}
