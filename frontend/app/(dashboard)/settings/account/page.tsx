import { AccountClient } from './AccountClient'

export default function AccountPage() {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-2">Mon compte</h1>
      <p className="text-muted-foreground text-sm mb-8">Gérez vos données personnelles et votre compte.</p>
      <AccountClient />
    </div>
  )
}
