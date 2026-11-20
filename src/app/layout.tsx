import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Same bundled fonts as the app: no runtime font fetching.
const archivo = localFont({
  variable: "--font-archivo",
  src: [
    { path: "../fonts/Archivo-Regular.ttf", weight: "400" },
    { path: "../fonts/Archivo-Medium.ttf", weight: "500" },
    { path: "../fonts/Archivo-SemiBold.ttf", weight: "600" },
  ],
});

const caslon = localFont({
  variable: "--font-caslon",
  src: [{ path: "../fonts/LibreCaslonDisplay-Regular.ttf", weight: "400" }],
});

export const metadata: Metadata = {
  title: "Advertiser Hub",
  description: "Altomédia Advertiser Hub prototype, with sample data.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr-CA">
      <body className={`${archivo.variable} ${caslon.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
