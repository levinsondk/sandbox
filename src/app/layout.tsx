import type { Metadata } from "next";
import "./globals.css";
import { AgentationProvider } from "@/components/agentation-provider";

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
      <body className="antialiased font-sans">
        {children}
        <AgentationProvider />
      </body>
    </html>
  );
}
