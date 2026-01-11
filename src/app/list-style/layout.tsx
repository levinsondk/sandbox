import { Metadata } from "next";

export const metadata: Metadata = {
  title: "List Styles | lvnsn sndbx",
  description: "Exploring different list styling and typography options",
};

export default function ListStyleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
