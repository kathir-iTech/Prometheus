import type { Metadata, Viewport } from "next";
import { Manrope } from 'next/font/google';
import "./globals.css";

const manrope = Manrope({ subsets: ['latin'], variable: '--font-sans', weight: ['400', '500', '600', '700', '800'] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  title: {
    default: "VivaMind — Socratic Argumentation Engine",
    template: "%s | VivaMind",
  },
  description:
    "VivaMind is a Socratic argumentation engine. Students submit an argument, the system flags its weakest point and asks one question — it never states the missing evidence.",
  metadataBase: new URL("https://vivamind.local"),
  openGraph: {
    title: "VivaMind — Socratic Argumentation Engine",
    description:
      "VivaMind is a Socratic argumentation engine. Students submit an argument, the system flags its weakest point and asks one question.",
    url: "https://vivamind.local",
    siteName: "VivaMind",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "VivaMind — Socratic argumentation engine",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VivaMind — Socratic Argumentation Engine",
    description:
      "VivaMind is a Socratic argumentation engine. Students submit an argument, the system flags its weakest point and asks one question.",
    images: ["/og.png"],
  },
  authors: [{ name: "VivaMind" }],
  category: "education",
  keywords: [
    "socratic",
    "argumentation",
    "education",
    "critical thinking",
    "VivaMind",
    "Next.js 15",
  ],
  robots: {
    index: true,
    follow: true,
  },
};

function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "VivaMind",
    description:
      "Socratic argumentation engine that flags the weakest point of a student argument and asks one question without revealing the answer.",
    applicationCategory: "EducationApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    author: { "@type": "Organization", name: "VivaMind" },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={manrope.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      </head>
      <body>
        <JsonLd />
        {children}
      </body>
    </html>
  );
}
