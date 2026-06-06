import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";

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

export const metadata: Metadata = {
  title: "LaunchDB - 120+ SaaS Directories & Product Launchpads",
  description: "Submit your SaaS to the best directories, find early adopters, and build high-quality SEO backlinks. Real-time community-driven database of product launchpads.",
  keywords: ["SaaS directories", "SaaS launch", "product launchpads", "indie hackers", "startup submit", "SEO backlinks", "get early users", "submit startup", "LaunchDB"],
  authors: [{ name: "LaunchDB Community" }],
  verification: {
    google: "HfkcazAHaDFansnXxLY1LSDeiDfJaSeXJZb-8W7hesc",
  },
  openGraph: {
    title: "LaunchDB - 120+ SaaS Directories & Product Launchpads",
    description: "Submit your SaaS to the best directories, find early adopters, and build high-quality SEO backlinks. Real-time community-driven database of product launchpads.",
    url: "https://launchdb.vercel.app/",
    siteName: "LaunchDB",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LaunchDB - 120+ SaaS Directories & Product Launchpads",
    description: "Submit your SaaS to the best directories, find early adopters, and build high-quality SEO backlinks. Real-time community-driven database of product launchpads.",
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
    <html lang="en" className={`${outfit.variable} ${inter.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'light') {
                    document.documentElement.setAttribute('data-theme', 'light');
                  } else {
                    document.documentElement.setAttribute('data-theme', 'dark');
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
