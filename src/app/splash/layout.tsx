import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Splash Generator | lvnsn sndbx",
  description: "Create parametric splash-like star shapes with sharp outer points and curved inner valleys",
};

export default function SplashLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
