import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import "./swipe-deck.css";
import "./performance.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const title = "DevMatch — Recrutamento técnico com contexto";
const description = "Plataforma que conecta empresas e desenvolvedores por perfil técnico, compatibilidade, projetos, matches e conversas.";

export const metadata: Metadata = {
  metadataBase: new URL("https://devmatch-neon.vercel.app"),
  title,
  description,
  applicationName: "DevMatch",
  openGraph: {
    title,
    description,
    url: "/",
    siteName: "DevMatch",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
