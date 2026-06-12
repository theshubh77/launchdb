import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import fallbackData from "../public/launchdb-fallback.json";

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit",
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

function getFormattedCount(count: number): string {
  if (count < 50) return `${count}`;
  return `${Math.floor(count / 50) * 50}+`;
}

const formattedCount = getFormattedCount(fallbackData.length);

export const metadata: Metadata = {
  metadataBase: new URL("https://launchdb.vercel.app"),
  title: `LaunchDB - ${formattedCount} SaaS Directories & Product Launchpads`,
  description: `Submit your SaaS to the best ${formattedCount} directories, find early adopters, and build high-quality SEO backlinks. Real-time community-driven database of product launchpads.`,
  keywords: ["SaaS directories", "SaaS launch", "product launchpads", "indie hackers", "startup submit", "SEO backlinks", "get early users", "submit startup", "LaunchDB", "Shubham Bhamare", "theshubh77"],
  authors: [
    { name: "Shubham Bhamare", url: "https://linktr.ee/theshubh77" },
    { name: "LaunchDB Community" }
  ],
  creator: "Shubham Bhamare",
  publisher: "Shubham Bhamare",
  verification: {
    google: "HfkcazAHaDFansnXxLY1LSDeiDfJaSeXJZb-8W7hesc",
  },
  openGraph: {
    title: `LaunchDB - ${formattedCount} SaaS Directories & Product Launchpads`,
    description: `Submit your SaaS to the best ${formattedCount} directories, find early adopters, and build high-quality SEO backlinks. Real-time community-driven database of product launchpads.`,
    url: "https://launchdb.vercel.app/",
    siteName: "LaunchDB",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "LaunchDB - SaaS Directories & Product Launchpads",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `LaunchDB - ${formattedCount} SaaS Directories & Product Launchpads`,
    description: `Submit your SaaS to the best ${formattedCount} directories, find early adopters, and build high-quality SEO backlinks. Real-time community-driven database of product launchpads.`,
    images: ["/og-image.jpg"],
    creator: "@theshubh77",
    site: "@theshubh77",
  },
  icons: {
    icon: [
      { url: "/favicon-64x64.png", sizes: "64x64", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'light') {
                    document.documentElement.setAttribute('data-theme', 'light');
                  } else if (theme === 'dark') {
                    document.documentElement.setAttribute('data-theme', 'dark');
                  } else {
                    var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                    document.documentElement.setAttribute('data-theme', systemTheme);
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        {children}
        <SpeedInsights />
        <Analytics />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-1ZQ1FX3D8Q"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-1ZQ1FX3D8Q');
          `}
        </Script>
      </body>
    </html>
  );
}
