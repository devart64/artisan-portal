import { ExportButton } from './ExportButtons'

export default function ExportPage() {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-2">Export comptabilité</h1>
      <p className="text-muted-foreground text-sm mb-8">
        Exportez vos données pour votre logiciel de comptabilité (Pennylane, Indy, Excel…)
      </p>

      <div className="space-y-4">
        <div className="border rounded-lg p-6 bg-card">
          <h2 className="font-semibold mb-1">Chantiers</h2>
          <p className="text-muted-foreground text-sm mb-4">
            Export CSV de tous vos chantiers avec statut, client, adresse, dates.
          </p>
          <ExportButton path="/api/export/chantiers.csv" label="Télécharger chantiers.csv" />
        </div>

        <div className="border rounded-lg p-6 bg-card">
          <h2 className="font-semibold mb-1">Documents</h2>
          <p className="text-muted-foreground text-sm mb-4">
            Export CSV de tous vos documents (devis, factures) avec statut de signature.
          </p>
          <ExportButton path="/api/export/documents.csv" label="Télécharger documents.csv" />
        </div>

        <div className="border border-muted rounded-lg p-6 bg-muted/20">
          <h2 className="font-semibold mb-1 text-muted-foreground">Prochainement</h2>
          <p className="text-muted-foreground text-sm">
            Connexion directe Pennylane, Indy, QuickBooks — export automatique mensuel
          </p>
        </div>
      </div>
    </div>
  )
}
