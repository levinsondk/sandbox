import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rubber Banding | lvnsn sndbx",
  description: "Rubber banding interaction demo",
};

export default function RubberBandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
