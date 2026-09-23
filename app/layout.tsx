import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import { RegistrarSW } from "@/components/pwa";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-bricolage",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kit da Decoradora",
  description: "Seu acervo de projetos de festa e a calculadora de orçamento.",
  applicationName: "Kit da Decoradora",
  appleWebApp: { capable: true, title: "Decoradora", statusBarStyle: "default" },
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#B0306B",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${bricolage.variable} ${inter.variable}`}>
      <body>
        {children}
        <RegistrarSW />
      </body>
    </html>
  );
}
