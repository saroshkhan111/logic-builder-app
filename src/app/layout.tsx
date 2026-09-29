import "@/app/globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";

import { ThemeProvider } from "@/components/layout/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Logic Builder — Build Logic Step-by-Step",
  description:
    "A visual, guided problem-solving tool that walks beginners through 6 proven steps " +
    "from understanding a problem to writing optimized code.",
  keywords: [
    "logic",
    "problem-solving",
    "programming",
    "education",
    "python",
    "pseudocode",
    "flowchart",
    "pep8",
  ],
  authors: [{ name: "Logic Builder" }],
  openGraph: {
    title: "Logic Builder — Build Logic Step-by-Step",
    description:
      "A visual, guided problem-solving tool that walks beginners through 6 proven steps " +
      "from understanding a problem to writing optimized code.",
    url: "https://logic-builder.app",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      // Browser extensions (e.g. the "data-copygoat-attached" attribute) mutate
      // <html> before React hydrates. React only controls the attributes it
      // renders, so this tells it to skip validating <html>'s attribute list
      // instead of reporting a hydration mismatch for third-party injections.
      suppressHydrationWarning
    >
      <head>
        <Script
          src="https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="bg-background text-foreground min-h-screen font-sans antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
