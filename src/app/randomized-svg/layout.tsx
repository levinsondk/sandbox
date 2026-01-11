import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Randomized SVG Shapes | lvnsn sndbx",
  description: "Randomly generated SVG shapes with constrained vertices",
};

export default function RandomizedSvgLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
