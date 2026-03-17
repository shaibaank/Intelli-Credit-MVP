import type { Metadata } from "next";
import { Kalam, Patrick_Hand } from "next/font/google";
import "./globals.css";

const headingFont = Kalam({
  variable: "--font-heading",
  weight: ["700"],
  subsets: ["latin"],
});

const bodyFont = Patrick_Hand({
  variable: "--font-body",
  weight: ["400"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Intelli-Credit - NBFC Credit Underwriting",
  description: "AI-powered credit decisioning cockpit for corporate underwriting.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${headingFont.variable} ${bodyFont.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
