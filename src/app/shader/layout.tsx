import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shader Playground | lvnsn sndbx",
  description: "Upload images and apply WebGL shader effects with interactive controls",
};

export default function ShaderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
