import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'http://www.zerov.co.kr',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ]
}