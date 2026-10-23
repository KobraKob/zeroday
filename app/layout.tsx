import type { Metadata } from "next";
import "./globals.css";
import { SourceDrawerProvider } from "../components/SourceDrawerContext";
import { SourceDrawer } from "../components/SourceDrawer";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { AskProvider } from "../components/AskContext";
import { AskDrawer } from "../components/AskDrawer";
import { AskOrb } from "../components/AskOrb";
import { HighlightToAsk } from "../components/HighlightToAsk";

export const metadata: Metadata = {
  title: "ZeroDay — The Independent Grounded Intelligence Platform",
  description:
    "An independent, citable record of India's Global Capability Centre (GCC) ecosystem. Every number traced to a primary source.",
  keywords: [
    "ZeroDay",
    "India GCC",
    "Global Capability Centres",
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
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          id="zeroday-theme-init"
          dangerouslySetInnerHTML={{
            __html: `try { var savedTheme = localStorage.getItem("zeroday-theme"); if (savedTheme === "light") { document.documentElement.classList.remove("dark"); } else { document.documentElement.classList.add("dark"); } } catch (_) { document.documentElement.classList.add("dark"); }`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-paper text-ink min-h-screen flex flex-col font-sans antialiased selection:bg-cobalt selection:text-white">
        <SourceDrawerProvider>
          <AskProvider>
            <Navbar />
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
              {children}
            </main>
            <Footer />
            <SourceDrawer />
            <AskDrawer />
            <AskOrb />
            <HighlightToAsk />
          </AskProvider>
        </SourceDrawerProvider>
      </body>
    </html>
  );
}
