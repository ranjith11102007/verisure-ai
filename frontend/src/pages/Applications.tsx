export default function Applications() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-headline font-bold text-on-surface">Institutional Applications Registry</h1>
          <p className="text-sm text-on-surface-variant mt-1">Search, triage, and audit all submitted applications</p>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 rounded bg-primary-container text-on-primary hover:bg-primary text-sm shadow-sm">
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>New Institutional Application</span>
        </button>
      </div>
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 p-6">
        <div className="text-center py-12 text-on-surface-variant">
          <span className="material-symbols-outlined text-4xl mb-2 block">folder_open</span>
          <p>No applications found. Create your first application.</p>
        </div>
      </div>
    </div>
  )
}
