import { Inter } from 'next/font/google';
import resume from '@/data/resume.json';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const url = resume.meta.website;

export const metadata = {
  metadataBase: new URL(url),
  title: {
    default: `${resume.meta.name} — ${resume.meta.title}`,
    template: `%s — ${resume.meta.name}`,
  },
  description: resume.meta.tagline,
  keywords: [
    resume.meta.name,
    'Frontend Developer',
    'React.js',
    'JavaScript',
    'SaaS',
    'Puducherry',
    'Portfolio',
  ],
  authors: [{ name: resume.meta.name, url }],
  creator: resume.meta.name,
  openGraph: {
    type: 'website',
    url,
    title: `${resume.meta.name} — ${resume.meta.title}`,
    description: resume.meta.tagline,
    siteName: `${resume.meta.name} Portfolio`,
    // The hero plate, at its native 1376×768 — near enough the 1.91:1 the
    // large-card crop wants. Without an image here, `summary_large_image`
    // below was a promise with nothing behind it: shares rendered bare text.
    images: [{ url: '/hero-portrait.png', width: 1376, height: 768 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${resume.meta.name} — ${resume.meta.title}`,
    description: resume.meta.tagline,
    images: ['/hero-portrait.png'],
  },
  robots: { index: true, follow: true },
};

export const viewport = {
  // Explicit: exporting a `viewport` object replaces Next's default, and
  // without width/initialScale mobile Chrome lays the page out at ~980px and
  // scales it down — measured innerWidth 551 on a 390px device.
  width: 'device-width',
  initialScale: 1,
  // Not maximumScale/userScalable — pinch-zoom is an accessibility right.
  themeColor: '#080605',
  colorScheme: 'dark',
};

/** JSON-LD so the resume is machine-readable to search engines, not just pretty. */
const personSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: resume.meta.name,
  jobTitle: resume.meta.title,
  email: `mailto:${resume.meta.email}`,
  telephone: resume.meta.phone,
  url,
  address: { '@type': 'PostalAddress', addressLocality: resume.meta.location },
  sameAs: resume.socials.filter((s) => s.url.startsWith('http')).map((s) => s.url),
  knowsAbout: resume.skills.flatMap((g) => g.items),
  alumniOf: resume.education.map((e) => ({
    '@type': 'CollegeOrUniversity',
    name: e.institution,
  })),
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="grain">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
        />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-6 focus:top-6 focus:z-[100] focus:rounded-full focus:bg-white focus:px-5 focus:py-2.5 focus:text-sm focus:font-medium focus:text-black"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
