import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", display: "swap", weight: ["500", "600", "700"] });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "Library Circulation Intelligence",
  description:
    "Unsupervised segmentation and semantic retrieval over real Seattle Public Library checkout data.",
  openGraph: {
    title: "Library Circulation Intelligence",
    description:
      "Segmenting and semantically searching 119k library titles from real Seattle Public Library open data.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${display.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
