import { Metadata } from "next";

export const metadata: Metadata = {
  title: "SVG Arc Visualizer | lvnsn sndbx",
  description: "Interactive tool for understanding and experimenting with SVG arc paths",
};

export default function ArcLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
