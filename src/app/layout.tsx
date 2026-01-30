import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AgentationProvider } from "@/components/agentation-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "lvnsn sndbx",
  description: "shitcoding around",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        {children}
        <AgentationProvider />
      </body>
    </html>
  );
}
