import { apiFetch } from '@/lib/api'

interface AuditEntry {
  id: string
  action: string
  resource: string
  resourceId: string | null
  meta: Record<string, unknown> | null
  user: { id: string; name: string; email: string } | null
  createdAt: string
}

const ACTION_LABELS: Record<string, string> = {
  'document.signed':    '✍️ Document signé',
  'team.invited':       '📧 Collaborateur invité',
  'chantier.created':   '🏗️ Chantier créé',
  'chantier.deleted':   '🗑️ Chantier supprimé',
  'plan.changed':       '💳 Plan modifié',
  'magic_link.sent':    '🔗 Magic link envoyé',
}

export default async function AuditPage() {
  let logs: AuditEntry[] = []

  try {
    logs = await apiFetch<AuditEntry[]>('/api/audit')
  } catch {}

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-2">Journal d'activité</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Toutes les actions importantes effectuées sur votre espace.
      </p>

      <div className="border rounded-lg overflow-hidden">
        {logs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            Aucune activité enregistrée
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Action</th>
                <th className="text-left px-4 py-3 font-medium">Ressource</th>
                <th className="text-left px-4 py-3 font-medium">Par</th>
                <th className="text-left px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <span>{ACTION_LABELS[log.action] ?? log.action}</span>
                    {log.meta && Object.keys(log.meta).length > 0 && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {Object.entries(log.meta).map(([k, v]) => (
                          <span key={k} className="mr-2">{k}: {String(v)}</span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <span className="capitalize">{log.resource}</span>
                    {log.resourceId && (
                      <span className="ml-1 text-xs font-mono">{log.resourceId.slice(0, 8)}…</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {log.user ? (
                      <div>
                        <div className="font-medium">{log.user.name || log.user.email}</div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Système</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('fr-FR', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
