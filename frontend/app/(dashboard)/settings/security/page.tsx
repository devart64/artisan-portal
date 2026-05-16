import { TwoFactorSetup } from './TwoFactorSetup'

export default function SecurityPage() {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-2">Sécurité</h1>
      <p className="text-muted-foreground text-sm mb-8">
        Protégez votre compte avec une authentification à deux facteurs.
      </p>
      <TwoFactorSetup />
    </div>
  )
}
