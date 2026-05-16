import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Conditions Générales de Vente — Artisan Portal',
}

export default function CGVPage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1>Conditions Générales de Vente</h1>
      <p className="text-sm text-gray-500">Dernière mise à jour : mai 2026</p>

      <h2>1. Objet</h2>
      <p>
        Les présentes Conditions Générales de Vente (CGV) régissent l&apos;utilisation du service
        <strong> Artisan Portal</strong>, logiciel en mode SaaS (Software as a Service) édité par
        ARTISAN PORTAL SAS, permettant aux artisans et PME de gérer leur relation client
        (portail client, documents, photos, suivi de chantiers).
      </p>

      <h2>2. Acceptation</h2>
      <p>
        Toute souscription à un abonnement Artisan Portal implique l&apos;acceptation sans réserve
        des présentes CGV. Ces CGV prévalent sur tout autre document.
      </p>

      <h2>3. Offres et tarifs</h2>
      <table>
        <thead>
          <tr>
            <th>Plan</th>
            <th>Prix HT/mois</th>
            <th>Principales limites</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Débutant</td>
            <td>29 €</td>
            <td>5 chantiers, pas de SMS</td>
          </tr>
          <tr>
            <td>Professionnel</td>
            <td>59 €</td>
            <td>Illimité, SMS inclus, branding</td>
          </tr>
          <tr>
            <td>Entreprise</td>
            <td>99 €</td>
            <td>Multi-collaborateurs, API, support prioritaire</td>
          </tr>
        </tbody>
      </table>
      <p>
        Les prix sont indiqués hors TVA. La TVA applicable est de 20 %.
        Les tarifs peuvent être révisés avec un préavis de 30 jours par email.
      </p>

      <h2>4. Essai gratuit</h2>
      <p>
        Tout nouvel utilisateur bénéficie d&apos;une période d&apos;essai gratuite de <strong>14 jours</strong>,
        sans engagement ni carte bancaire requise. À l&apos;issue de cette période, un abonnement
        payant est nécessaire pour continuer à utiliser le service.
      </p>

      <h2>5. Facturation et paiement</h2>
      <p>
        La facturation est mensuelle, prélevée à la date d&apos;anniversaire de l&apos;abonnement via
        Stripe (carte bancaire ou SEPA). En cas d&apos;échec de paiement, le compte est suspendu
        après 7 jours et les données conservées 30 jours supplémentaires.
      </p>

      <h2>6. Résiliation</h2>
      <p>
        L&apos;abonnement peut être résilié à tout moment depuis le tableau de bord (Paramètres →
        Facturation). La résiliation prend effet à la fin de la période mensuelle en cours.
        Aucun remboursement prorata n&apos;est effectué, sauf obligation légale.
      </p>

      <h2>7. Droit de rétractation</h2>
      <p>
        Conformément à l&apos;article L221-28 du Code de la consommation, le droit de rétractation
        ne s&apos;applique pas aux abonnements SaaS dont l&apos;exécution a commencé avec l&apos;accord exprès
        du consommateur. Toutefois, Artisan Portal offre un remboursement intégral dans les
        <strong> 14 jours</strong> suivant la première souscription payante sur simple demande.
      </p>

      <h2>8. Disponibilité du service</h2>
      <p>
        Artisan Portal s&apos;engage à maintenir une disponibilité du service de <strong>99,5 % par mois</strong>,
        hors maintenance planifiée (annoncée 48h à l&apos;avance). En cas d&apos;indisponibilité prolongée
        imputable à Artisan Portal, une compensation proportionnelle sera appliquée sur la
        prochaine facture.
      </p>

      <h2>9. Données et confidentialité</h2>
      <p>
        Artisan Portal traite les données des clients finaux de l&apos;artisan en qualité de
        sous-traitant au sens du RGPD. L&apos;artisan reste responsable du traitement de ces données.
        Un DPA (Data Processing Agreement) est disponible sur demande.
      </p>

      <h2>10. Responsabilité</h2>
      <p>
        La responsabilité d&apos;ARTISAN PORTAL SAS est limitée au montant des sommes perçues au
        cours des 3 derniers mois précédant le sinistre. ARTISAN PORTAL SAS n&apos;est pas
        responsable des pertes indirectes (manque à gagner, perte de données non sauvegardées, etc.).
      </p>

      <h2>11. Loi applicable et juridiction</h2>
      <p>
        Les présentes CGV sont soumises au droit français. Tout litige sera soumis
        aux tribunaux compétents de Paris, après tentative de résolution amiable.
      </p>

      <h2>12. Contact</h2>
      <p>
        Pour toute question relative aux présentes CGV :{' '}
        <a href="mailto:contact@artisan-portal.fr">contact@artisan-portal.fr</a>
      </p>
    </article>
  )
}
