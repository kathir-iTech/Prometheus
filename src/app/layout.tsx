import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#05070b",
};

export const metadata: Metadata = {
  title: {
    default: "Prometheus Multi-Agent AI Swarm Engine",
    template: "%s | Prometheus Swarm",
  },
  description:
    "Enterprise-grade multi-agent swarm for real-time code analysis, security scanning, and optimization intelligence. Architect, Security & Optimization agents streaming via SSE on Next.js 15.",
  metadataBase: new URL("https://prometheus-swarm.local"),
  openGraph: {
    title: "Prometheus Multi-Agent AI Swarm Engine",
    description:
      "Enterprise-grade multi-agent swarm for real-time code analysis, security scanning, and optimization intelligence.",
    url: "https://prometheus-swarm.local",
    siteName: "Prometheus Swarm",
    images: [
      {
        url: "/prometheus-social.png",
        width: 1200,
        height: 630,
        alt: "Prometheus Multi-Agent AI Swarm Engine – live code intelligence",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Prometheus Multi-Agent AI Swarm Engine",
    description:
      "Enterprise-grade multi-agent swarm for real-time code analysis, security scanning, and optimization intelligence.",
    images: ["/prometheus-social.png"],
  },
  authors: [{ name: "Prometheus AI" }],
  category: "technology",
  keywords: [
    "multi-agent",
    "AI swarm",
    "code analysis",
    "security scanning",
    "optimization",
    "Next.js 15",
    "Prometheus",
    "AST",
    "cyclomatic complexity",
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
    name: "Prometheus Multi-Agent AI Swarm Engine",
    description:
      "Enterprise-grade multi-agent swarm for real-time code analysis, security scanning, and optimization intelligence.",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    author: { "@type": "Organization", name: "Prometheus AI" },
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
    <html lang="en">
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
