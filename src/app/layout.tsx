import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sagestudio.vercel.app"),
  title: "SageStudio — Interactive Machine Learning & AI Visualizations",
  description:
    "Visualize. Experiment. Understand. Interactive visualizations for mathematics, machine learning, deep learning, neural networks, and optimization.",
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
  openGraph: {
    title: "SageStudio — Interactive ML & AI Visualizations",
    description:
      "Don't just read how an algorithm works — see it work. Interactive visualizations for AI, mathematics, and algorithms.",
    type: "website",
    images: [{ url: "/logo.svg", width: 120, height: 120, alt: "SageStudio" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrains.variable} antialiased`}>
        <ThemeProvider>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
