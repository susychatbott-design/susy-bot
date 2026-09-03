import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Susybot | Municipalidad de Ituzaingó, Corrientes",
  description: "Directora Virtual de Atención al Vecino e Innovación Urbana. Trámites, reclamos urbanos, turismo en Esteros del Iberá y atención inclusiva.",
  icons: {
    icon: "https://ituzaingo.gob.ar/turismo/wp-content/uploads/2024/11/version-marginada.jpg",
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
