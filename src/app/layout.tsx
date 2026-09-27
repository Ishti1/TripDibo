import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import Providers from "@/components/Providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "TripDibo — A little plan. A great adventure.",
  description: "Your personal travel space. Plan itineraries, track budgets, organize packing lists, and make room for adventure.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${outfit.variable} font-sans antialiased transition-colors duration-300 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen selection:bg-indigo-500/30 selection:text-indigo-900`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
