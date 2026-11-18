import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ExpoIngeniería Interactiva – Exabre 2026 · Universidad CESMAG",
  description:
    "Simulaciones técnicas interactivas de cuatro proyectos de ingeniería de la Universidad CESMAG.",
};

export const viewport: Viewport = {
  themeColor: "#0b1426",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
