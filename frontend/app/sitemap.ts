import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://artisan-portal.fr', lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: 'https://artisan-portal.fr/login', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: 'https://artisan-portal.fr/register', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: 'https://artisan-portal.fr/cgv', lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: 'https://artisan-portal.fr/mentions-legales', lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: 'https://artisan-portal.fr/politique-confidentialite', lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ]
}
