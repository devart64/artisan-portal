import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mentions légales — Artisan Portal',
}

export default function MentionsLegalesPage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1>Mentions légales</h1>
      <p className="text-sm text-gray-500">Dernière mise à jour : mai 2026</p>

      <h2>1. Éditeur du site</h2>
      <p>
        Le site <strong>artisan-portal.fr</strong> est édité par la société :<br />
        <strong>ARTISAN PORTAL SAS</strong><br />
        12 rue de l&apos;Innovation, 75001 Paris<br />
        SIRET : XXX XXX XXX 00011<br />
        Capital social : 10 000 €<br />
        Directeur de la publication : Jean Dupont<br />
        Email : <a href="mailto:contact@artisan-portal.fr">contact@artisan-portal.fr</a>
      </p>

      <h2>2. Hébergement</h2>
      <p>
        Le site est hébergé par :<br />
        <strong>OVHcloud SAS</strong><br />
        2 rue Kellermann, 59100 Roubaix<br />
        RCS Lille Métropole 424 761 419 00045<br />
        Téléphone : 1007
      </p>

      <h2>3. Propriété intellectuelle</h2>
      <p>
        L&apos;ensemble du contenu de ce site (textes, images, logos, icônes, graphismes)
        est protégé par le droit d&apos;auteur et est la propriété exclusive d&apos;ARTISAN PORTAL SAS,
        sauf mention contraire. Toute reproduction, même partielle, est interdite sans
        autorisation écrite préalable.
      </p>

      <h2>4. Données personnelles</h2>
      <p>
        Artisan Portal collecte et traite vos données personnelles conformément au RGPD.
        Pour en savoir plus, consultez notre{' '}
        <a href="/politique-confidentialite">Politique de confidentialité</a>.
      </p>

      <h2>5. Cookies</h2>
      <p>
        Ce site utilise uniquement des cookies strictement nécessaires à son fonctionnement
        (session, authentification). Aucun cookie publicitaire ou de tracking n&apos;est déposé
        sans votre consentement.
      </p>

      <h2>6. Responsabilité</h2>
      <p>
        ARTISAN PORTAL SAS ne saurait être tenu responsable des dommages directs ou indirects
        causés au matériel de l&apos;utilisateur, résultant de l&apos;accès au site ou de l&apos;utilisation
        de ses services. Des liens hypertextes peuvent renvoyer vers des sites tiers sur
        lesquels nous n&apos;avons aucun contrôle.
      </p>

      <h2>7. Droit applicable</h2>
      <p>
        Les présentes mentions légales sont soumises au droit français.
        En cas de litige, les tribunaux compétents sont ceux de Paris.
      </p>
    </article>
  )
}
