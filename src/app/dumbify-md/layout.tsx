import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Markdown Display | lvnsn sndbx",
  description: "Experimenting with markdown and code block styling",
};

export default function DumbifyMdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
