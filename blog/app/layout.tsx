import type { Metadata, Viewport } from "next";
import { Inter, Outfit, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import AmbientBackground from "@/components/ambient-background";
import "./globals.css";
import "highlight.js/styles/github-dark.min.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
  weight: ["600", "700", "800"],
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
  weight: ["400", "500"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Linkdinger — AI Tools & Thoughts",
    template: "%s | Linkdinger",
  },
  description:
    "AI-powered tools and thoughts. Every commit lands on GitHub for you to fork & remix.",
  alternates: {
    canonical: "/",
    languages: {
      en: "/en",
      th: "/th",
      "x-default": "/",
    },
    types: {
      "application/rss+xml": "/rss.xml",
    },
  },
  openGraph: {
    title: "Linkdinger",
    description: "AI-powered tools and thoughts.",
    type: "website",
    locale: "en_US",
    siteName: "Linkdinger",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Linkdinger",
    description: "AI-powered tools and thoughts.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${outfit.variable} ${jetbrains.variable}`}
    >
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange={false}
        >
          <AmbientBackground />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
