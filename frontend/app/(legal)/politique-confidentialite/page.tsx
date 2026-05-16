import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politique de confidentialité — Artisan Portal',
}

export default function PolitiqueConfidentialitePage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1>Politique de confidentialité</h1>
      <p className="text-sm text-gray-500">Dernière mise à jour : mai 2026</p>

      <h2>1. Responsable du traitement</h2>
      <p>
        <strong>ARTISAN PORTAL SAS</strong><br />
        12 rue de l&apos;Innovation, 75001 Paris<br />
        Email DPO : <a href="mailto:dpo@artisan-portal.fr">dpo@artisan-portal.fr</a>
      </p>

      <h2>2. Données collectées</h2>
      <p>Nous collectons les données suivantes :</p>
      <ul>
        <li><strong>Données de compte</strong> : nom, adresse email, numéro de téléphone</li>
        <li><strong>Données de facturation</strong> : informations de paiement (gérées par Stripe, jamais stockées chez nous)</li>
        <li><strong>Données d&apos;utilisation</strong> : logs de connexion, actions dans l&apos;application</li>
        <li><strong>Données chantiers</strong> : documents, photos, messages — fournis par l&apos;artisan</li>
      </ul>

      <h2>3. Finalités du traitement</h2>
      <table>
        <thead>
          <tr><th>Finalité</th><th>Base légale</th></tr>
        </thead>
        <tbody>
          <tr><td>Fourniture du service</td><td>Exécution du contrat</td></tr>
          <tr><td>Facturation</td><td>Obligation légale</td></tr>
          <tr><td>Support client</td><td>Intérêt légitime</td></tr>
          <tr><td>Amélioration du produit</td><td>Intérêt légitime</td></tr>
          <tr><td>Communications marketing</td><td>Consentement</td></tr>
        </tbody>
      </table>

      <h2>4. Durée de conservation</h2>
      <ul>
        <li>Données de compte actif : durée de l&apos;abonnement + 3 ans</li>
        <li>Données de facturation : 10 ans (obligation comptable)</li>
        <li>Logs techniques : 12 mois</li>
        <li>Après suppression de compte : données anonymisées sous 30 jours</li>
      </ul>

      <h2>5. Partage des données</h2>
      <p>Vos données peuvent être partagées avec :</p>
      <ul>
        <li><strong>Stripe</strong> (paiement) — <a href="https://stripe.com/fr/privacy" target="_blank" rel="noopener noreferrer">politique Stripe</a></li>
        <li><strong>AWS</strong> (stockage fichiers S3) — hébergement EU (Paris)</li>
        <li><strong>Twilio</strong> (SMS) — uniquement si SMS activés sur votre plan</li>
        <li><strong>OVHcloud</strong> (hébergement) — serveurs en France</li>
      </ul>
      <p>Nous ne vendons jamais vos données à des tiers.</p>

      <h2>6. Vos droits (RGPD)</h2>
      <p>Conformément au RGPD, vous disposez des droits suivants :</p>
      <ul>
        <li><strong>Accès</strong> : obtenir une copie de vos données</li>
        <li><strong>Rectification</strong> : corriger des données inexactes</li>
        <li><strong>Effacement</strong> : supprimer votre compte et vos données</li>
        <li><strong>Portabilité</strong> : exporter vos données en JSON/CSV</li>
        <li><strong>Opposition</strong> : vous opposer au traitement marketing</li>
        <li><strong>Limitation</strong> : limiter le traitement dans certains cas</li>
      </ul>
      <p>
        Pour exercer vos droits :{' '}
        <a href="mailto:dpo@artisan-portal.fr">dpo@artisan-portal.fr</a>.
        Réponse sous 30 jours. Vous pouvez également saisir la{' '}
        <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">CNIL</a>.
      </p>

      <h2>7. Cookies</h2>
      <p>
        Artisan Portal utilise uniquement un cookie de session HttpOnly pour l&apos;authentification.
        Ce cookie est strictement nécessaire et ne requiert pas de consentement.
        Aucun cookie publicitaire ou de tracking tiers n&apos;est utilisé.
      </p>

      <h2>8. Sécurité</h2>
      <p>
        Vos données sont protégées par : chiffrement TLS en transit, chiffrement AES-256
        au repos sur S3, authentification JWT avec rotation des clés, accès limité au
        personnel habilité, sauvegardes quotidiennes chiffrées.
      </p>

      <h2>9. Modifications</h2>
      <p>
        Cette politique peut être mise à jour. Toute modification substantielle sera
        notifiée par email 30 jours avant son entrée en vigueur.
      </p>
    </article>
  )
}
