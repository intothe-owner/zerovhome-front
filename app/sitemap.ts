import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://www.zerov.co.kr',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ]
}