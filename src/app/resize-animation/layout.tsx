import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resize Animation | lvnsn sndbx",
  description: "Aniumating child element, with parent following",
};

export default function ArcLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
