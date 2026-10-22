import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#080d1a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Susybot | Municipalidad de Ituzaingó, Corrientes • Nexora One",
  description: "Directora Virtual de Atención al Vecino e Innovación Urbana. Trámites, reclamos urbanos, turismo en Esteros del Iberá y atención inclusiva. Desarrollado por Nexora One (Tel: 3786414533 • mjnexora.visual@gmail.com).",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Susy Bot",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "application-name": "Susy Bot",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.__susyInstallPrompt = null;
              window.addEventListener('beforeinstallprompt', function(e) {
                e.preventDefault();
                window.__susyInstallPrompt = e;
                window.dispatchEvent(new CustomEvent('susy:install-ready', { detail: e }));
              });
            `,
          }}
        />
      </head>

      <body className="antialiased bg-[#080d1a] text-slate-100 min-h-dvh h-dvh overflow-hidden">
        {children}
      </body>
    </html>
  );
}

