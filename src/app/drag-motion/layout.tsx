import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Drag Motion | lvnsn sndbx",
  description: "Interactive drag and motion demo with Framer Motion",
};

export default function DragMotionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
