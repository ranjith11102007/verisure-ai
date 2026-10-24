export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-on-surface-variant text-xs uppercase tracking-wider mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
            <span>Statutory Governance Engine</span>
            <span>/</span>
            <span>Real-time Oversight</span>
          </div>
          <h1 className="text-2xl font-headline font-bold text-on-surface">Executive Regulatory Oversight</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-surface-container-lowest border border-outline-variant/30 hover:bg-surface-container text-on-surface text-sm">
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span>Export Summary (CSV)</span>
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary hover:bg-primary-container text-on-primary text-sm shadow-sm">
            <span className="material-symbols-outlined text-[16px]">add_task</span>
            <span>Trigger Full Audit</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Submissions', value: '0', icon: 'account_balance', color: 'primary' },
          { label: 'Completed Validations', value: '0', icon: 'task_alt', color: 'secondary' },
          { label: 'Active Compliance', value: '0', icon: 'pending_actions', color: 'primary-container' },
          { label: 'Critical Exceptions', value: '0', icon: 'report_problem', color: 'error' },
        ].map((m, i) => (
          <div key={i} className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/20">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-outline">{m.label}</div>
              </div>
              <div className={`w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-${m.color}`}>
                <span className="material-symbols-outlined text-[20px]">{m.icon}</span>
              </div>
            </div>
            <div className="mt-4 text-3xl font-headline font-bold text-on-surface">{m.value}</div>
            <div className="mt-2 text-xs text-on-surface-variant">No data available</div>
          </div>
        ))}
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 p-6">
        <div className="mb-4">
          <h2 className="text-lg font-headline font-semibold text-on-surface">Recent High-Risk Applications</h2>
          <p className="text-sm text-on-surface-variant">Priority forensic scrutiny queue</p>
        </div>
        <div className="text-center py-12 text-on-surface-variant">
          <span className="material-symbols-outlined text-4xl mb-2 block">inbox</span>
          <p>No applications yet. Create your first application to begin.</p>
        </div>
      </div>
    </div>
  )
}
