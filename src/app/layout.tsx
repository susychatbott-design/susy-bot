import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Susy Bot | Asistente Municipal y Ciudadana Soberana",
  description: "Inteligencia artificial soberana para atenciÃ³n ciudadana, trÃ¡mites municipales, educaciÃ³n inclusiva y accesibilidad universal.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className="antialiased bg-[#080d1a] text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}