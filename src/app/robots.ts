import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = 'https://adh.today';

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/api/', '/dashboard/', '/instructor/', '/onboarding/'],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
