import type { Metadata } from "next";
import "./globals.css";
import { SourceDrawerProvider } from "../components/SourceDrawerContext";
import { SourceDrawer } from "../components/SourceDrawer";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

export const metadata: Metadata = {
  title: "GCC Atlas — The Independent Record of India's GCC Ecosystem",
  description:
    "An independent, citable record of India's Global Capability Centre (GCC) ecosystem. Every number traced to a primary source.",
  keywords: [
    "India GCC",
    "Global Capability Centres",
    "GCC Atlas",
    "Bengaluru GCC",
    "Hyderabad GCC",
    "GCC Registry",
    "GCC Reconcile",
    "India Tech Hubs",
    "Captive Centers",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-paper text-ink min-h-screen flex flex-col font-sans antialiased selection:bg-verdigris selection:text-surface">
        <SourceDrawerProvider>
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
            {children}
          </main>
          <Footer />
          <SourceDrawer />
        </SourceDrawerProvider>
      </body>
    </html>
  );
}
